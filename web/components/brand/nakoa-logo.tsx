"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  /** Variante visuelle :
   * - "wordmark" → logo complet "nakoa" (PNG officiel, ratio 2600x836)
   * - "icon" → variante carrée "N" stylisée (SVG inline)
   * - "icon-bg" → "N" sur fond gradient (pour avatars, sidebar)
   */
  variant?: "wordmark" | "icon" | "icon-bg";
  /** Taille en pixels pour les variantes icon (hauteur pour wordmark) */
  size?: number;
  /** Classes additionnelles */
  className?: string;
  /** Priority loading (hero, header) */
  priority?: boolean;
}

export function NakoaLogo({ variant = "wordmark", size = 36, className, priority = false }: Props) {
  // Mode wordmark : utilise le PNG officiel
  if (variant === "wordmark") {
    const width = Math.round(size * (2600 / 836)); // ratio original
    return (
      <Image
        src="/nakoa-logo.png"
        alt="Nakoa"
        width={width}
        height={size}
        priority={priority}
        className={cn("h-auto select-none", className)}
        style={{ height: size, width: "auto" }}
      />
    );
  }

  // Mode icon : "N" stylisé reprenant la palette du logo (rose → violet → orange)
  if (variant === "icon-bg") {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-xl",
          "bg-gradient-to-br from-pink-500 via-violet-500 to-orange-500",
          "shadow-lg shadow-violet-500/30",
          className,
        )}
        style={{ width: size, height: size }}
        aria-label="Nakoa"
      >
        <svg
          viewBox="0 0 100 100"
          className="h-3/5 w-3/5"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* "N" stylisé blanc */}
          <path
            d="M 20 80 L 20 25 Q 20 18 28 18 Q 35 18 38 25 L 65 70 L 65 25 Q 65 18 72 18 Q 80 18 80 25 L 80 75 Q 80 82 72 82 Q 65 82 62 75 L 35 30 L 35 80 Q 35 87 27 87 Q 20 87 20 80 Z"
            fill="white"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Petit point orange (le crayon du logo) */}
          <circle cx="78" cy="20" r="6" fill="#FF8533" />
        </svg>
      </div>
    );
  }

  // Mode icon nu (sans fond, le N adopte la couleur courante via stroke/fill)
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("text-foreground", className)}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nakoa"
    >
      <defs>
        <linearGradient id="nakoa-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E91E8C" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#FF8533" />
        </linearGradient>
      </defs>
      <path
        d="M 20 80 L 20 25 Q 20 18 28 18 Q 35 18 38 25 L 65 70 L 65 25 Q 65 18 72 18 Q 80 18 80 25 L 80 75 Q 80 82 72 82 Q 65 82 62 75 L 35 30 L 35 80 Q 35 87 27 87 Q 20 87 20 80 Z"
        fill="url(#nakoa-grad)"
      />
      <circle cx="78" cy="20" r="6" fill="#FF8533" />
    </svg>
  );
}
