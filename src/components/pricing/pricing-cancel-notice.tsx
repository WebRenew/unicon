"use client";

import { useSearchParams } from "next/navigation";

export function PricingCancelNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("canceled") !== "true") {
    return null;
  }

  return (
    <p className="mt-4 text-amber-600 dark:text-amber-400 text-sm">
      Checkout was canceled. No worries, you can try again anytime.
    </p>
  );
}
