"use client";

import { useState } from "react";
import { Check, CreditCard, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  code: string;
  name: string;
  icon: string;
  description: string;
  fee?: string;
  type: "mobile" | "card" | "bank";
}

const METHODS: PaymentMethod[] = [
  { code: "wave", name: "Wave", icon: "💙", description: "Mobile Money — frais réduits", fee: "1 %", type: "mobile" },
  { code: "orange_money", name: "Orange Money", icon: "🟠", description: "Mobile Money UEMOA", fee: "1,5 %", type: "mobile" },
  { code: "mtn_momo", name: "MTN MoMo", icon: "🟡", description: "MTN Mobile Money", fee: "1,5 %", type: "mobile" },
  { code: "moov_money", name: "Moov Money", icon: "🔷", description: "Moov Africa", fee: "1,5 %", type: "mobile" },
  { code: "cinetpay", name: "CinetPay", icon: "💳", description: "Carte bancaire + Mobile Money", fee: "2,5 %", type: "card" },
  { code: "stripe", name: "Carte internationale", icon: "💎", description: "Visa, Mastercard, Amex", fee: "2,9 %", type: "card" },
  { code: "paystack", name: "Paystack", icon: "🟢", description: "Cartes + transfert bancaire", fee: "1,5 %", type: "card" },
  { code: "flutterwave", name: "Flutterwave", icon: "🌊", description: "Multi-méthodes", fee: "2 %", type: "card" },
];

export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {METHODS.map((m) => (
        <Card
          key={m.code}
          className={cn(
            "cursor-pointer p-4 transition-all hover:shadow-md",
            value === m.code && "ring-2 ring-primary",
          )}
          onClick={() => onChange(m.code)}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{m.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{m.name}</p>
                {value === m.code && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">{m.description}</p>
              {m.fee && <p className="mt-1 text-[10px] font-medium text-muted-foreground">Frais {m.fee}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
