"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  email: z.string().email("Email invalide"),
  first_name: z.string().min(2, "Prénom requis"),
  last_name: z.string().min(2, "Nom requis"),
  phone: z.string().min(8, "Téléphone requis").optional().or(z.literal("")),
  password: z.string().min(10, "10 caractères minimum"),
  country: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const search = useSearchParams();
  const role = (search.get("role") as "customer" | "printer" | "courier") ?? "customer";
  const register_ = useRegister();
  const [country, setCountry] = useState("CI");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: "CI" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await register_.mutateAsync({
        ...data,
        country,
        primary_role: role,
        phone: data.phone || undefined,
      });
      toast.success("Compte créé", {
        description: "Un code de vérification a été envoyé à votre email.",
      });
      router.push(`/otp?identifier=${encodeURIComponent(data.email)}&purpose=email_verify`);
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      toast.error("Inscription échouée", { description: typeof detail === "string" ? detail : "Réessayez." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {role === "printer" ? "Devenir imprimeur" : "Créer un compte"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Déjà un compte ? <Link href="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom</Label>
            <Input id="first_name" {...register("first_name")} />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Nom</Label>
            <Input id="last_name" {...register("last_name")} />
            {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input id="phone" type="tel" placeholder="+225 07 XX XX XX XX" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label>Pays</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CI">Côte d&apos;Ivoire</SelectItem>
              <SelectItem value="SN">Sénégal</SelectItem>
              <SelectItem value="BJ">Bénin</SelectItem>
              <SelectItem value="TG">Togo</SelectItem>
              <SelectItem value="BF">Burkina Faso</SelectItem>
              <SelectItem value="ML">Mali</SelectItem>
              <SelectItem value="CM">Cameroun</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" {...register("password")} />
          <p className="text-xs text-muted-foreground">10 caractères minimum, mélange recommandé.</p>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={register_.isPending}>
          {register_.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer mon compte
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos{" "}
          <Link href="/legal/cgu" className="underline">CGU</Link> et notre{" "}
          <Link href="/legal/privacy" className="underline">politique de confidentialité</Link>.
        </p>
      </form>
    </div>
  );
}
