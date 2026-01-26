"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

  // Track request ID to prevent stale responses from overwriting newer data
  const requestIdRef = useRef(0);

  const fetchUserData = useCallback(
    async (user: User | null, requestId: number) => {
      if (!user) {
        // Only update if this is still the latest request
        if (requestId === requestIdRef.current) {
          setState({
            user: null,
            profile: null,
            subscription: null,
            isPro: false,
            isLoading: false,
          });
        }
        return;
      }

      const supabase = createClient();

      // Fetch profile and subscription in parallel
      const [profileResult, subscriptionResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
      ]);

      // Only update state if this is still the latest request
      // This prevents stale responses from overwriting newer data
      if (requestId !== requestIdRef.current) {
        return;
      }

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
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    const currentRequestId = ++requestIdRef.current;
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserData(user, currentRequestId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Increment request ID to invalidate any in-flight requests
        const newRequestId = ++requestIdRef.current;
        fetchUserData(session?.user ?? null, newRequestId);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  return state;
}
