"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BarChart3, Bell, Boxes, Building2, ClipboardList,
  CreditCard, FileText, HelpCircle, Home, LayoutDashboard, MapPin,
  MessageSquare, Package, Printer, Search, Settings, ShieldCheck,
  ShoppingCart, Sparkles, Star, Truck, Users, Wallet, Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type SidebarRole = "customer" | "printer" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  beta?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV: Record<SidebarRole, NavSection[]> = {
  customer: [
    {
      items: [
        { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
        { href: "/catalog", label: "Catalogue", icon: Boxes },
      ],
    },
    {
      title: "Mes activités",
      items: [
        { href: "/quotes", label: "Mes devis", icon: FileText },
        { href: "/orders", label: "Mes commandes", icon: Package },
      ],
    },
    {
      title: "Compte",
      items: [
        { href: "/account", label: "Mon profil", icon: Settings },
        { href: "/account/addresses", label: "Mes adresses", icon: MapPin },
        { href: "/account/payment-methods", label: "Paiements", icon: CreditCard },
      ],
    },
  ],
  printer: [
    {
      items: [
        { href: "/p/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
      ],
    },
    {
      title: "Production",
      items: [
        { href: "/p/orders", label: "Commandes", icon: ShoppingCart },
        { href: "/p/production", label: "Atelier", icon: ClipboardList },
        { href: "/p/opportunities", label: "Opportunités", icon: Sparkles, beta: true },
      ],
    },
    {
      title: "Activité commerciale",
      items: [
        { href: "/p/products", label: "Mes produits", icon: Boxes },
        { href: "/p/catalog", label: "Grilles tarifaires", icon: BarChart3 },
        { href: "/p/billing", label: "Facturation", icon: Wallet },
      ],
    },
    {
      title: "Mon imprimerie",
      items: [
        { href: "/p/profile", label: "Profil entreprise", icon: Building2 },
        { href: "/p/team", label: "Équipe", icon: Users },
        { href: "/p/kyc", label: "KYB", icon: ShieldCheck },
      ],
    },
  ],
  admin: [
    {
      items: [
        { href: "/a/dashboard", label: "Vue globale", icon: LayoutDashboard },
        { href: "/a/ops", label: "Operations Center", icon: Activity, beta: true },
      ],
    },
    {
      title: "Marketplace",
      items: [
        { href: "/a/catalog", label: "Catalogue Nakoa", icon: Boxes },
        { href: "/a/printers", label: "Imprimeurs", icon: Printer },
        { href: "/a/users", label: "Utilisateurs", icon: Users },
        { href: "/a/kyc", label: "Validation KYC", icon: ShieldCheck },
      ],
    },
    {
      title: "Commercial",
      items: [
        { href: "/a/orders", label: "Commandes", icon: ShoppingCart },
        { href: "/a/finance", label: "Finance", icon: CreditCard },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { href: "/a/ai", label: "NAKOA AI", icon: Sparkles, beta: true },
        { href: "/a/sla", label: "SLA", icon: BarChart3, beta: true },
      ],
    },
  ],
};

const ROLE_LABELS: Record<SidebarRole, string> = {
  customer: "Espace client",
  printer: "Espace imprimeur",
  admin: "Espace admin",
};

// Stockage local des favoris (utilisateur épingle ses pages préférées)
const FAVORITES_KEY = "nakoa-sidebar-favorites";

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  const toggle = (href: string) => {
    setFavorites((prev) => {
      const next = prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return { favorites, toggle };
}

function NavLink({
  item,
  isFavorite,
  onToggleFavorite,
}: {
  item: NavItem;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
          active
            ? "nav-item-active font-medium"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && (
          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
            {item.badge}
          </Badge>
        )}
        {item.beta && (
          <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
            Beta
          </span>
        )}
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-opacity",
            isFavorite
              ? "opacity-100 text-amber-400"
              : "opacity-0 text-muted-foreground group-hover:opacity-100 hover:text-foreground",
          )}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star className={cn("h-3 w-3", isFavorite && "fill-current")} />
        </button>
      )}
    </div>
  );
}

export function SidebarPremium({ role }: { role: SidebarRole }) {
  const [search, setSearch] = useState("");
  const { favorites, toggle } = useFavorites();

  const sections = NAV[role];
  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  const filteredSections = useMemo(() => {
    if (!search) return sections;
    const q = search.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length > 0);
  }, [search, sections]);

  const favoriteItems = useMemo(
    () => allItems.filter((i) => favorites.includes(i.href)),
    [allItems, favorites],
  );

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-card md:sticky md:top-0 md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-lg shadow-orange-500/30">
          <Zap className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-base font-bold leading-tight">Nakoa</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {ROLE_LABELS[role]}
          </span>
        </div>
      </div>

      {/* Recherche globale */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Recherche…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[9px] font-mono text-muted-foreground sm:flex">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {/* Favoris */}
        {favoriteItems.length > 0 && !search && (
          <div className="mb-4">
            <p className="mb-1 flex items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Favoris
            </p>
            <div className="space-y-0.5">
              {favoriteItems.map((item) => (
                <NavLink
                  key={`fav-${item.href}`}
                  item={item}
                  isFavorite
                  onToggleFavorite={() => toggle(item.href)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {filteredSections.map((section, idx) => (
          <div key={idx} className={cn(idx > 0 && "mt-4")}>
            {section.title && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isFavorite={favorites.includes(item.href)}
                  onToggleFavorite={() => toggle(item.href)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Aucun résultat */}
        {search && filteredSections.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Aucune page ne correspond à « {search} »
          </div>
        )}
      </nav>

      {/* Footer : NAKOA AI shortcut + Help */}
      <div className="border-t p-3 space-y-1">
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Aide & support
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] leading-tight">
            <span className="font-semibold text-foreground">NAKOA AI</span> est prêt — demandez-lui n&apos;importe quoi.
          </p>
        </div>
      </div>
    </aside>
  );
}
