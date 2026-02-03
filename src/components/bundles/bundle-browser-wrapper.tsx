"use client";

import { useState } from "react";
import { BundleBrowser } from "./bundle-browser";
import type { Bundle } from "@/types/database";

interface BundleBrowserWrapperProps {
  initialBundle: Bundle;
  categories: string[];
}

export function BundleBrowserWrapper({ 
  initialBundle, 
  categories,
}: BundleBrowserWrapperProps) {
  const [bundle, setBundle] = useState(initialBundle);

  return (
    <BundleBrowser
      bundle={bundle}
      categories={categories}
      onUpdate={setBundle}
    />
  );
}
