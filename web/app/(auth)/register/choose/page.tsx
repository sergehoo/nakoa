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
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
          Bienvenue sur Nakoa
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground">
          Quel type de compte voulez-vous créer ? Vous pourrez toujours en changer plus tard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ACCOUNT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Link key={type.code} href={type.href} className="group block">
              <Card className="relative h-full overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10">
                {type.badge && (
                  <Badge
                    variant="secondary"
                    className="absolute right-3 top-3 text-[10px]"
                  >
                    {type.badge}
                  </Badge>
                )}

                <CardContent className="space-y-4 p-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${type.accent}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="font-display text-xl font-bold leading-tight">
                      {type.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{type.subtitle}</p>
                  </div>

                  <p className="text-sm leading-snug text-muted-foreground">
                    {type.description}
                  </p>

                  <ul className="space-y-1.5 text-sm">
                    {type.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between border-t pt-3 text-sm font-medium text-orange-400">
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
        <Link href="/login" className="font-medium text-orange-400 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
