import { MetallicIconBrowser } from "@/components/icons/metallic-icon-browser";
import { searchIcons, getTotalIconCount, getIconCountBySource } from "@/lib/queries";

// Revalidate every 1 hour (ISR)
export const revalidate = 3600;

export default async function Home() {
  const [icons, totalCount, countBySource] = await Promise.all([
    searchIcons({ limit: 160 }),
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
