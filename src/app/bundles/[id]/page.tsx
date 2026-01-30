import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { BundleDetailClient } from "@/components/bundles/bundle-detail-client";
import { getUser } from "@/lib/auth/actions";
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
    title: bundle.name,
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

  const { data: bundle, error } = await supabase
    .from("bundles")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.profile.id)
    .single();

  if (error || !bundle) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 px-4 lg:px-20 xl:px-40 py-8">
        <BundleDetailClient initialBundle={bundle as Bundle} />
      </div>
    </div>
  );
}
