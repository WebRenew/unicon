import { MetallicIconBrowser } from "@/components/icons/metallic-icon-browser";
import { HomeHeader } from "@/components/home-header";
import { searchIcons, getTotalIconCount, getIconCountBySource, getCategories } from "@/lib/queries";

// Avoid build-time DB fetches in CI/build environments.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [icons, totalCount, countBySource, categories] = await Promise.all([
    searchIcons({ limit: 320 }),
    getTotalIconCount(),
    getIconCountBySource(),
    getCategories(),
  ]);

  return (
    <>
      <HomeHeader />
      <MetallicIconBrowser
        initialIcons={icons}
        totalCount={totalCount}
        countBySource={countBySource}
        categories={categories}
      />
    </>
  );
}
