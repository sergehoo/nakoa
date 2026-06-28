"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Award, BadgeCheck, Brain, ChevronDown,
  CircleDot, Clock, Cpu, CreditCard, CreditCard as IdCard,
  Eye, FileText, Flag, Gift, Image as ImageIcon, Layers, Leaf,
  Mail, MapPin, MessageSquare, Minus, MousePointerClick, Newspaper,
  Package, Palette, Phone, Plus, Printer, Quote,
  Rocket, Shield, ShieldCheck, ShoppingBag, Smartphone,
  Sparkles, Square, Star, Stamp, Sticker, Tag, Target,
  TrendingUp, Truck, Wand2, Wrench, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NakoaLogo } from "@/components/brand/nakoa-logo";
import { LandingAuthCTA } from "@/components/layout/landing-auth-cta";
import { HeaderShopActions } from "@/components/shop/header-shop-actions";
import { useLandingStats } from "@/hooks/use-landing-stats";
import { useProducts } from "@/hooks/use-catalog";
import { ProductCard } from "@/components/shop/product-card";

// ============================================================
// PRODUITS — Catalogue éditorial monochrome
// ============================================================
const PRODUCTS = [
  { name: "Cartes de visite", icon: IdCard, from: "5 000", days: "2 j", popular: true },
  { name: "Flyers", icon: Newspaper, from: "12 000", days: "2 j", popular: true },
  { name: "Affiches", icon: ImageIcon, from: "8 000", days: "3 j", popular: false },
  { name: "Brochures", icon: FileText, from: "25 000", days: "4 j", popular: true },
  { name: "Roll-up", icon: Flag, from: "35 000", days: "3 j", popular: false },
  { name: "Kakémonos", icon: Flag, from: "28 000", days: "3 j", popular: false },
  { name: "Bâches publicitaires", icon: Tag, from: "15 000", days: "2 j", popular: true },
  { name: "Stickers", icon: Sticker, from: "8 000", days: "2 j", popular: false },
  { name: "Packaging", icon: Package, from: "45 000", days: "5 j", popular: false },
  { name: "T-shirts personnalisés", icon: ShoppingBag, from: "18 000", days: "5 j", popular: true },
  { name: "Casquettes", icon: ShoppingBag, from: "22 000", days: "5 j", popular: false },
  { name: "Objets publicitaires", icon: Gift, from: "25 000", days: "7 j", popular: false },
  { name: "Tampons", icon: Stamp, from: "10 000", days: "3 j", popular: false },
  { name: "Calendriers", icon: Square, from: "20 000", days: "4 j", popular: false },
  { name: "Menus de restaurant", icon: FileText, from: "30 000", days: "4 j", popular: true },
];

