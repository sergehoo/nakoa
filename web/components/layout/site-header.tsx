"use client";

import Link from "next/link";
import { Printer, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand text-white">
            <Printer className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Nakoa</span>
        </Link>

        <nav className="hidden gap-8 md:flex">
          <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Fonctionnalités
          </Link>
          <Link href="#printers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Imprimeurs
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Tarifs
          </Link>
          <Link href="#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contact
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">
              <Sparkles className="h-4 w-4" /> Commander
            </Link>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className={cn("border-t md:hidden", open ? "block" : "hidden")}>
        <div className="container flex flex-col gap-2 py-4">
          <Link href="#features" className="py-2 text-sm font-medium">Fonctionnalités</Link>
          <Link href="#printers" className="py-2 text-sm font-medium">Imprimeurs</Link>
          <Link href="#pricing" className="py-2 text-sm font-medium">Tarifs</Link>
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/register">Commander</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
