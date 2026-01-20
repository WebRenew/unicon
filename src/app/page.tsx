import { MetallicIconBrowser } from "@/components/icons/metallic-icon-browser";
import { SiteHeader } from "@/components/site-header";
import { searchIcons, getTotalIconCount, getIconCountBySource, getCategories } from "@/lib/queries";

// Revalidate every 1 hour (ISR)
export const revalidate = 3600;

export default async function Home() {
  const [icons, totalCount, countBySource, categories] = await Promise.all([
    searchIcons({ limit: 320 }),
    getTotalIconCount(),
    getIconCountBySource(),
    getCategories(),
  ]);

  return (
    <>
      <SiteHeader />
      <MetallicIconBrowser
        initialIcons={icons}
        totalCount={totalCount}
        countBySource={countBySource}
        categories={categories}
      />
    </>
  );
}
