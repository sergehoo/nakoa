"""Pipeline d'analyse BAT — heuristiques solides + extension IA."""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass
from typing import Any

from ..models import BATAnalysis

logger = logging.getLogger(__name__)

MIN_DPI = 300
MIN_BLEED_MM = 3.0
MIN_SAFETY_MARGIN_MM = 5.0
PT_TO_MM = 0.352778


@dataclass
class BATIssue:
    severity: str
    code: str
    message: str
    recommendation: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
            "recommendation": self.recommendation,
        }


def _try_pymupdf():
    try:
        import fitz  # noqa: F401
        return True
    except ImportError:
        return False


def _analyze_with_pymupdf(file_bytes: bytes) -> dict[str, Any]:
    import fitz

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    info: dict[str, Any] = {
        "pages": len(doc),
        "page_sizes": [],
        "images": [],
        "fonts": set(),
        "fonts_all_embedded": True,
        "color_spaces": set(),
    }
    for page_num, page in enumerate(doc):
        rect = page.rect
        info["page_sizes"].append({
            "page": page_num + 1,
            "width_mm": round(rect.width * PT_TO_MM, 1),
            "height_mm": round(rect.height * PT_TO_MM, 1),
        })
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                info["images"].append({
                    "page": page_num + 1,
                    "width": pix.width,
                    "height": pix.height,
                    "colorspace": pix.colorspace.name if pix.colorspace else "unknown",
                })
                if pix.colorspace:
                    info["color_spaces"].add(pix.colorspace.name)
                pix = None
            except Exception:
                continue
        for font in page.get_fonts(full=True):
            info["fonts"].add(font[3])
            if not font[5]:
                info["fonts_all_embedded"] = False
    doc.close()
    info["fonts"] = list(info["fonts"])
    info["color_spaces"] = list(info["color_spaces"])
    return info


def _check_dpi(images, page_size):
    issues = []
    if not images:
        return issues
    page_w_in = page_size["width_mm"] / 25.4
    page_h_in = page_size["height_mm"] / 25.4
    for img in images:
        if img["page"] != page_size["page"]:
            continue
        if page_w_in <= 0 or page_h_in <= 0:
            continue
        dpi_w = img["width"] / page_w_in
        dpi_h = img["height"] / page_h_in
        eff = min(dpi_w, dpi_h)
        if eff < MIN_DPI * 0.6:
            issues.append(BATIssue("blocker", "low_image_resolution",
                f"Image page {img['page']} ~{int(eff)} DPI (min 300).",
                "Remplacer par une image 300 DPI minimum."))
        elif eff < MIN_DPI:
            issues.append(BATIssue("warning", "suboptimal_image_resolution",
                f"Image page {img['page']} ~{int(eff)} DPI (recommande 300+).",
                "Idéalement 300 DPI pour qualité optimale."))
    return issues


def _check_color_space(color_spaces):
    has_rgb = any("RGB" in cs.upper() for cs in color_spaces)
    has_cmyk = any("CMYK" in cs.upper() for cs in color_spaces)
    if has_rgb and not has_cmyk:
        return [BATIssue("warning", "rgb_color_space",
            "Document en RGB plutôt qu'en CMJN.",
            "Convertir en CMJN avant impression.")]
    return []


def _check_fonts(fonts_all_embedded, fonts):
    if not fonts_all_embedded:
        return [BATIssue("blocker", "fonts_not_embedded",
            "Toutes les polices ne sont pas intégrées au PDF.",
            "Exporter avec polices intégrées (PDF/X-1a recommandé).")]
    return []


def analyze_bat(*, order, document):
    analysis = BATAnalysis.objects.create(
        order=order, document=document, status=BATAnalysis.Status.PENDING,
    )
    issues = []
    score = 100
    try:
        file_bytes = b""
        if document and document.file:
            try:
                document.file.seek(0)
                file_bytes = document.file.read()
            except Exception:
                pass

        if not file_bytes:
            issues.append(BATIssue("blocker", "file_unreadable", "Fichier BAT illisible."))
            score = 0
        elif _try_pymupdf():
            info = _analyze_with_pymupdf(file_bytes)
            analysis.pages = info["pages"]
            analysis.fonts_embedded = info["fonts_all_embedded"]
            analysis.color_space = ",".join(info["color_spaces"]) or "unknown"

            font_issues = _check_fonts(info["fonts_all_embedded"], info["fonts"])
            issues.extend(font_issues)
            score -= 30 if font_issues else 0

            color_issues = _check_color_space(info["color_spaces"])
            issues.extend(color_issues)
            score -= 10 * len(color_issues)

            for page_size in info["page_sizes"]:
                page_imgs = [i for i in info["images"] if i["page"] == page_size["page"]]
                dpi_issues = _check_dpi(page_imgs, page_size)
                issues.extend(dpi_issues)
                for iss in dpi_issues:
                    score -= 20 if iss.severity == "blocker" else 8

            specs = order.product.specifications or {}
            max_pages = specs.get("max_pages")
            if max_pages and info["pages"] > int(max_pages):
                issues.append(BATIssue("warning", "too_many_pages",
                    f"{info['pages']} pages détectées, max {max_pages}."))
                score -= 10
        else:
            issues.append(BATIssue("info", "pymupdf_unavailable",
                "Analyse approfondie indisponible (PyMuPDF requis)."))

        blockers = [i for i in issues if i.severity == "blocker"]
        warnings = [i for i in issues if i.severity == "warning"]
        if blockers:
            summary = f"❌ {len(blockers)} problème(s) bloquant(s) à corriger."
        elif warnings:
            summary = f"⚠ {len(warnings)} point(s) à vérifier — impression possible."
        else:
            summary = "✓ BAT prêt pour impression."

        analysis.issues = [i.to_dict() for i in issues]
        analysis.recommendations = [i.recommendation for i in issues if i.recommendation]
        analysis.overall_score = max(0, min(100, score))
        analysis.summary = summary
        analysis.status = BATAnalysis.Status.DONE
    except Exception as exc:
        logger.exception("BAT analysis failed: %s", exc)
        analysis.status = BATAnalysis.Status.FAILED
        analysis.summary = f"Analyse échouée : {exc}"
    analysis.save()
    return analysis
