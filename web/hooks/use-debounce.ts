"use client";

import { useEffect, useState } from "react";

/**
 * Retarde la mise à jour d'une valeur de `delay` ms.
 * Utile pour les champs de recherche : ne lancer la requête API
 * qu'après que l'utilisateur a arrêté de taper.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
