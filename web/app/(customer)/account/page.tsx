"use client";

import { useMe } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  const { data: me, isLoading } = useMe();

  if (isLoading || !me) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Mon compte</h1>

      <Card>
        <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={me.avatar} />
            <AvatarFallback className="text-lg">{initials(me.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold">{me.full_name}</p>
            <p className="text-sm text-muted-foreground">{me.email}</p>
            <p className="text-sm text-muted-foreground">{me.phone ?? "Téléphone non renseigné"}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant={me.is_email_verified ? "success" : "secondary"}>Email {me.is_email_verified ? "vérifié" : "à vérifier"}</Badge>
              <Badge variant={me.is_phone_verified ? "success" : "secondary"}>Téléphone {me.is_phone_verified ? "vérifié" : "à vérifier"}</Badge>
              <Badge variant="default">KYC niveau {me.kyc_level}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Authentification à deux facteurs</p>
            <p className="text-sm text-muted-foreground">
              {me.two_factor_enabled ? "Activée" : "Renforcez la sécurité de votre compte"}
            </p>
          </div>
          <Button asChild variant={me.two_factor_enabled ? "outline" : "default"}>
            <Link href="/two-factor">{me.two_factor_enabled ? "Gérer" : "Activer"}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
