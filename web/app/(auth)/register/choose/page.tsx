"use client";

import Link from "next/link";
import {
  ArrowRight, Boxes, Building2, CheckCircle2, Printer, User,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACCOUNT_TYPES = [
  {
    code: "customer",
    title: "Particulier",
    subtitle: "Pour mes besoins personnels",
    icon: User,
    badge: null,
    accent: "from-orange-500/20 to-amber-500/10 text-orange-400",
    description:
      "Cartes de visite, flyers, t-shirts, mugs… Commandez vos impressions personnelles ou pour votre association.",
    features: [
      "Catalogue complet d'impression",
      "Comparez les offres en temps réel",
      "Paiement Mobile Money ou carte",
      "Livraison tracée à domicile",
    ],
    href: "/register?type=customer",
  },
  {
    code: "customer_corporate",
    title: "Entreprise",
    subtitle: "Pour mon organisation",
    icon: Building2,
    badge: "B2B",
    accent: "from-violet-500/20 to-fuchsia-500/10 text-violet-400",
    description:
      "Commandes récurrentes, facturation entreprise, gestion multi-utilisateurs. Pour PME, agences et organisations.",
    features: [
      "Facturation HT/TTC conforme",
      "Multi-utilisateurs et rôles",
      "Bons de commande, devis structurés",
      "Délais de paiement négociés",
    ],
    href: "/register?type=customer_corporate",
  },
  {
    code: "printer",
    title: "Imprimeur partenaire",
    subtitle: "Je veux vendre mes services",
    icon: Printer,
    badge: "Pro",
    accent: "from-pink-500/20 to-rose-500/10 text-pink-400",
    description:
      "Vous êtes un atelier d'impression ? Rejoignez la marketplace Nakoa et recevez des commandes qualifiées chaque jour.",
    features: [
      "Accès aux commandes de la marketplace",
      "Vos prix, vos délais, votre catalogue",
      "Wallet sécurisé en escrow",
      "Outils pro : production, équipe, KPIs",
    ],
    href: "/register?type=printer",
  },
];

export default function ChooseAccountTypePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 py-4 md:py-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          Bienvenue sur Nakoa
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Quel type de compte voulez-vous créer ?
          <br className="hidden md:block" />
          <span className="text-muted-foreground/80">Vous pourrez toujours en changer plus tard.</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {ACCOUNT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Link key={type.code} href={type.href} className="group block">
              <Card className="relative flex h-full flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10">
                {type.badge && (
                  <Badge
                    variant="secondary"
                    className="absolute right-4 top-4 text-[10px]"
                  >
                    {type.badge}
                  </Badge>
                )}

                <CardContent className="flex flex-1 flex-col gap-5 p-7">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${type.accent}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="font-display text-2xl font-bold leading-tight">
                      {type.title}
                    </h2>
                    <p className="text-sm font-medium text-foreground/70">{type.subtitle}</p>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {type.description}
                  </p>

                  <ul className="space-y-2 text-sm">
                    {type.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm font-semibold text-orange-500">
                    <span>Créer mon compte</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-orange-500 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
