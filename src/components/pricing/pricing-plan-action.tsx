"use client";

import { useState } from "react";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface PricingPlanActionProps {
  plan: "free" | "pro";
}

export function PricingPlanAction({ plan }: PricingPlanActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { user, isPro, isLoading: isAuthLoading } = useAuth();

  const handleSubscribe = async () => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    if (isPro) {
      toast.info("You're already subscribed to Pro!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setIsDowngrading(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to open subscription portal");
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Failed to open subscription portal");
      }
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open subscription portal");
      setIsDowngrading(false);
    }
  };

  const loginMessage =
    plan === "pro"
      ? "Sign in to upgrade to Unicon Pro."
      : "Sign in to get started with Unicon.";

  return (
    <>
      {plan === "free" ? (
        user ? (
          isPro ? (
            <button
              onClick={handleDowngrade}
              disabled={isDowngrading}
              className="w-full py-3 px-4 rounded-lg border border-black/10 dark:border-white/10 text-muted-foreground font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {isDowngrading ? (
                <Loader2Icon className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Downgrade"
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 px-4 rounded-lg border border-black/10 dark:border-white/10 text-muted-foreground font-medium cursor-default"
            >
              Current Plan
            </button>
          )
        ) : (
          <button
            onClick={() => setLoginDialogOpen(true)}
            className="w-full py-3 px-4 rounded-lg border border-black/10 dark:border-white/10 text-foreground font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Get Started
          </button>
        )
      ) : isAuthLoading ? (
        <button
          disabled
          className="relative w-full py-3.5 px-6 rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] text-white/50 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] border-t border-[#666]/30"
        >
          <Loader2Icon className="w-5 h-5 animate-spin mx-auto" />
        </button>
      ) : isPro ? (
        <button
          disabled
          className="relative w-full py-3.5 px-6 rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] text-white/50 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] border-t border-[#666]/30 cursor-default"
        >
          You&apos;re on Pro!
        </button>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="group relative w-full py-3.5 px-6 rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] border-t border-[#666]/30 transition-all duration-700 ease-in-out hover:scale-[1.03] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.17),0_4px_20px_rgba(255,255,255,0.03),0_0_30px_rgba(255,255,255,0.02)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
            style={{ background: "hsl(0, 0%, 1%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-all duration-700 ease-in-out group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.06) 0%, transparent 50%), radial-gradient(circle at 70% 100%, rgba(255, 255, 255, 0.015) 0%, transparent 40%)",
            }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2" style={{ textShadow: "none" }}>
            {isLoading ? (
              <>
                <Loader2Icon className="w-5 h-5 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              "Upgrade to Pro"
            )}
          </span>
        </button>
      )}

      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        message={loginMessage}
      />
    </>
  );
}
