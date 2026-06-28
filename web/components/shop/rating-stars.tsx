"use client";

import { Star } from "lucide-react";

/**
 * Affichage en étoiles d'une note 0-5 avec demi-étoiles.
 */
export function RatingStars({
  value,
  size = 14,
  showValue = false,
  className,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(5, value || 0));
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const filled = i + 1 <= Math.floor(safe);
    const half = !filled && i + 0.5 <= safe;
    return (
      <span key={i} className="relative inline-flex">
        <Star
          width={size} height={size}
          className={filled ? "fill-amber-500 text-amber-500" : "text-amber-500/30"}
        />
        {half && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <Star
              width={size} height={size}
              className="fill-amber-500 text-amber-500"
            />
          </span>
        )}
      </span>
    );
  });
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`}>
      {stars}
      {showValue && (
        <span className="ml-1 text-xs font-medium text-foreground/80">
          {safe.toFixed(1)}
        </span>
      )}
    </span>
  );
}
