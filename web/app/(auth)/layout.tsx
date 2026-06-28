import Link from "next/link";
import { NakoaLogo } from "@/components/brand/nakoa-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Hero side */}
      <div className="relative hidden overflow-hidden p-12 text-white md:block bg-gradient-to-br from-pink-600 via-violet-700 to-violet-900">
        {/* Halo lumineux */}
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-500/30 blur-3xl" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-pink-500/30 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <Link href="/" className="inline-block self-start" aria-label="Nakoa — accueil">
            <NakoaLogo variant="wordmark" size={44} priority className="brightness-0 invert" />
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
        <div className="w-full max-w-md">
          {/* Logo mobile au-dessus du formulaire */}
          <div className="mb-8 flex justify-center md:hidden">
            <Link href="/" aria-label="Nakoa — accueil">
              <NakoaLogo variant="wordmark" size={40} priority />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
