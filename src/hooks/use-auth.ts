"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, Subscription } from "@/types/database";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isPro: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    subscription: null,
    isPro: false,
    isLoading: true,
  });

  const fetchUserData = useCallback(async (user: User | null) => {
    if (!user) {
      setState({
        user: null,
        profile: null,
        subscription: null,
        isPro: false,
        isLoading: false,
      });
      return;
    }

    const supabase = createClient();

    // Fetch profile and subscription in parallel
    const [profileResult, subscriptionResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
    ]);

    const profile = profileResult.data as Profile | null;
    const subscription = subscriptionResult.data as Subscription | null;
    const isPro = subscription?.plan === "pro" && subscription?.status === "active";

    setState({
      user,
      profile,
      subscription,
      isPro,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserData(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        fetchUserData(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  return state;
}
