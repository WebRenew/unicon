"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Subscription, UserWithSubscription } from "@/types/database";

export async function signInWithGitHub() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getUser(): Promise<UserWithSubscription | null> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Fetch profile and subscription in parallel
  const [profileResult, subscriptionResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
  ]);

  if (profileResult.error || !profileResult.data) {
    return null;
  }

  const profile = profileResult.data as Profile;
  const subscription = (subscriptionResult.data as Subscription) ?? {
    id: "",
    user_id: user.id,
    status: "active" as const,
    plan: "free" as const,
    provider: null,
    provider_subscription_id: null,
    provider_customer_id: null,
    current_period_end: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    profile,
    subscription,
    isPro: subscription.plan === "pro" && subscription.status === "active",
  };
}

export async function getUserBundleCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from("bundles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return count ?? 0;
}

export async function canCreateBundle(): Promise<{ allowed: boolean; reason?: string }> {
  const userData = await getUser();

  if (!userData) {
    return { allowed: false, reason: "Not authenticated" };
  }

  if (userData.isPro) {
    return { allowed: true };
  }

  const bundleCount = await getUserBundleCount();

  if (bundleCount >= 3) {
    return {
      allowed: false,
      reason: "Free plan limited to 3 saved bundles. Upgrade to Pro for unlimited.",
    };
  }

  return { allowed: true };
}
