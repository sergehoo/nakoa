"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, FileText, Home, LayoutDashboard, Package, Printer,
  Settings, ShoppingCart, Users, Wallet, Layers, CreditCard, ClipboardList, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SidebarRole = "customer" | "printer" | "admin";

const NAV: Record<SidebarRole, Array<{ href: string; label: string; icon: typeof Home }>> = {
  customer: [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/catalog", label: "Catalogue", icon: Boxes },
    { href: "/quotes", label: "Mes devis", icon: FileText },
    { href: "/orders", label: "Mes commandes", icon: Package },
    { href: "/account", label: "Mon compte", icon: Settings },
  ],
  printer: [
    { href: "/p/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/p/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/p/production", label: "Production", icon: ClipboardList },
    { href: "/p/catalog", label: "Catalogue & prix", icon: Layers },
    { href: "/p/billing", label: "Facturation", icon: Wallet },
    { href: "/p/team", label: "Équipe", icon: Users },
  ],
  admin: [
    { href: "/a/dashboard", label: "Vue globale", icon: LayoutDashboard },
    { href: "/a/users", label: "Utilisateurs", icon: Users },
    { href: "/a/printers", label: "Imprimeurs", icon: Printer },
    { href: "/a/kyc", label: "KYC / KYB", icon: ShieldCheck },
    { href: "/a/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/a/finance", label: "Finance", icon: CreditCard },
  ],
};

export function AppSidebar({ role }: { role: SidebarRole }) {
  const pathname = usePathname();
  const items = NAV[role];

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-white">
          <Printer className="h-4 w-4" />
        </div>
        <span className="font-display text-base font-bold">PrintHub</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button asChild variant="ghost" size="sm" className="w-full justify-start">
          <Link href="/help">
            <Settings className="h-4 w-4" /> Aide & support
          </Link>
        </Button>
      </div>
    </aside>
  );
}
