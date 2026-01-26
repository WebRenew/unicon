"use client";

import { useState } from "react";
import Link from "next/link";
import { PackageIcon } from "@/components/icons/ui/package";
import { ArrowLeftIcon } from "@/components/icons/ui/arrow-left";
import { GlobeIcon } from "@/components/icons/ui/globe";
import { BundleEditor } from "./bundle-editor";
import type { Bundle } from "@/types/database";

interface BundleDetailClientProps {
  initialBundle: Bundle;
}

export function BundleDetailClient({ initialBundle }: BundleDetailClientProps) {
  const [bundle, setBundle] = useState(initialBundle);

  const handleUpdate = (updatedBundle: Bundle) => {
    setBundle(updatedBundle);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back link */}
      <Link
        href="/bundles"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to bundles
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20">
          <PackageIcon className="w-7 h-7 text-[var(--accent-mint)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-foreground">{bundle.name}</h1>
            {bundle.is_public && (
              <GlobeIcon className="w-5 h-5 text-[var(--accent-aqua)]" />
            )}
          </div>
          {bundle.description && (
            <p className="text-muted-foreground">{bundle.description}</p>
          )}
        </div>
      </div>

      {/* Bundle Editor */}
      <BundleEditor bundle={bundle} onUpdate={handleUpdate} />

      {/* Footer info */}
      <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5">
        <p className="text-sm text-muted-foreground">
          Created {new Date(bundle.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {bundle.updated_at !== bundle.created_at && (
            <> · Last updated {new Date(bundle.updated_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}</>
          )}
        </p>
      </div>
    </div>
  );
}
