"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart";

export default function CartHydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!useCartStore.persist.hasHydrated()) void useCartStore.persist.rehydrate();
  }, []);

  return children;
}
