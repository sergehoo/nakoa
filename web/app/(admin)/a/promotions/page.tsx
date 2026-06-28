"use client";

import { useMemo, useState } from "react";
import { Megaphone, Plus, Tag, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useCampaigns,
  useCouponCodes,
  useCreateCampaign,
  useDeleteCampaign,
  useDeleteCode,
  useGenerateCodes,
  useRedemptions,
  useUpdateCampaign,
  type Campaign,
} from "@/hooks/use-promotions";
import { formatCurrency } from "@/lib/utils";

const EMPTY_CAMPAIGN: Partial<Campaign> = {
  name: "",
  slug: "",
  description: "",
  status: "draft",
  discount_type: "percentage",
  discount_value: "0.10",
  currency: "XOF",
  max_discount_amount: null,
  min_order_amount: "0",
  per_user_limit: 1,
  total_usage_limit: null,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: null,
  conditions: {},
  is_public: false,
};

export default function AdminPromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Promotions & Coupons
        </h1>
        <p className="text-sm text-muted-foreground">
          Campagnes promotionnelles, codes promo et historique d'utilisation.
        </p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Megaphone className="mr-1.5 h-4 w-4" /> Campagnes
          </TabsTrigger>
          <TabsTrigger value="codes">
            <Tag className="mr-1.5 h-4 w-4" /> Codes
          </TabsTrigger>
          <TabsTrigger value="redemptions">
            <Wand2 className="mr-1.5 h-4 w-4" /> Utilisations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="pt-4">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="codes" className="pt-4">
          <CodesTab />
        </TabsContent>
        <TabsContent value="redemptions" className="pt-4">
          <RedemptionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Onglet Campagnes
