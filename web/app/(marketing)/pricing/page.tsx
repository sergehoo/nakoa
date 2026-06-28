"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NakoaLogo } from "@/components/brand/nakoa-logo";
import { useAuth } from "@/hooks/use-auth";
import { usePlans, type Plan } from "@/hooks/use-subscriptions";
import { formatCurrency } from "@/lib/utils";

const ROLE_TABS = [
  { code: "printer", label: "Imprimeur" },
  { code: "customer_corporate", label: "Entreprise" },
];

const FEATURE_LABELS: Record<string, string> = {
  catalogue_base: "Catalogue de base",
  catalogue_etendu: "Catalogue étendu",
  catalogue_illimite: "Catalogue illimité",
  chat_client: "Chat client intégré",
  production_kanban: "Tableau Kanban production",
  statistiques: "Statistiques",
  statistiques_avancees: "Statistiques avancées",
  ai_assistant: "Assistant IA",
  ai_assistant_pro: "Assistant IA Pro",
  api_access: "Accès API",
  white_label_partiel: "White-label partiel",
  support_email: "Support email",
  support_prio: "Support prioritaire",
  support_24_7: "Support 24/7",
  manager_dedie: "Manager dédié",
  sla_dedie: "SLA dédié",
  isolation_donnees: "Données isolées",
  sso: "SSO d'entreprise",
  sso_saml: "SSO SAML",
  audit_log: "Audit log",
  training: "Formation incluse",
  facturation_b2b: "Facturation B2B",
  multi_utilisateurs: "Multi-utilisateurs",
  multi_marques: "Multi-marques",
  bons_de_commande: "Bons de commande",
  delais_paiement: "Délais de paiement",
  tableau_de_bord_equipe: "Tableau de bord équipe",
  custom_branding: "Branding sur-mesure",
  tout_business: "Tout du plan Business",
};

function formatFeature(code: string): string {
  return FEATURE_LABELS[code] ?? code.replace(/_/g, " ");
}

export default function PricingPage() {
  const { isAuthenticated, role } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [tab, setTab] = useState<string>("printer");

  const { data: plans, isLoading } = usePlans();

  const visiblePlans = useMemo(() => {
    if (!plans) return [];
    return plans
      .filter((p) => p.is_public && p.is_active)
      .filter((p) => p.target_role === tab || p.target_role === "any")
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [plans, tab]);

  return (
    <div className="container py-16">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl space-y-4 text-center"
      >
        <NakoaLogo variant="icon-bg" size={56} className="mx-auto" />
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Des tarifs simples,{" "}
          <span className="bg-gradient-to-r from-pink-500 via-violet-500 to-orange-500 bg-clip-text text-transparent">
            qui scalent avec vous
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Démarrez gratuitement, montez en gamme quand le besoin arrive.
          Aucune carte requise pour l'essai.
        </p>
      </motion.div>

      {/* Sélecteur cible + cycle */}
      <div className="mx-auto mt-10 flex flex-col items-center gap-4">
        <div className="inline-flex rounded-full border bg-secondary/30 p-1">
          {ROLE_TABS.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => setTab(t.code)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.code
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-3 rounded-full border bg-secondary/30 p-1">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              billing === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              billing === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Annuel{" "}
            <Badge variant="outline" className="ml-1.5 text-[10px]">
              −16%
            </Badge>
          </button>
        </div>
      </div>

      {/* Cartes plans */}
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-3xl bg-secondary/30" />
          ))
        ) : visiblePlans.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">
            Aucun plan disponible pour cette cible pour l'instant.
          </div>
        ) : (
          visiblePlans.map((plan, idx) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billing={billing}
              highlighted={plan.is_highlight}
              isAuthenticated={isAuthenticated}
              currentRole={role}
              delay={idx * 0.08}
            />
          ))
        )}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Besoin d'un plan sur-mesure ?{" "}
        <Link href="/contact" className="font-medium text-orange-500 hover:underline">
          Parlons-en
        </Link>
      </p>
    </div>
  );
}

function PricingCard({
  plan,
  billing,
  highlighted,
  isAuthenticated,
  currentRole,
  delay = 0,
}: {
  plan: Plan;
  billing: "monthly" | "yearly";
  highlighted?: boolean;
  isAuthenticated: boolean;
  currentRole: string | null;
  delay?: number;
}) {
  const price = billing === "yearly" ? Number(plan.yearly_price) : Number(plan.monthly_price);
  const hasPrice = price > 0;

  // Construit la cible du CTA
  const targetHref = isAuthenticated
    ? `/account/subscription?plan=${plan.code}&cycle=${billing}`
    : `/register/choose?next=${encodeURIComponent(`/account/subscription?plan=${plan.code}&cycle=${billing}`)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card
        className={`relative h-full overflow-hidden transition-all ${
          highlighted
            ? "border-pink-500/50 shadow-xl shadow-pink-500/15"
            : "border-border/60 hover:border-orange-500/40"
        }`}
      >
        {highlighted && (
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-pink-500 via-violet-500 to-orange-500 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white">
            ★ Le plus populaire
          </div>
        )}
        <CardContent className={`flex h-full flex-col gap-5 p-7 ${highlighted ? "pt-10" : ""}`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold tracking-tight">{plan.name}</h3>
              {plan.trial_days > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {plan.trial_days} j gratuits
                </Badge>
              )}
            </div>
            {plan.tagline && (
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            )}
          </div>

          <div className="space-y-1">
            {hasPrice ? (
              <>
                <p className="font-display text-4xl font-bold">
                  {formatCurrency(price)}
                  <span className="text-base font-normal text-muted-foreground">
                    /{billing === "monthly" ? "mois" : "an"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{plan.currency}</p>
              </>
            ) : (
              <p className="font-display text-3xl font-bold">Sur devis</p>
            )}
          </div>

          <ul className="flex-1 space-y-2 text-sm">
            {plan.features.slice(0, 8).map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-foreground/85">{formatFeature(f)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1 rounded-md bg-secondary/40 p-3 text-xs">
            <p>
              <span className="font-medium">Commission marketplace :</span>{" "}
              {plan.commission_pct}%
            </p>
            {plan.max_products > 0 && (
              <p>
                <span className="font-medium">Produits :</span> {plan.max_products}
              </p>
            )}
            {plan.max_team_members > 0 && (
              <p>
                <span className="font-medium">Équipe :</span> {plan.max_team_members}
              </p>
            )}
          </div>

          <Button
            asChild
            size="lg"
            variant={highlighted ? "default" : "outline"}
            className="w-full"
          >
            <Link href={targetHref}>
              {plan.cta_label || (hasPrice ? "Choisir ce plan" : "Nous contacter")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
