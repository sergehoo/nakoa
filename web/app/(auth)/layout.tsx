import Link from "next/link";
import { Printer } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Hero side */}
      <div className="relative hidden bg-gradient-to-br from-primary to-primary/70 p-12 text-white md:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,white_0%,transparent_50%)] opacity-15" />
        <div className="relative flex h-full flex-col">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Printer className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Nakoa</span>
          </Link>
          <div className="mt-auto space-y-6">
            <blockquote className="text-2xl font-medium leading-snug text-balance">
              « Nakoa a divisé par 3 le temps que nous passions à comparer des imprimeurs.
              Aujourd&apos;hui, on commande en 5 minutes. »
            </blockquote>
            <div>
              <p className="font-semibold">Aïssata Diallo</p>
              <p className="text-sm text-white/70">Directrice marketing — Agence Brand&apos;O, Abidjan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