// ============================================================
function CampaignsTab() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [open, setOpen] = useState(false);
  const [genOpen, setGenOpen] = useState<Campaign | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {campaigns?.length ?? 0} campagne(s) configurée(s).
        </p>
        <Button onClick={() => {
          setEditing({ ...EMPTY_CAMPAIGN });
          setOpen(true);
        }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nouvelle campagne
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucune campagne. Crée la première pour activer les codes promo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignRow
              key={c.id}
              campaign={c}
              onEdit={() => {
                setEditing(c);
                setOpen(true);
              }}
              onGenerate={() => setGenOpen(c)}
            />
          ))}
        </div>
      )}

      <CampaignDialog open={open} onOpenChange={setOpen} campaign={editing} />
      {genOpen && (
        <GenerateCodesDialog
          campaign={genOpen}
          open={!!genOpen}
          onOpenChange={(b) => !b && setGenOpen(null)}
        />
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  onEdit,
  onGenerate,
}: {
  campaign: Campaign;
  onEdit: () => void;
  onGenerate: () => void;
}) {
  const del = useDeleteCampaign();
  const valueLabel =
    campaign.discount_type === "percentage"
      ? `${(Number(campaign.discount_value) * 100).toFixed(2)}%`
      : campaign.discount_type === "free_shipping"
        ? "Livraison offerte"
        : formatCurrency(Number(campaign.discount_value));

  const statusColor =
    campaign.status === "active"
      ? "bg-emerald-500/15 text-emerald-600"
      : campaign.status === "paused"
        ? "bg-orange-500/15 text-orange-600"
        : campaign.status === "ended"
          ? "bg-secondary text-muted-foreground"
          : "bg-secondary text-muted-foreground";

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{campaign.name}</p>
            <Badge className={statusColor + " text-[10px]"}>{campaign.status_label}</Badge>
            <Badge variant="outline" className="text-[10px]">{valueLabel}</Badge>
            {campaign.is_public && (
              <Badge className="bg-pink-500/15 text-pink-600 text-[10px]">Auto-applied</Badge>
            )}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              {campaign.slug}
            </code>
          </div>
          {campaign.description && (
            <p className="mt-1 text-xs text-muted-foreground">{campaign.description}</p>
          )}
          <p className="mt-1 text-xs">
            <span className="text-muted-foreground">Codes :</span>{" "}
            <span className="font-medium">{campaign.codes_count}</span>
            {" · "}
            <span className="text-muted-foreground">Utilisations :</span>{" "}
            <span className="font-medium">
              {campaign.usage_count}
              {campaign.total_usage_limit ? ` / ${campaign.total_usage_limit}` : ""}
            </span>
            {Number(campaign.min_order_amount) > 0 && (
              <> · min {formatCurrency(Number(campaign.min_order_amount))}</>
            )}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Du {new Date(campaign.starts_at).toLocaleDateString("fr-FR")}{" "}
            {campaign.ends_at &&
              `au ${new Date(campaign.ends_at).toLocaleDateString("fr-FR")}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onGenerate}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Générer codes
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>Éditer</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Supprimer la campagne "${campaign.name}" ?`)) {
                del.mutate(campaign.id, {
                  onSuccess: () => toast.success("Campagne supprimée"),
                  onError: () => toast.error("Échec de la suppression"),
                });
              }
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignDialog({
  open,
  onOpenChange,
  campaign,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  campaign: Partial<Campaign> | null;
}) {
  const create = useCreateCampaign();
  const update = useUpdateCampaign();

  const [form, setForm] = useState<Partial<Campaign>>(campaign ?? EMPTY_CAMPAIGN);
  useMemo(() => {
    if (open) {
      setForm({
        ...(campaign ?? EMPTY_CAMPAIGN),
        starts_at: campaign?.starts_at?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
        ends_at: campaign?.ends_at?.slice(0, 16) ?? null,
      });
    }
  }, [open, campaign]);

  const set = <K extends keyof Campaign>(key: K, value: Campaign[K] | Partial<Campaign>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    // Parse conditions JSON
    let conditions: Record<string, unknown> = {};
    if (typeof form.conditions === "string") {
      try {
        conditions = JSON.parse(form.conditions || "{}");
      } catch {
        toast.error("Conditions JSON invalides");
        return;
      }
    } else if (form.conditions) {
      conditions = form.conditions as Record<string, unknown>;
    }

    const payload = { ...form, conditions };

    try {
      if (campaign?.id) {
        await update.mutateAsync({ ...payload, id: campaign.id });
        toast.success("Campagne mise à jour");
      } else {
        await create.mutateAsync(payload);
        toast.success("Campagne créée");
      }
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } } };
      toast.error("Échec", {
        description: JSON.stringify(err?.response?.data ?? "Erreur").slice(0, 200),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{campaign?.id ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom</Label>
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Statut</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.status ?? "draft"}
                onChange={(e) => set("status", e.target.value as Campaign["status"])}
              >
                <option value="draft">Brouillon</option>
                <option value="active">Active</option>
                <option value="paused">En pause</option>
                <option value="ended">Terminée</option>
              </select>
            </div>
            <div>
              <Label>Type de remise</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.discount_type ?? "percentage"}
                onChange={(e) => set("discount_type", e.target.value as Campaign["discount_type"])}
              >
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
                <option value="free_shipping">Livraison gratuite</option>
                <option value="credit">Crédit / cashback</option>
              </select>
            </div>
            <div>
              <Label>Devise</Label>
              <Input value={form.currency ?? "XOF"} onChange={(e) => set("currency", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valeur</Label>
              <Input
                type="number"
                step="0.01"
                value={form.discount_value ?? "0"}
                onChange={(e) => set("discount_value", e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ex: 0.10 = 10% pour pourcentage
              </p>
            </div>
            <div>
              <Label>Plafond remise</Label>
              <Input
                type="number"
                step="0.01"
                value={form.max_discount_amount ?? ""}
                onChange={(e) => set("max_discount_amount", e.target.value || null)}
                placeholder="∞"
              />
            </div>
            <div>
              <Label>Commande min.</Label>
              <Input
                type="number"
                step="0.01"
                value={form.min_order_amount ?? "0"}
                onChange={(e) => set("min_order_amount", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Démarre le</Label>
              <Input
                type="datetime-local"
                value={form.starts_at ?? ""}
                onChange={(e) => set("starts_at", e.target.value)}
              />
            </div>
            <div>
              <Label>Se termine le (optionnel)</Label>
              <Input
                type="datetime-local"
                value={form.ends_at ?? ""}
                onChange={(e) => set("ends_at", e.target.value || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Limite globale</Label>
              <Input
                type="number"
                value={form.total_usage_limit ?? ""}
                onChange={(e) => set("total_usage_limit", e.target.value ? Number(e.target.value) : null)}
                placeholder="Illimité"
              />
            </div>
            <div>
              <Label>Par utilisateur</Label>
              <Input
                type="number"
                value={form.per_user_limit ?? 1}
                onChange={(e) => set("per_user_limit", Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label>Conditions (DSL JSON)</Label>
            <Textarea
              rows={5}
              className="font-mono text-xs"
              value={
                typeof form.conditions === "string"
                  ? (form.conditions as string)
                  : JSON.stringify(form.conditions ?? {}, null, 2)
              }
              onChange={(e) => set("conditions", e.target.value as unknown as Record<string, unknown>)}
              placeholder='{"all":[{"fact":"order.total","op":"gt","value":50000}]}'
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_public ?? false}
              onChange={(e) => set("is_public", e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            <span>Auto-appliquée (sans code, à toute commande éligible)</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {campaign?.id ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerateCodesDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const gen = useGenerateCodes();
  const [count, setCount] = useState(10);
  const [prefix, setPrefix] = useState(campaign.slug.slice(0, 4).toUpperCase());
  const [length, setLength] = useState(8);

  const submit = async () => {
    try {
      const res = await gen.mutateAsync({
        campaignId: campaign.id,
        count, prefix, length,
      });
      toast.success(`${res.created} code(s) généré(s)`);
      onOpenChange(false);
    } catch {
      toast.error("Échec de la génération");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Générer des codes — {campaign.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Quantité (1–1000)</Label>
            <Input
              type="number" min={1} max={1000}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Préfixe</Label>
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                maxLength={16}
              />
            </div>
            <div>
              <Label>Longueur suffixe</Label>
              <Input
                type="number" min={4} max={24}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ex : <code>{prefix}XXXXXXXX</code> (caractères alphanumériques aléatoires)
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={gen.isPending}>
            <Wand2 className="mr-1.5 h-4 w-4" />
            Générer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Onglet Codes
// ============================================================
function CodesTab() {
  const { data: codes, isLoading } = useCouponCodes();
  const del = useDeleteCode();

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!codes || codes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun code. Génère-en depuis une campagne.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/30">
              <th className="px-4 py-2 text-left font-semibold">Code</th>
              <th className="px-4 py-2 text-left font-semibold">Campagne</th>
              <th className="px-4 py-2 text-left font-semibold">Usage</th>
              <th className="px-4 py-2 text-left font-semibold">Expiration</th>
              <th className="px-4 py-2 text-left font-semibold">Statut</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b hover:bg-secondary/20">
                <td className="px-4 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-2">{c.campaign_name}</td>
                <td className="px-4 py-2 text-xs">
                  {c.redemption_count}
                  {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-2">
                  <Badge
                    variant={c.is_usable_now ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {c.is_usable_now ? "OK" : "Off"}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Supprimer le code "${c.code}" ?`)) {
                        del.mutate(c.id, {
                          onSuccess: () => toast.success("Code supprimé"),
                          onError: () => toast.error("Échec"),
                        });
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Onglet Utilisations
// ============================================================
function RedemptionsTab() {
  const [filter, setFilter] = useState<string>("");
  const { data: redemptions, isLoading } = useRedemptions(
    filter ? { status: filter } : undefined,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Statut :</Label>
        <select
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Tous</option>
          <option value="applied">Appliquées</option>
          <option value="pending">En attente</option>
          <option value="reversed">Annulées</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : !redemptions || redemptions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucune utilisation pour ce filtre.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Code</th>
                  <th className="px-4 py-2 text-left font-semibold">Campagne</th>
                  <th className="px-4 py-2 text-left font-semibold">Utilisateur</th>
                  <th className="px-4 py-2 text-left font-semibold">Remise</th>
                  <th className="px-4 py-2 text-left font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-secondary/20">
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.code_value}</td>
                    <td className="px-4 py-2 text-xs">{r.campaign_name}</td>
                    <td className="px-4 py-2 text-xs">{r.user_email}</td>
                    <td className="px-4 py-2 font-medium">
                      {formatCurrency(Number(r.discount_amount))} {r.currency}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          r.status === "applied"
                            ? "default"
                            : r.status === "reversed"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