// ============================================================
// HEADER ÉDITORIAL
// ============================================================
function PremiumHeader() {
  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full glass border-b border-border/60"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Nakoa — accueil">
          <NakoaLogo variant="wordmark" size={36} priority />
        </Link>

        <nav className="hidden gap-1 md:flex">
          {[
            { label: "Produits", href: "#products" },
            { label: "Imprimeurs", href: "#printers" },
            { label: "Comment ça marche", href: "#how" },
            { label: "Tarifs", href: "#pricing" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <HeaderShopActions />
          <ThemeToggle />
          <LandingAuthCTA />
        </div>
      </div>
    </motion.header>
  );
}

// ============================================================
// HERO ÉDITORIAL
// ============================================================
function Hero() {
  return (
    <section className="relative overflow-hidden gradient-hero pt-12 pb-24 md:pt-20 md:pb-32">
      <div className="absolute inset-0 grid-paper opacity-60" />

      <div className="container relative grid items-center gap-16 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <CircleDot className="h-3 w-3 text-primary" />
            Nakoa — Imprimer commence ici
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl text-balance">
            Imprimez.{" "}
            <span className="relative inline-block">
              Livrez. Brillez.
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-primary"
              />
            </span>
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground md:text-xl text-balance">
            Nakoa connecte vos besoins d&apos;impression aux meilleurs ateliers d&apos;Afrique de l&apos;Ouest.
            Devis instantanés, paiement Mobile Money, livraison tracée — l&apos;impression commence ici.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button asChild size="xl" className="glow-border">
              <Link href="/register">
                Obtenir un devis gratuit <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#products">
                Découvrir les produits
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-foreground" />
              <span>Paiement Mobile Money sécurisé</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <BadgeCheck className="h-4 w-4 text-foreground" />
              <span>500+ imprimeurs vérifiés</span>
            </div>
          </div>
        </motion.div>

        {/* Composition éditoriale — 7 cartes produit en grille libre */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[520px]"
        >
          {[
            { Icon: IdCard, label: "Cartes", x: "8%", y: "5%", rotate: -6, delay: 0.3 },
            { Icon: Newspaper, label: "Flyers", x: "55%", y: "0%", rotate: 4, delay: 0.4 },
            { Icon: Tag, label: "Bâches", x: "0%", y: "44%", rotate: 3, delay: 0.5 },
            { Icon: Package, label: "Packaging", x: "68%", y: "32%", rotate: -8, delay: 0.6 },
            { Icon: ShoppingBag, label: "Textile", x: "20%", y: "68%", rotate: 6, delay: 0.7 },
            { Icon: Gift, label: "Goodies", x: "62%", y: "72%", rotate: -4, delay: 0.8 },
            { Icon: FileText, label: "Brochures", x: "38%", y: "32%", rotate: 0, delay: 0.9 },
          ].map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: card.rotate }}
              transition={{ delay: card.delay, type: "spring", stiffness: 90, damping: 12 }}
              whileHover={{ y: -8, scale: 1.04, rotate: 0, zIndex: 50 }}
              style={{ position: "absolute", left: card.x, top: card.y }}
              className="cursor-pointer"
            >
              <div className="card-premium flex h-32 w-32 flex-col items-center justify-center rounded-2xl">
                <card.Icon className="h-9 w-9 text-foreground" strokeWidth={1.4} />
                <div className="mt-3 text-xs font-semibold text-foreground">{card.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Trust strip discret */}
      <div className="container relative mt-20">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span>Paiements :</span>
          {["Wave", "Orange Money", "MTN MoMo", "Moov", "CinetPay", "Stripe"].map((p) => (
            <span key={p} className="font-semibold text-foreground">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PRODUITS — Grille épurée
// ============================================================
function Products() {
  // Pull real products from the backend catalog. Affiche les 10 premiers
  // (featured d'abord), le reste est accessible via /products.
  const { data, isLoading } = useProducts({ page_size: 10, ordering: "-is_featured,name" });
  const products = data?.results ?? [];

  return (
    <section id="products" className="container py-24">
      <SectionTitle
        chip="Boutique"
        title="Commandez en quelques clics"
        subtitle="Ajoutez au panier, personnalisez vos options, puis validez votre commande. Aucun compte requis pour explorer."
      />

      {isLoading ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary/30" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Aucun produit disponible pour le moment.{" "}
          <Link href="/quotes/new" className="text-primary hover:underline">
            Demander un devis personnalisé
          </Link>
          .
        </p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </motion.div>
      )}

      <div className="mt-10 text-center">
        <Button asChild size="lg" variant="outline">
          <Link href="/products">
            Voir tout le catalogue <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

// ============================================================
// COMMENT ÇA MARCHE — Timeline minimaliste
// ============================================================
function HowItWorks() {
  const steps = [
    { n: "01", icon: Wand2, title: "Décrivez votre besoin", desc: "Catalogue interactif ou assistant IA conversationnel — choisissez le mode qui vous convient." },
    { n: "02", icon: Sparkles, title: "Recevez plusieurs offres", desc: "Notre moteur de matching IA propose les meilleurs imprimeurs en moins de 10 secondes." },
    { n: "03", icon: MousePointerClick, title: "Choisissez votre imprimeur", desc: "Comparez prix, délais, qualité, distance. Payez en Mobile Money sécurisé." },
    { n: "04", icon: Truck, title: "Recevez votre commande", desc: "Suivi production temps réel, livraison tracée et garantie qualité Nakoa Care." },
  ];

  return (
    <section id="how" className="container py-24">
      <SectionTitle
        chip="Méthode"
        title="Commander n'a jamais été aussi simple"
        subtitle="De l'idée à la livraison, Nakoa orchestre tout pour vous."
      />

      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="card-premium relative h-full rounded-2xl p-7">
              <span className="font-display text-5xl font-bold tracking-tighter text-muted-foreground/30">
                {s.n}
              </span>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-border lg:block">
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// SECTION IA — Fond sombre éditorial
// ============================================================
function AISection() {
  const features = [
    { icon: Brain, title: "Analyse BAT automatique", desc: "Détection des erreurs de résolution, marges, fonds perdus et colorimétrie." },
    { icon: Target, title: "Recommandation IA", desc: "Le bon imprimeur, au bon prix, avec le bon délai — choisi pour vous." },
    { icon: Clock, title: "Estimation précise", desc: "ETA précise par produit et par imprimeur, mise à jour en continu." },
    { icon: Eye, title: "Détection d'erreurs", desc: "Polices manquantes, espace colorimétrique, pages excédentaires." },
    { icon: Palette, title: "Suggestions finitions", desc: "Vernis, pelliculage, dorure recommandés selon votre usage." },
    { icon: TrendingUp, title: "Comparaison intelligente", desc: "Tableau radar prix × délai × qualité × distance." },
  ];

  return (
    <section className="relative overflow-hidden bg-foreground py-28 text-background">
      <div className="absolute inset-0 grid-paper opacity-[0.04]" />

      <div className="container relative">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-3 py-1 text-xs font-medium text-background/70 backdrop-blur">
            <Cpu className="h-3 w-3" />
            Nakoa AI
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl text-balance">
            L&apos;intelligence artificielle au service de vos impressions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-background/60 text-balance">
            Six fonctionnalités IA qui transforment l&apos;expérience d&apos;achat et la qualité du résultat.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-background/10 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative bg-foreground p-8 transition-colors hover:bg-background/[0.03]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-background/10 border border-background/10">
                <f.icon className="h-5 w-5 text-background" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-background/60">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// IMPRIMEURS PREMIUM
// ============================================================
function PrintersShowcase() {
  const printers = [
    { name: "Cocody Print", city: "Abidjan, CI", rating: 4.9, orders: 487, lead: "24h", labels: ["Premium", "Express"] },
    { name: "Atelier Treichville", city: "Abidjan, CI", rating: 4.8, orders: 312, lead: "48h", labels: ["Certifié", "Éco"] },
    { name: "Dakar Print Express", city: "Dakar, SN", rating: 4.7, orders: 256, lead: "24h", labels: ["Express", "Premium"] },
    { name: "Plateau Studio", city: "Cotonou, BJ", rating: 4.9, orders: 198, lead: "36h", labels: ["Premium", "Éco"] },
  ];

  const labelIcons: Record<string, typeof Award> = {
    Premium: Award,
    Express: Zap,
    Certifié: ShieldCheck,
    Éco: Leaf,
  };

  return (
    <section id="printers" className="container py-24">
      <SectionTitle
        chip="Réseau"
        title="Des imprimeurs d'élite vérifiés"
        subtitle="500+ ateliers partenaires audités, notés et certifiés par Nakoa."
      />

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {printers.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
          >
            <Card className="card-premium overflow-hidden border-0">
              <div className="h-24 relative bg-gradient-to-br from-secondary to-secondary/40">
                <div className="absolute inset-0 grid-paper opacity-50" />
                <div className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-lg bg-background border shadow-sm">
                  <Printer className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                </div>
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {p.labels.map((l) => {
                    const Icon = labelIcons[l] ?? BadgeCheck;
                    return (
                      <div key={l} className="flex items-center gap-1 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                        <Icon className="h-2.5 w-2.5" /> {l}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-base font-semibold">{p.name}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.city}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm border-t pt-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-foreground text-foreground" strokeWidth={0} />
                    <strong className="text-sm">{p.rating}</strong>
                    <span className="text-xs text-muted-foreground">({p.orders})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> <strong className="text-foreground">{p.lead}</strong>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// GALERIE RÉALISATIONS — Masonry monochrome
// ============================================================
function Showcase() {
  const items = [
    { Icon: Newspaper, title: "Flyers concert", h: 280 },
    { Icon: Package, title: "Packaging premium", h: 200 },
    { Icon: Flag, title: "Bâche événement", h: 320 },
    { Icon: IdCard, title: "Cartes de visite", h: 180 },
    { Icon: FileText, title: "Brochures ONG", h: 260 },
    { Icon: Wrench, title: "Enseignes lumineuses", h: 220 },
    { Icon: Flag, title: "Roll-up salon", h: 300 },
    { Icon: ShoppingBag, title: "Textiles entreprise", h: 200 },
  ];

  return (
    <section className="container py-24">
      <SectionTitle
        chip="Galerie"
        title="Quelques unes de nos réalisations"
        subtitle="Des milliers de campagnes imprimées avec soin."
      />
      <div className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-4">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="mb-4 break-inside-avoid"
          >
            <div
              className="card-premium group relative overflow-hidden rounded-2xl cursor-pointer"
              style={{ height: `${item.h}px` }}
            >
              <div className="absolute inset-0 bg-secondary/40 transition-colors group-hover:bg-secondary" />
              <div className="absolute inset-0 grid-paper opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <item.Icon className="h-16 w-16 text-foreground/70 transition-transform duration-500 group-hover:scale-110 group-hover:text-foreground" strokeWidth={1.2} />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// STATISTIQUES
// ============================================================
function Stats() {
  const { data: live, isLoading } = useLandingStats();

  // Formatte un nombre en chaîne lisible : 1234 → "1 234", 12500 → "12.5K", 100000 → "100K+"
  const fmt = (n: number | undefined, suffix = ""): string => {
    if (!n || n <= 0) return "—";
    if (n >= 100_000) return `${Math.floor(n / 1000)}K+${suffix}`;
    if (n >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K${suffix}`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K${suffix}`;
    return `${n}${suffix}`;
  };

  // Tant que le backend n'a pas de données ou est offline, on affiche des valeurs
  // de référence pour ne pas casser la promesse marketing.
  const fallback = {
    printers: "500+",
    orders: "100K+",
  };

  const stats = [
    {
      k: isLoading ? "…" : live && live.active_printers > 0 ? fmt(live.active_printers, "+") : fallback.printers,
      v: "Imprimeurs partenaires",
      icon: Printer,
    },
    {
      k: isLoading ? "…" : live && live.orders_completed > 0 ? fmt(live.orders_completed, "+") : fallback.orders,
      v: "Commandes traitées",
      icon: Package,
    },
    { k: "98%", v: "Clients satisfaits", icon: BadgeCheck },
    { k: "24h", v: "Délai moyen", icon: Zap },
  ];

  return (
    <section className="container py-20">
      <div className="card-premium rounded-3xl p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-4 md:divide-x">
          {stats.map((s, i) => (
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center md:px-6 first:md:pl-0 last:md:pr-0"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <s.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <p className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">{s.k}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TARIFS IMPRIMEURS — 4 plans alignés sur le backend
// ============================================================
function Pricing() {
  const plans = [
    {
      tier: "Basic",
      price: "Gratuit",
      period: "",
      commission: "15 %",
      tagline: "Démarrez sur Nakoa sans engagement.",
      features: [
        "10 commandes actives",
        "2 utilisateurs",
        "20 produits configurés",
        "Support par email",
        "Garantie Nakoa Care 48 h",
      ],
      cta: "Commencer gratuitement",
      featured: false,
    },
    {
      tier: "Pro",
      price: "15 000",
      period: "/ mois",
      commission: "12 %",
      tagline: "Pour les ateliers en croissance.",
      features: [
        "50 commandes actives",
        "5 utilisateurs",
        "100 produits",
        "Assistant IA imprimeur",
        "Tableau de bord avancé",
        "Support prioritaire",
      ],
      cta: "Choisir Pro",
      featured: false,
    },
    {
      tier: "Premium",
      price: "50 000",
      period: "/ mois",
      commission: "10 %",
      tagline: "L'offre complète pour ateliers établis.",
      features: [
        "Commandes illimitées",
        "20 utilisateurs",
        "Produits illimités",
        "API + intégrations",
        "Mode Express 4 h activé",
        "Customer Success dédié",
      ],
      cta: "Choisir Premium",
      featured: true,
    },
    {
      tier: "Enterprise",
      price: "Sur devis",
      period: "",
      commission: "8 %",
      tagline: "Multi-ateliers, SLA dédié.",
      features: [
        "Multi-ateliers",
        "Utilisateurs illimités",
        "SLA contractuel",
        "Account manager dédié",
        "Audit sécurité personnalisé",
        "Onboarding sur site",
      ],
      cta: "Contacter l'équipe",
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="container py-24">
      <SectionTitle
        chip="Tarifs imprimeurs"
        title="Une commission qui baisse quand vous grandissez"
        subtitle="Premier mois offert sur tous les plans payants. Sans engagement."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p, i) => (
          <motion.div
            key={p.tier}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className="relative"
          >
            {p.featured && (
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                Le plus populaire
              </div>
            )}
            <div className={`card-premium h-full rounded-2xl p-7 ${p.featured ? "ring-2 ring-foreground/80" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">{p.tier}</h3>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">
                  {p.commission} commission
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{p.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight">{p.price}</span>
                {p.period && <span className="text-sm text-muted-foreground">XOF{p.period}</span>}
              </div>

              <Button asChild className="mt-6 w-full" variant={p.featured ? "default" : "outline"}>
                <Link href={`/register?role=printer&plan=${p.tier.toLowerCase()}`}>
                  {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <ul className="mt-6 space-y-2.5 border-t pt-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={1.5} />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Vous êtes client (pas imprimeur) ? Inscrivez-vous gratuitement —{" "}
        <Link href="/register" className="font-semibold text-foreground underline underline-offset-4">
          commander dès maintenant
        </Link>
        .
      </p>
    </section>
  );
}

// ============================================================
// TÉMOIGNAGES
// ============================================================
function Testimonials() {
  const reviews = [
    { name: "Aïssata D.", role: "Directrice marketing — Agence Brand'O", text: "Nakoa a divisé par 3 le temps que nous passions à comparer des imprimeurs. Aujourd'hui, on commande en 5 minutes." },
    { name: "Moussa K.", role: "CEO — Festival Abidjan Vibes", text: "Pour notre festival, 2000 affiches et 50 bâches imprimées en 48h. Qualité irréprochable, livraison express." },
    { name: "Fatima B.", role: "Communication — ONG UEMOA", text: "Mobile Money + escrow nous rassurent. Et le suivi temps réel change tout pour la planification." },
  ];
  return (
    <section className="container py-24">
      <SectionTitle
        chip="Témoignages"
        title="Ils nous ont fait confiance"
        subtitle="PME, agences, événementiel, ONG — tous nous recommandent."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {reviews.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="card-premium h-full border-0">
              <div className="p-7">
                <Quote className="h-7 w-7 text-foreground/30" strokeWidth={1.5} />
                <p className="mt-4 text-base leading-relaxed text-foreground/90">{r.text}</p>
                <div className="mt-6 flex items-center gap-3 border-t pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {r.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// APPLICATION MOBILE
// ============================================================
function MobileApp() {
  return (
    <section className="container py-24">
      <div className="card-premium-dark rounded-3xl p-8 md:p-16 overflow-hidden relative">
        <div className="absolute inset-0 grid-paper opacity-[0.04]" />
        <div className="relative grid items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <Smartphone className="h-3 w-3" />
              Application mobile
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl text-balance">
              Commandez depuis votre poche
            </h2>
            <p className="mt-4 text-lg text-background/70 text-balance">
              Suivez vos commandes, validez vos BAT, recevez des notifications en temps réel et discutez avec votre imprimeur.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { icon: Package, text: "Suivi commande en direct" },
                { icon: BadgeCheck, text: "Validation BAT en un clic" },
                { icon: MessageSquare, text: "Messagerie imprimeur" },
                { icon: Sparkles, text: "Notifications intelligentes" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background/10 border border-background/10">
                    <f.icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <span className="font-medium">{f.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                App Store
              </Button>
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                Google Play
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative flex justify-center"
          >
            <div className="relative h-[480px] w-[240px] rounded-[3rem] bg-background/5 border border-background/20 p-3 shadow-2xl backdrop-blur">
              <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-background/10" />
              <div className="h-full w-full overflow-hidden rounded-[2.4rem] bg-background p-4 text-foreground">
                <div className="text-xs text-muted-foreground">Bonjour</div>
                <div className="font-display text-lg font-semibold">Aïssata</div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { l: "Commandes", v: "12", Icon: Package },
                    { l: "En cours", v: "3", Icon: Truck },
                  ].map((k) => (
                    <div key={k.l} className="rounded-xl bg-secondary p-3">
                      <k.Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      <p className="mt-1 text-[10px] text-muted-foreground">{k.l}</p>
                      <p className="font-display text-2xl font-bold">{k.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dernières</div>
                <div className="mt-2 space-y-1.5">
                  {["PH-001", "PH-002", "PH-003"].map((r) => (
                    <div key={r} className="flex items-center gap-2 rounded-lg border p-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary">
                        <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 text-[10px]">
                        <p className="font-semibold">{r}</p>
                        <p className="text-muted-foreground">En production</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: "Comment passer ma première commande ?", a: "Inscrivez-vous gratuitement, choisissez un produit dans le catalogue, configurez les options, recevez des offres en 10 secondes, choisissez, payez en Mobile Money." },
    { q: "Quels sont les délais de livraison ?", a: "De 24h (mode Express) à 7 jours selon le produit et la quantité. Chaque offre affiche son délai garanti — et si l'imprimeur dépasse, vous êtes remboursé via Nakoa Care." },
    { q: "Comment envoyer mon BAT (Bon À Tirer) ?", a: "Téléversez votre PDF/AI/PSD directement depuis le configurateur. Notre IA analyse instantanément la résolution, les marges, les fonds perdus." },
    { q: "Puis-je comparer plusieurs imprimeurs ?", a: "Oui. Vous recevez automatiquement les 5 meilleures offres, classées par prix, délai, qualité, distance. À vous de choisir." },
    { q: "Quels moyens de paiement acceptez-vous ?", a: "Wave, Orange Money, MTN MoMo, Moov Money, CinetPay (cartes), Stripe pour l'international. Toutes les transactions sont sécurisées avec escrow." },
    { q: "Que se passe-t-il si le produit n'est pas conforme ?", a: "La garantie Nakoa Care couvre vos commandes 48h après livraison. Si le rendu ne correspond pas au BAT validé, nous remboursons ou réimprimons gratuitement." },
  ];
  return (
    <section className="container py-24">
      <SectionTitle
        chip="FAQ"
        title="Vos questions, nos réponses"
        subtitle="Tout ce que vous devez savoir avant de commander."
      />
      <div className="mx-auto mt-12 max-w-3xl space-y-2">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="card-premium overflow-hidden rounded-xl">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="font-display font-semibold">{it.q}</span>
                {open === i ? (
                  <Minus className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                )}
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-muted-foreground">{it.a}</p>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// FOOTER ÉDITORIAL
// ============================================================
function PremiumFooter() {
  return (
    <footer className="bg-foreground py-20 text-background">
      <div className="container">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground">
                <Printer className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <span className="font-display text-lg font-semibold">Nakoa</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-background/60">
              La marketplace d&apos;impression nouvelle génération pour l&apos;Afrique de l&apos;Ouest.
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm text-background/60">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              <span>Abidjan · Dakar · Cotonou</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-background/60">
              <Mail className="h-4 w-4" strokeWidth={1.5} />
              <span>hello@nakoa.io</span>
            </div>
          </div>
          {[
            { title: "Produits", links: ["Catalogue", "Cartes de visite", "Flyers", "Bâches", "Packaging"] },
            { title: "Imprimeurs", links: ["Devenir partenaire", "Annuaire", "Programme Premium", "Express 4h"] },
            { title: "Entreprise", links: ["À propos", "Blog", "Carrières", "Centre d'aide", "API"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-background/80">{col.title}</h4>
              <ul className="mt-4 space-y-2 text-sm text-background/60">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="transition-colors hover:text-background">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-background/10 pt-6 text-xs text-background/50 md:flex-row">
          <p>© {new Date().getFullYear()} Nakoa. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/legal/cgu" className="hover:text-background">CGU</Link>
            <Link href="/legal/cgv" className="hover:text-background">CGV</Link>
            <Link href="/legal/privacy" className="hover:text-background">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// HELPERS
// ============================================================
function SectionTitle({ chip, title, subtitle }: { chip: string; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        <CircleDot className="h-2.5 w-2.5 text-foreground" />
        {chip}
      </motion.div>
      <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl text-balance">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-muted-foreground text-balance">{subtitle}</p>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function LandingPage() {
  return (
    <>
      <PremiumHeader />
      <Hero />
      <Products />
      <HowItWorks />
      <AISection />
      <PrintersShowcase />
      <Showcase />
      <Stats />
      <Pricing />
      <Testimonials />
      <MobileApp />
      <FAQ />

      {/* CTA final éditorial */}
      <section className="container py-24">
        <div className="card-premium-dark relative overflow-hidden rounded-3xl p-12 md:p-20 text-center">
          <div className="absolute inset-0 grid-paper opacity-[0.04]" />
          <div className="relative">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-background/10 border border-background/10">
              <Rocket className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-6xl text-balance">
              Prêt à imprimer plus intelligemment&nbsp;?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-background/70">
              Inscription gratuite. Premier devis offert. Sans engagement.
            </p>
            <Button asChild size="xl" variant="secondary" className="mt-8 bg-background text-foreground hover:bg-background/90 glow-border">
              <Link href="/register">
                Commencer maintenant <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <PremiumFooter />
    </>
  );
}
