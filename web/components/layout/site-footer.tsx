import Link from "next/link";
import { Printer } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-white">
              <Printer className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-bold">Nakoa</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Imprimer simplement, partout en Afrique de l&apos;Ouest.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Produit</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#features">Fonctionnalités</Link></li>
            <li><Link href="#printers">Annuaire imprimeurs</Link></li>
            <li><Link href="#pricing">Tarifs</Link></li>
            <li><Link href="/register?role=printer">Devenir imprimeur</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Ressources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/help">Centre d&apos;aide</Link></li>
            <li><Link href="/api/docs">API</Link></li>
            <li><Link href="/status">Statut</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Légal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/legal/cgu">CGU</Link></li>
            <li><Link href="/legal/cgv">CGV</Link></li>
            <li><Link href="/legal/privacy">Confidentialité</Link></li>
            <li><Link href="/legal/cookies">Cookies</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Nakoa. Tous droits réservés.</p>
          <p>Abidjan · Dakar · Cotonou</p>
        </div>
      </div>
    </footer>
  );
}
