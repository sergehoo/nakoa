"use client";

import Link from "next/link";

import { NakoaLogo } from "@/components/brand/nakoa-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LandingAuthCTA } from "@/components/layout/landing-auth-cta";
import { HeaderShopActions } from "@/components/shop/header-shop-actions";

/**
 * Header standard utilisé sur les sous-pages marketing
 * (/products, /cart, /wishlist, /checkout, /pricing).
 *
 * La landing page a son propre PremiumHeader plus éditorial.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Nakoa — accueil">
          <NakoaLogo variant="wordmark" size={36} priority />
        </Link>

        <nav className="hidden gap-1 md:flex">
          <Link
            href="/products"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Catalogue
          </Link>
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Tarifs
          </Link>
          <Link
            href="/#how"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Comment ça marche
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <HeaderShopActions />
          <ThemeToggle />
          <LandingAuthCTA />
        </div>
      </div>
    </header>
  );
}
