"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useCreateReview } from "@/hooks/use-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/domain/star-rating";

interface Props {
  orderId: string;
  onSubmitted?: () => void;
  printerName?: string;
}

export function ReviewForm({ orderId, onSubmitted, printerName }: Props) {
  const [overall, setOverall] = useState(0);
  const [quality, setQuality] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const create = useCreateReview();

  const valid = overall > 0 && quality > 0 && delivery > 0 && communication > 0;

  const submit = async () => {
    if (!valid) {
      toast.error("Veuillez noter tous les critères");
      return;
    }
    try {
      await create.mutateAsync({
        order: orderId,
        overall_rating: overall,
        quality_rating: quality,
        delivery_rating: delivery,
        communication_rating: communication,
        title: title.trim(),
        body: body.trim(),
      });
      toast.success("Merci pour votre avis !", {
        description: "Votre retour aide les autres clients à choisir.",
      });
      onSubmitted?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error("Impossible d'envoyer", {
        description: err?.response?.data?.detail ?? "Réessayez",
      });
    }
  };

  return (
    <Card className="surface-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-400" />
          Donnez votre avis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {printerName ? `Comment s'est passée votre expérience avec ${printerName} ?` : "Votre retour aide la communauté."}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Note globale */}
        <div className="rounded-xl border bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-4">
          <Label className="mb-2 block text-center text-sm font-semibold">Note globale</Label>
          <div className="flex justify-center">
            <StarRating value={overall} onChange={setOverall} size="lg" />
          </div>
          {overall > 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {overall === 5 && "Excellent !"}
              {overall === 4 && "Très bien"}
              {overall === 3 && "Correct"}
              {overall === 2 && "Décevant"}
              {overall === 1 && "Très insatisfaisant"}
            </p>
          )}
        </div>

        {/* Détail par critère */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs">Qualité d&apos;impression</Label>
            <StarRating value={quality} onChange={setQuality} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Délai de livraison</Label>
            <StarRating value={delivery} onChange={setDelivery} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Communication</Label>
            <StarRating value={communication} onChange={setCommunication} />
          </div>
        </div>

        {/* Commentaire */}
        <div className="space-y-2">
          <Label htmlFor="title">Titre (optionnel)</Label>
          <Input
            id="title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Impression nickel, livraison rapide"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Détails (optionnel)</Label>
          <textarea
            id="body" rows={4} value={body} onChange={(e) => setBody(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Décrivez votre expérience : qualité, délai, accueil, conseils…"
          />
        </div>

        <Button
          onClick={submit}
          disabled={!valid || create.isPending}
          size="lg"
          className="w-full"
        >
          {create.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Publier mon avis
        </Button>
      </CardContent>
    </Card>
  );
}
