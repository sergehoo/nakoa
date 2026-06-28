"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  showValue?: boolean;
}

const SIZES = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({ value, onChange, size = "md", readOnly = false, showValue = false }: Props) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            className={cn(
              "transition-transform",
              !readOnly && "cursor-pointer hover:scale-125",
              readOnly && "cursor-default",
            )}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                SIZES[size],
                filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold">
          {value.toFixed(1)}<span className="text-muted-foreground">/5</span>
        </span>
      )}
    </div>
  );
}
