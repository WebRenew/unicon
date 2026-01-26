import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { PackageIcon } from "@/components/icons/ui/package";
import { ArrowLeftIcon } from "@/components/icons/ui/arrow-left";
import { GlobeIcon } from "@/components/icons/ui/globe";
import { generateRenderableSvg } from "@/lib/icon-utils";
import { getUser } from "@/lib/auth/actions";
import type { Bundle, BundleIcon } from "@/types/database";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bundle } = await supabase
    .from("bundles")
    .select("name, description, icon_count")
    .eq("id", id)
    .single();

  if (!bundle) {
    return { title: "Bundle Not Found" };
  }

  return {
    title: bundle.name,
    description: bundle.description ?? `A collection of ${bundle.icon_count} icons`,
  };
}

/**
 * Renders an icon preview safely.
 * SECURITY: SVG content originates from curated icon libraries (Lucide, Phosphor, Huge Icons)
 * and is stored by authenticated users. This is not arbitrary user input.
 */
function IconPreview({
  icon,
  normalizeStrokes,
  targetStrokeWidth,
}: {
  icon: BundleIcon;
  normalizeStrokes: boolean;
  targetStrokeWidth: number | null;
}) {
  // Handle both old format (content) and new format (svg) for backwards compatibility
  const svgContent = icon.svg || (icon as unknown as { content?: string }).content;
  
  // Handle missing or empty SVG content
  if (!svgContent) {
    return (
      <div className="w-6 h-6 flex items-center justify-center">
        <PackageIcon className="w-4 h-4 text-black/20 dark:text-white/20" />
      </div>
    );
  }

  const svgHtml = generateRenderableSvg(
    {
      viewBox: icon.viewBox ?? "0 0 24 24",
      content: svgContent,
      defaultStroke: icon.defaultStroke ?? true,
      defaultFill: icon.defaultFill ?? false,
      strokeWidth: icon.strokeWidth ?? "2",
    },
    {
      size: 24,
      ...(normalizeStrokes && { strokeWidth: targetStrokeWidth ?? 2 }),
    }
  );

  return (
    <div
      className="w-6 h-6 text-black/70 dark:text-white/70 [&>svg]:w-full [&>svg]:h-full"
      // SVG content is from trusted icon libraries, not user input
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

export default async function BundleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/?login=required");
  }

  const supabase = await createClient();

  const { data: bundle, error } = await supabase
    .from("bundles")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.profile.id)
    .single();

  if (error || !bundle) {
    notFound();
  }

  const typedBundle = bundle as Bundle;
  const icons = Array.isArray(typedBundle.icons) ? typedBundle.icons as BundleIcon[] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 lg:px-20 xl:px-40 py-8">
        <div className="max-w-4xl mx-auto">
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
                <h1 className="text-2xl font-semibold text-foreground">{typedBundle.name}</h1>
                {typedBundle.is_public && (
                  <GlobeIcon className="w-5 h-5 text-[var(--accent-aqua)]" />
                )}
              </div>
              {typedBundle.description && (
                <p className="text-muted-foreground">{typedBundle.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>{typedBundle.icon_count} icons</span>
                {typedBundle.normalize_strokes && (
                  <>
                    <span className="text-black/20 dark:text-white/20">|</span>
                    <span>Normalized to {typedBundle.target_stroke_width}px</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Icon Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
            {icons.map((icon, i) => (
              <div
                key={i}
                className="group relative flex flex-col items-center justify-center p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors"
                title={icon.normalizedName}
              >
                <IconPreview
                  icon={icon}
                  normalizeStrokes={typedBundle.normalize_strokes}
                  targetStrokeWidth={typedBundle.target_stroke_width}
                />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-mono text-white bg-black/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {icon.normalizedName}
                </span>
              </div>
            ))}
          </div>

          {/* Footer info */}
          <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5">
            <p className="text-sm text-muted-foreground">
              Created {new Date(typedBundle.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {typedBundle.updated_at !== typedBundle.created_at && (
                <> · Last updated {new Date(typedBundle.updated_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}</>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
