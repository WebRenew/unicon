"use client";

import { useState } from "react";
import { BundleBrowser } from "./bundle-browser";
import type { Bundle } from "@/types/database";
import type { IconData } from "@/types/icon";

interface BundleBrowserWrapperProps {
  initialBundle: Bundle;
  categories: string[];
  initialIcons: IconData[];
  totalIconCount: number;
  countBySource: Record<string, number>;
}

export function BundleBrowserWrapper({ 
  initialBundle, 
  categories,
  initialIcons,
  totalIconCount,
  countBySource,
}: BundleBrowserWrapperProps) {
  const [bundle, setBundle] = useState(initialBundle);

  return (
    <BundleBrowser
      bundle={bundle}
      categories={categories}
      initialIcons={initialIcons}
      totalIconCount={totalIconCount}
      countBySource={countBySource}
      onUpdate={setBundle}
    />
  );
}
