import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeHeader } from "@/components/home-header";
import { BundleBrowserWrapper } from "@/components/bundles/bundle-browser-wrapper";
import { getUser } from "@/lib/auth/actions";
import { getCategories } from "@/lib/queries";
import type { Bundle } from "@/types/database";
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
    title: `${bundle.name} | Unicon`,
    description: bundle.description ?? `A collection of ${bundle.icon_count} icons`,
  };
}

export default async function BundleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/?login=required");
  }

  const supabase = await createClient();

  const [bundleResult, categories] = await Promise.all([
    supabase
      .from("bundles")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.profile.id)
      .single(),
    getCategories(),
  ]);

  if (bundleResult.error || !bundleResult.data) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HomeHeader />
      <BundleBrowserWrapper 
        initialBundle={bundleResult.data as Bundle}
        categories={categories}
      />
    </div>
  );
}
