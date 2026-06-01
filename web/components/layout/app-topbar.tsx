"use client";

import { Bell, LogOut, Search, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth";
import { useLogout } from "@/hooks/use-auth";
import { initials } from "@/lib/utils";

export function AppTopbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="relative ml-auto w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher une commande, un produit, un imprimeur…" className="pl-9" />
      </div>

      <ThemeToggle />

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src="" />
              <AvatarFallback>{initials(user?.full_name ?? user?.email ?? "U")}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{user?.full_name ?? "Utilisateur"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account"><UserIcon className="h-4 w-4" /> Mon compte</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              logout.mutate(undefined, { onSettled: () => router.push("/login") });
            }}
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
