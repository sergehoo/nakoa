"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";

/**
 * CTA d'authentification dans le header landing.
 * - Pendant l'hydratation : placeholder neutre (évite flash mauvais état)
 * - Non connecté : "Connexion" + "Commander"
 * - Connecté : "Mon espace" + avatar dropdown (profil/dashboard/logout)
 */
export function LandingAuthCTA() {
  const { user, isAuthenticated, isReady, dashboardUrl, logout } = useAuth();
  const router = useRouter();

  // Placeholder de chargement pour éviter le flash
  if (!isReady) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 animate-pulse rounded-md bg-muted/50" />
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted/50" />
      </div>
    );
  }

  // Utilisateur non connecté → CTA classique
  if (!isAuthenticated || !user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="hidden md:flex">
          <Link href="/login">Connexion</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">
            Commander <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </>
    );
  }

  // Utilisateur connecté → bouton "Mon espace" + menu avatar
  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <>
      <Button asChild size="sm" className="hidden md:flex">
        <Link href={dashboardUrl}>
          <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
          Mon espace
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-1.5 md:px-2">
            <Avatar className="h-7 w-7 ring-2 ring-orange-500/30">
              <AvatarFallback className="bg-gradient-to-br from-pink-500 via-violet-500 to-orange-500 text-xs text-white">
                {initials(user.full_name ?? user.email)}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="hidden h-3 w-3 md:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate font-semibold">{user.full_name ?? "Mon compte"}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={dashboardUrl}>
              <LayoutDashboard className="h-4 w-4" /> Mon espace
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserIcon className="h-4 w-4" /> Mon profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
