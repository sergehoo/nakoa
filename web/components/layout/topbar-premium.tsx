"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Command, HelpCircle, LogOut, Plus, Search, Settings,
  User as UserIcon, Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth";
import { useLogout } from "@/hooks/use-auth";
import { initials } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  customer: "Client",
  customer_corporate: "Entreprise",
  printer: "Imprimeur",
  printer_agent: "Agent",
  quality_controller: "Contrôle qualité",
  courier: "Livreur",
  admin: "Administrateur",
  super_admin: "Super Admin",
  support: "Support",
  accountant: "Comptable",
};

export function TopbarPremium() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push("/login"),
    });
  };

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-6">
      {/* Recherche globale */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une commande, un produit, un imprimeur…"
          className="h-9 pl-9 pr-16 bg-secondary/50 border-transparent focus:border-primary/40 focus:bg-background"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:flex">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </div>

      {/* Spacer + Quick Action */}
      <div className="ml-auto flex items-center gap-1">
        {/* Quick action contextuelle selon rôle */}
        <Button
          size="sm"
          className="hidden gap-2 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20 transition-transform hover:scale-105 lg:flex"
          asChild
        >
          <Link href={user?.primary_role?.startsWith("printer") ? "/p/orders" : "/catalog"}>
            <Plus className="h-3.5 w-3.5" />
            {user?.primary_role?.startsWith("printer") ? "Nouvelle offre" : "Nouvelle commande"}
          </Link>
        </Button>

        {/* AI Assistant trigger */}
        <Button variant="ghost" size="icon" className="relative" title="Assistant Nakoa AI">
          <Sparkles className="h-4 w-4 text-primary" />
        </Button>

        <ThemeToggle />

        <NotificationBell />

        {/* Profil utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5 md:px-2">
              <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs text-white">
                  {initials(user?.full_name ?? user?.email ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight">
                  {user?.full_name?.split(" ")[0] ?? "Utilisateur"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {user ? ROLE_LABEL[user.primary_role] ?? user.primary_role : ""}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
            <div className="flex items-center gap-3 p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                  {initials(user?.full_name ?? user?.email ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user?.full_name ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                {user && (
                  <Badge variant="secondary" className="mt-1 h-4 px-1.5 text-[9px]">
                    {ROLE_LABEL[user.primary_role] ?? user.primary_role}
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">
                <UserIcon className="h-4 w-4" /> Mon compte
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account">
                <Settings className="h-4 w-4" /> Préférences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help">
                <HelpCircle className="h-4 w-4" /> Aide
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
