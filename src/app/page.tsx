import { MetallicIconBrowser } from "@/components/icons/metallic-icon-browser";
import { HomeHeader } from "@/components/home-header";
import { searchIcons, getTotalIconCount, getIconCountBySource, getCategories } from "@/lib/queries";
import { unstable_cache } from "next/cache";

// force-dynamic: CI/build environment has no DB credentials, so prerendering would fail.
// We still cache homepage DB reads at runtime using unstable_cache below.
export const dynamic = "force-dynamic";
const HOME_ICON_PAGE_SIZE = 160;

const getCachedHomePageData = unstable_cache(
  async () => {
    const [icons, totalCount, countBySource, categories] = await Promise.all([
      searchIcons({ limit: HOME_ICON_PAGE_SIZE }),
      getTotalIconCount(),
      getIconCountBySource(),
      getCategories(),
    ]);

    return {
      icons,
      totalCount,
      countBySource,
      categories,
    };
  },
  ["home-page-data-v1"],
  {
    revalidate: 60 * 15,
    tags: ["home-page-data"],
  }
);

export default async function Home() {
  const { icons, totalCount, countBySource, categories } = await getCachedHomePageData();

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
