"""Studio IA de création graphique — élimine la barrière n°1 du marché ouest-africain.

Flow :
1. Client choisit une catégorie (Flyer ouverture restaurant) + prompt FR/EN
2. Sélection d'un template de référence pour cadrer le rendu
3. Appel au moteur d'image (Stable Diffusion XL, FLUX.1, Ideogram, Replicate)
4. Génération de 4 variantes en parallèle (~30 secondes)
5. Le client choisit, édite (texte, couleurs) dans le navigateur via Fabric.js
6. Export final en PDF/X-1a prêt à imprimer → bascule en BAT validé

Backends supportés :
- Replicate (FLUX.1 schnell / SDXL)
- OpenAI Images (gpt-image-1)
- Hugging Face Inference API
- Stability AI direct
"""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class DesignBrief:
    category: str           # "flyer_restaurant", "carte_visite", "banderole_evenement"
    prompt: str             # description FR ou EN
    style: str = "modern"   # modern, traditional, festive, corporate, african_print
    primary_color: str | None = None  # ex: "#1F3A5F"
    accent_color: str | None = None
    text_overlay: dict[str, str] | None = None  # {"title": "...", "subtitle": "...", "cta": "..."}
    aspect_ratio: str = "1:1.41"  # défaut A-format
    num_variants: int = 4
    locale: str = "fr"


@dataclass
class GeneratedDesign:
    variant_id: str
    image_url: str
    width: int
    height: int
    metadata: dict[str, Any]
    cost_usd: float = 0.0


# Templates pré-structurés par catégorie produit (50 prévus en MVP)
TEMPLATE_PRESETS: dict[str, dict[str, Any]] = {
    "flyer_restaurant": {
        "prompt_prefix": "Promotional flyer for a restaurant, ",
        "style_hints": "appetizing food photography, warm ambiance, modern typography",
        "default_aspect": "1:1.41",
        "negative_prompt": "low quality, blurry, distorted text, watermark",
    },
    "carte_visite": {
        "prompt_prefix": "Professional business card design, ",
        "style_hints": "clean layout, professional typography, balanced composition",
        "default_aspect": "1.75:1",
        "negative_prompt": "cluttered, hand-drawn, low quality",
    },
    "banderole_evenement": {
        "prompt_prefix": "Event banner with bold typography, ",
        "style_hints": "high contrast, eye-catching, large readable text",
        "default_aspect": "3:1",
        "negative_prompt": "small text, busy background",
    },
    "faire_part_mariage": {
        "prompt_prefix": "Elegant wedding invitation, ",
        "style_hints": "romantic, sophisticated, gold accents, floral elements",
        "default_aspect": "1:1.41",
        "negative_prompt": "casual, low quality",
    },
    "affiche_politique": {
        "prompt_prefix": "Political campaign poster, ",
        "style_hints": "strong portrait, patriotic colors, clear message hierarchy",
        "default_aspect": "1:1.41",
        "negative_prompt": "weak composition, illegible text",
    },
}


def _build_full_prompt(brief: DesignBrief) -> tuple[str, str]:
    """Construit le prompt complet et le negative prompt."""
    preset = TEMPLATE_PRESETS.get(brief.category, {})
    prefix = preset.get("prompt_prefix", "")
    style = preset.get("style_hints", "")
    full = f"{prefix}{brief.prompt}. Style: {brief.style}, {style}."
    if brief.primary_color:
        full += f" Primary color {brief.primary_color}."
    if brief.accent_color:
        full += f" Accent color {brief.accent_color}."
    if brief.text_overlay:
        title = brief.text_overlay.get("title")
        if title:
            full += f' Title text: "{title}".'
    full += " High quality, print-ready, 300 DPI, CMYK-friendly palette."
    negative = preset.get("negative_prompt", "low quality, blurry, watermark")
    return full, negative


def generate_designs(brief: DesignBrief) -> list[GeneratedDesign]:
    """Génère N variantes via le backend sélectionné."""
    backend = getattr(settings, "DESIGN_STUDIO_BACKEND", "replicate")
    if backend == "replicate":
        return _generate_replicate(brief)
    elif backend == "openai":
        return _generate_openai(brief)
    elif backend == "stability":
        return _generate_stability(brief)
    elif backend == "stub":
        return _generate_stub(brief)
    raise ValueError(f"Backend studio IA inconnu : {backend}")


