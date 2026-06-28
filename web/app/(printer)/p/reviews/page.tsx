"use client";

import { useState } from "react";
import {
  Award, CheckCircle2, Loader2, MessageSquare, ShieldCheck, Sparkles, Star,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { useReviews, useRespondReview, type Review } from "@/hooks/use-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/domain/star-rating";
import { formatDate, initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

function RespondDialog({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState(review.printer_response ?? "");
  const respond = useRespondReview();

  const submit = async () => {
    if (!response.trim()) {
      toast.error("Saisissez une réponse");
      return;
    }
    try {
      await respond.mutateAsync({ id: review.id, response: response.trim() });
      toast.success("Réponse publiée");
      setOpen(false);
    } catch {
      toast.error("Échec");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
          {review.printer_response ? "Modifier la réponse" : "Répondre"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Répondre à l&apos;avis</DialogTitle>
          <DialogDescription>
            Votre réponse sera visible publiquement à côté de cet avis. Restez courtois et constructif.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border bg-secondary/30 p-3">
            <div className="flex items-center gap-2">
              <StarRating value={review.overall_rating} readOnly size="sm" />
              {review.title && <p className="text-sm font-medium">{review.title}</p>}
            </div>
            {review.body && (
              <p className="mt-1 text-xs italic text-muted-foreground">« {review.body} »</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Votre réponse</Label>
            <textarea
              rows={4}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Merci pour votre retour. Concernant votre point…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={respond.isPending}>
            {respond.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="surface-premium">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-rose-500 text-xs text-white">
              {review.customer_initials ?? initials(review.customer_name ?? "C")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{review.customer_name ?? "Client vérifié"}</p>
              {review.is_verified && (
                <Badge variant="success" className="gap-1 text-[10px]">
                  <ShieldCheck className="h-3 w-3" /> Vérifié
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(review.created_at)}
            </p>
          </div>
          <StarRating value={review.overall_rating} readOnly size="sm" showValue />
        </div>

        {review.title && <p className="font-semibold">{review.title}</p>}
        {review.body && <p className="text-sm leading-relaxed">{review.body}</p>}

        {/* Sous-notes */}
        <div className="grid gap-2 rounded-lg border bg-secondary/30 p-3 text-xs md:grid-cols-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Qualité</span>
            <StarRating value={review.quality_rating} readOnly size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Délai</span>
            <StarRating value={review.delivery_rating} readOnly size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Communication</span>
            <StarRating value={review.communication_rating} readOnly size="sm" />
          </div>
        </div>

        {/* Réponse imprimeur */}
        {review.printer_response && (
          <div className="rounded-lg border-l-2 border-orange-500/50 bg-orange-500/5 p-3">
            <p className="text-xs font-semibold text-orange-400">Votre réponse</p>
            <p className="mt-1 text-sm">{review.printer_response}</p>
            {review.printer_response_at && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Publiée le {formatDate(review.printer_response_at)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-1">
          <RespondDialog review={review} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function PrinterReviewsPage() {
  const [filter, setFilter] = useState<"all" | "unanswered">("all");
  const { data, isLoading } = useReviews();
  const list = (data as Review[] | undefined) ?? [];

  const filtered = filter === "unanswered"
    ? list.filter((r) => !r.printer_response)
    : list;

  // Stats
  const avg = list.length > 0
    ? list.reduce((s, r) => s + r.overall_rating, 0) / list.length
    : 0;
  const fiveStars = list.filter((r) => r.overall_rating === 5).length;
  const unanswered = list.filter((r) => !r.printer_response).length;
  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: list.filter((r) => r.overall_rating === star).length,
    pct: list.length > 0 ? (list.filter((r) => r.overall_rating === star).length / list.length) * 100 : 0,
  })).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Avis clients</h1>
        <p className="text-sm text-muted-foreground">
          Les retours de vos clients pèsent sur votre PrintHub Score et votre visibilité.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_2fr]">
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{avg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">note moyenne</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{fiveStars}</p>
              <p className="text-xs text-muted-foreground">avis 5★</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{unanswered}</p>
              <p className="text-xs text-muted-foreground">sans réponse</p>
            </div>
          </CardContent>
        </Card>
        {/* Distribution */}
        <Card className="surface-premium">
          <CardContent className="space-y-1.5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Distribution
            </p>
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-mono">{d.star}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Tous ({list.length})
        </Button>
        <Button
          variant={filter === "unanswered" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unanswered")}
        >
          Sans réponse ({unanswered})
        </Button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="surface-premium">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/15 to-amber-500/10">
              <Sparkles className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold">
                {filter === "unanswered" ? "Toutes les réponses sont à jour" : "Pas encore d'avis"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "unanswered"
                  ? "Bravo, vous avez répondu à tous les retours."
                  : "Vos premiers clients laisseront leurs avis après livraison."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}
