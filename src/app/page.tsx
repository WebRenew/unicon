import { MetallicIconBrowser } from "@/components/icons/metallic-icon-browser";
import { HomeHeader } from "@/components/home-header";
import { searchIcons, getTotalIconCount, getIconCountBySource, getCategories } from "@/lib/queries";

// force-dynamic: CI/build environment has no DB credentials, so prerendering would fail.
// Caching is handled at the API/CDN layer instead (see /api/icons cache headers).
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
