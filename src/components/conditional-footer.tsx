"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

export function ConditionalFooter() {
  const pathname = usePathname();

  // Don't render footer on docs routes (it's handled in the docs layout)
  if (pathname.startsWith("/docs")) {
    return null;
  }

  return <Footer />;
}
