import { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PacksGrid } from "@/components/packs/packs-grid";

export const metadata: Metadata = {
  title: "Starter Packs | Unicon",
  description:
    "Browse curated icon starter packs for dashboards, e-commerce, social media, developer tools, and more. One-click add to your bundle.",
  keywords: [
    "icon packs",
    "starter packs",
    "icon bundles",
    "dashboard icons",
    "ui icons",
    "brand icons",
    "developer icons",
  ],
  alternates: {
    canonical: "/packs",
  },
  openGraph: {
    title: "Unicon Starter Packs",
    description:
      "Curated icon collections for common use cases. Add entire packs to your bundle with one click.",
    url: "https://unicon.sh/packs",
    type: "website",
  },
};

export default function PacksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[hsl(0,0%,3%)]">
      <SiteHeader />
      <main className="flex-1 px-4 lg:px-20 xl:px-40 py-8 lg:pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-3">
              Starter Packs
            </h1>
            <p className="text-lg text-black/60 dark:text-white/60 max-w-2xl">
              Curated icon collections for common use cases. Click any pack to add
              all its icons to your bundle, or copy the CLI command.
            </p>
          </div>

          {/* Grid */}
          <PacksGrid />
        </div>
      </main>
    </div>
  );
}
