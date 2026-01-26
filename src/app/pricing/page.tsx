"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CheckIcon } from "@/components/icons/ui/check";
import { PackageIcon } from "@/components/icons/ui/package";
import { GlobeIcon } from "@/components/icons/ui/globe";
import { ZapIcon } from "@/components/icons/ui/zap";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const FREE_FEATURES = [
  "Browse 10,000+ icons",
  "Copy React components & SVGs",
  "Download icon bundles",
  "3 saved cloud bundles",
  "CLI access",
  "MCP server integration",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited saved bundles",
  "Public bundle sharing links",
  "API access for automation",
  "Brand kit (coming soon)",
  "Custom icon uploads (coming soon)",
  "Priority support",
];

function PricingContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { user, isPro, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();

  const wasCanceled = searchParams.get("canceled") === "true";

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
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 lg:px-20 xl:px-40 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-semibold text-foreground mb-3">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to build with icons. Start free, upgrade when you need more.
            </p>
            {wasCanceled && (
              <p className="mt-4 text-amber-600 dark:text-amber-400 text-sm">
                Checkout was canceled. No worries, you can try again anytime.
              </p>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="flex flex-col rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <PackageIcon className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold text-foreground">Free</h2>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Perfect for personal projects and trying out Unicon.
                </p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="w-full py-3 px-4 rounded-lg border border-black/10 dark:border-white/10 text-muted-foreground font-medium cursor-default"
              >
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="flex flex-col rounded-2xl border-2 border-[var(--accent-lavender)]/30 bg-gradient-to-b from-[var(--accent-lavender)]/5 to-transparent p-6 relative">
              <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[var(--accent-lavender)] text-white text-xs font-medium">
                Most Popular
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg" aria-hidden="true">🦄</span>
                  <h2 className="text-xl font-semibold text-foreground">Pro</h2>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">$29</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  For teams and power users who need more.
                </p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-[var(--accent-lavender)] mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {isAuthLoading ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg bg-[var(--accent-lavender)] text-white font-medium opacity-50"
                >
                  <Loader2Icon className="w-5 h-5 animate-spin mx-auto" />
                </button>
              ) : isPro ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg bg-[var(--accent-lavender)] text-white font-medium opacity-50 cursor-default"
                >
                  You&apos;re on Pro!
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg bg-[var(--accent-lavender)] hover:bg-[var(--accent-lavender)]/90 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="w-5 h-5 animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : (
                    <>
                      <ZapIcon className="w-5 h-5" />
                      Upgrade to Pro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-foreground text-center mb-8">
              Compare Plans
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-[var(--accent-lavender)]">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  <tr>
                    <td className="py-3 px-4 text-foreground">Icon browsing & search</td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">Copy & download</td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">CLI access</td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">Saved cloud bundles</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">3</td>
                    <td className="py-3 px-4 text-center text-[var(--accent-lavender)] font-medium">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground flex items-center gap-2">
                      <GlobeIcon className="w-4 h-4" />
                      Public sharing links
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">API access</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-3 px-4 text-center"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">Brand kit</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-3 px-4 text-center text-[var(--accent-lavender)] text-xs">Coming soon</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">Custom uploads</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-3 px-4 text-center text-[var(--accent-lavender)] text-xs">Coming soon</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              Questions? Email us at{" "}
              <a href="mailto:contact@webrenew.io" className="text-[var(--accent-aqua)] hover:underline">
                contact@webrenew.io
              </a>
            </p>
          </div>
        </div>
      </main>

      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        message="Sign in to upgrade to Unicon Pro."
      />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1 flex items-center justify-center">
            <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
          </main>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
