import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { BundlesList } from "@/components/bundles/bundles-list";
import { getUser } from "@/lib/auth/actions";

export const metadata = {
  title: "My Bundles",
  description: "View and manage your saved icon bundles",
};

export default async function BundlesPage() {
  const user = await getUser();

  if (!user) {
    redirect("/?login=required");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 lg:px-20 xl:px-40 py-8">
        <div className="max-w-6xl mx-auto">
          <BundlesList isPro={user.isPro} />
        </div>
      </main>
    </div>
  );
}
