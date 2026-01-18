import { MetallicIconBrowser } from "@/components/icons/metallic-icon-browser";
import { searchIcons, getTotalIconCount, getIconCountBySource } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [icons, totalCount, countBySource] = await Promise.all([
    searchIcons({ limit: 500 }),
    getTotalIconCount(),
    getIconCountBySource(),
  ]);

  return (
    <MetallicIconBrowser
      initialIcons={icons}
      totalCount={totalCount}
      countBySource={countBySource}
    />
  );
}
