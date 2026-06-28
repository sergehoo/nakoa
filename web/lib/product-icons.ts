/**
 * Mapping slug catégorie ou produit → icône Lucide.
 *
 * Sert de fallback visuel cohérent quand un produit n'a pas d'image cover.
 * Reproduit l'esprit de l'ancienne grille hardcodée de la landing.
 */

import {
  Award, Boxes, CreditCard, FileText, Flag, Gift, Image as ImageIcon,
  Layers, Mail, Newspaper, Package, Palette, Printer as PrinterIcon,
  ShoppingBag, Square, Stamp, Sticker, Tag, Truck, type LucideIcon,
} from "lucide-react";

/**
 * Table de correspondance — mots-clés présents dans le slug/name → icône.
 * Le premier match l'emporte.
 */
const ICON_RULES: Array<{ keys: string[]; icon: LucideIcon }> = [
  { keys: ["carte-visite", "business-card", "carte"], icon: CreditCard },
  { keys: ["flyer", "flyers", "tract", "tractage"], icon: Newspaper },
  { keys: ["affiche", "poster", "affichage"], icon: ImageIcon },
  { keys: ["brochure", "depliant", "catalogue-produit", "livret"], icon: FileText },
  { keys: ["roll-up", "rollup", "kakemono", "kakémono", "banner-stand"], icon: Flag },
  { keys: ["bache", "bâche", "banderole", "bache-pub", "panneau"], icon: Tag },
  { keys: ["sticker", "autocollant", "etiquette"], icon: Sticker },
  { keys: ["packaging", "emballage", "boite", "boîte"], icon: Boxes },
  { keys: ["t-shirt", "tshirt", "tee-shirt", "polo", "vetement"], icon: ShoppingBag },
  { keys: ["casquette", "cap", "bonnet"], icon: ShoppingBag },
  { keys: ["objet-pub", "goodies", "gift", "cadeau"], icon: Gift },
  { keys: ["tampon", "stamp"], icon: Stamp },
  { keys: ["calendrier", "agenda"], icon: Square },
  { keys: ["menu", "carte-restaurant"], icon: FileText },
  { keys: ["enveloppe", "papier-entete", "papier-en-tete"], icon: Mail },
  { keys: ["livre", "magazine", "book"], icon: FileText },
  { keys: ["signa", "signaletique", "plv"], icon: PrinterIcon },
  { keys: ["impression-grand-format", "large-format", "xxl"], icon: Layers },
  { keys: ["medaille", "trophy", "trophee", "award"], icon: Award },
  { keys: ["livraison", "delivery", "transport"], icon: Truck },
  { keys: ["graphique", "design", "creation"], icon: Palette },
];

const DEFAULT_ICON: LucideIcon = Package;

/**
 * Retourne l'icône Lucide la plus pertinente pour un produit donné.
 *
 * @param hints Slugs, noms, tags du produit ou de sa catégorie (concaténés en lowercase).
 */
export function getProductIcon(...hints: (string | null | undefined)[]): LucideIcon {
  const haystack = hints
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .join(" ");
  for (const rule of ICON_RULES) {
    if (rule.keys.some((k) => haystack.includes(k))) {
      return rule.icon;
    }
  }
  return DEFAULT_ICON;
}