def _generate_replicate(brief: DesignBrief) -> list[GeneratedDesign]:
    """Backend Replicate (FLUX.1 schnell ou SDXL)."""
    api_key = getattr(settings, "REPLICATE_API_TOKEN", "")
    if not api_key:
        logger.warning("REPLICATE_API_TOKEN manquant — fallback stub")
        return _generate_stub(brief)

    prompt, negative = _build_full_prompt(brief)
    model_version = getattr(settings, "REPLICATE_MODEL_VERSION",
                            "black-forest-labs/flux-schnell")
    designs: list[GeneratedDesign] = []
    for i in range(brief.num_variants):
        try:
            r = requests.post(
                f"https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Token {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "version": model_version,
                    "input": {
                        "prompt": prompt,
                        "negative_prompt": negative,
                        "aspect_ratio": brief.aspect_ratio,
                        "num_outputs": 1,
                        "seed": i * 1000,
                    },
                },
                timeout=60,
            )
            data = r.json()
            output = data.get("output", [])
            if isinstance(output, list) and output:
                designs.append(GeneratedDesign(
                    variant_id=f"{data.get('id', i)}-{i}",
                    image_url=output[0],
                    width=1024, height=int(1024 * 1.41),
                    metadata={"backend": "replicate", "model": model_version, "seed": i * 1000},
                    cost_usd=0.003,  # FLUX.1 schnell ~0.003 USD / image
                ))
        except Exception as exc:  # noqa: BLE001
            logger.exception("Replicate generation failed: %s", exc)
    return designs


def _generate_openai(brief: DesignBrief) -> list[GeneratedDesign]:
    """Backend OpenAI Images (gpt-image-1)."""
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        return _generate_stub(brief)
    prompt, _ = _build_full_prompt(brief)
    designs: list[GeneratedDesign] = []
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        r = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size="1024x1024",
            n=brief.num_variants,
        )
        for i, image_obj in enumerate(r.data):
            designs.append(GeneratedDesign(
                variant_id=f"openai-{i}",
                image_url=getattr(image_obj, "url", "") or f"data:image/png;base64,{image_obj.b64_json}",
                width=1024, height=1024,
                metadata={"backend": "openai", "model": "gpt-image-1"},
                cost_usd=0.040,
            ))
    except Exception as exc:  # noqa: BLE001
        logger.exception("OpenAI image gen failed: %s", exc)
    return designs


def _generate_stability(brief: DesignBrief) -> list[GeneratedDesign]:
    """Backend Stability AI (SDXL)."""
    api_key = getattr(settings, "STABILITY_API_KEY", "")
    if not api_key:
        return _generate_stub(brief)
    prompt, negative = _build_full_prompt(brief)
    try:
        r = requests.post(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
            json={
                "text_prompts": [
                    {"text": prompt, "weight": 1},
                    {"text": negative, "weight": -1},
                ],
                "samples": brief.num_variants,
                "steps": 30,
            },
            timeout=120,
        )
        data = r.json()
        designs = []
        for i, art in enumerate(data.get("artifacts", [])):
            designs.append(GeneratedDesign(
                variant_id=f"stability-{i}",
                image_url=f"data:image/png;base64,{art['base64']}",
                width=1024, height=1024,
                metadata={"backend": "stability", "seed": art.get("seed")},
                cost_usd=0.020,
            ))
        return designs
    except Exception as exc:  # noqa: BLE001
        logger.exception("Stability AI failed: %s", exc)
        return []


def _generate_stub(brief: DesignBrief) -> list[GeneratedDesign]:
    """Stub local — utile en dev sans clé API."""
    return [
        GeneratedDesign(
            variant_id=f"stub-{i}",
            image_url=f"https://placehold.co/1024x1448/1F3A5F/FFFFFF?text=PrintHub+Variant+{i+1}",
            width=1024, height=1448,
            metadata={"backend": "stub"},
            cost_usd=0.0,
        )
        for i in range(brief.num_variants)
    ]


def export_to_print_pdf(design: GeneratedDesign, brief: DesignBrief) -> bytes:
    """Convertit le design final en PDF/X-1a prêt pour impression.

    TODO :
    - Téléchargement de l'image source
    - Conversion RGB → CMYK via Ghostscript ou imagemagick
    - Ajout des fonds perdus 3 mm + traits de coupe
    - Génération PDF/X-1a via Ghostscript ou ReportLab
    """
    return b""  # Placeholder
