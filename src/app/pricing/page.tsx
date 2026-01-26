"use client";

import React, { Suspense, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CheckIcon } from "@/components/icons/ui/check";
import { PackageIcon } from "@/components/icons/ui/package";
import { GlobeIcon } from "@/components/icons/ui/globe";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { ChevronDownIcon } from "@/components/icons/ui/chevron-down";
import { ScanSearchIcon } from "@/components/icons/ui/scan-search";
import { WorkflowIcon } from "@/components/icons/ui/workflow";
import { AiIcon } from "@/components/icons/ui/ai";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "Browse 10,000+ icons from 50+ libraries",
  "Copy React components & SVGs instantly",
  "Download custom icon bundles",
  "3 saved cloud bundles",
  "Full CLI access",
  "MCP server for AI workflows",
];

const PRO_FEATURES = [
  { text: "Everything in Free", comingSoon: false },
  { text: "Unlimited saved bundles", comingSoon: false },
  { text: "Share bundles with your team", comingSoon: false },
  { text: "Authenticated MCP", comingSoon: true },
  { text: "Brand kit for consistent icons", comingSoon: true },
  { text: "Custom icon uploads", comingSoon: true },
  { text: "Priority support", comingSoon: false },
];

const FAQ_ITEMS = [
  {
    question: "Do I need Pro to use Unicon?",
    answer: "No. The Free plan gives you full access to browse, copy, and download icons. Pro is for teams and power users who need unlimited cloud bundles and sharing.",
  },
  {
    question: "What counts as a 'saved bundle'?",
    answer: "A saved bundle is a collection of icons you save to the cloud for easy access across devices. Free users get 3 bundles, Pro users get unlimited. Local downloads don't count toward this limit.",
  },
  {
    question: "Can I share bundles with my team?",
    answer: "Yes! Pro users can generate public sharing links for any bundle. Share a single URL and your team can copy the exact icons you curated—no account required to view.",
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes. If you're not satisfied within the first 14 days, email us and we'll refund your subscription—no questions asked.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. Cancel your subscription anytime from your account settings. You'll keep Pro access until the end of your billing period.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-black/5 dark:border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-foreground transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{question}</span>
        <ChevronDownIcon
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100 pb-4" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function PricingContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { user, isPro, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const proCardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const wasCanceled = searchParams.get("canceled") === "true";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!proCardRef.current) return;
    const rect = proCardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

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
            <p className="text-sm font-medium text-[var(--accent-mint)] mb-3">Pricing</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              One library. Every icon you need.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop hunting across dozens of icon sites. Unicon brings 10,000+ icons from 50+ libraries into one searchable interface—with CLI and MCP built in.
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
            <div
              ref={proCardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#141414] p-7 relative overflow-hidden"
            >
              {/* Mouse-following aqua glow */}
              <div
                className="absolute w-[500px] h-[500px] pointer-events-none transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(circle, rgba(127, 211, 230, 0.08) 0%, transparent 70%)',
                  left: mousePos.x - 250,
                  top: mousePos.y - 250,
                  opacity: isHovering ? 1 : 0,
                }}
              />

              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-aqua)] to-transparent" />

              {/* Badge */}
              <div className="relative inline-flex self-start items-center gap-1.5 px-3 py-1.5 border border-[var(--accent-aqua)] rounded-full text-[0.7rem] font-semibold text-[var(--accent-aqua)] uppercase tracking-wide mb-5">
                ✦ Most Popular
              </div>

              <div className="relative mb-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-2xl" aria-hidden="true">🦄</span>
                  <h2 className="text-2xl font-semibold text-white">Pro</h2>
                </div>
                <div className="flex items-baseline gap-0.5 mb-1.5">
                  <span className="text-5xl font-bold text-white tracking-tighter">$29</span>
                  <span className="text-base text-white/50">/year</span>
                </div>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">
                  For teams and power users who need more.
                </p>
              </div>

              <ul className="relative space-y-3 mb-7 flex-1">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <span className="w-[18px] h-[18px] flex items-center justify-center text-[var(--accent-mint)] text-sm shrink-0">
                      ✓
                    </span>
                    <span className="text-sm text-white">{feature.text}</span>
                    {feature.comingSoon && (
                      <span className="ml-auto text-[0.65rem] px-1.5 py-0.5 bg-[var(--accent-lavender)]/15 rounded text-[var(--accent-lavender)] font-medium">
                        Coming Soon
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {isAuthLoading ? (
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
                  className="group relative w-full py-3.5 px-6 rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] border-t border-[#666]/30 transition-all duration-200 hover:scale-[1.03] hover:brightness-[1.15] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.17),0_4px_20px_rgba(255,255,255,0.03),0_0_30px_rgba(255,255,255,0.02)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{
                      background: "radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.13) 0%, transparent 50%), radial-gradient(circle at 70% 100%, rgba(255, 255, 255, 0.03) 0%, transparent 40%)",
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
                    <td className="py-3 px-4 text-foreground">Authenticated MCP</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-3 px-4 text-center text-[var(--accent-lavender)] text-xs">Coming soon</td>
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

          {/* Why Unicon */}
          <div className="mt-20">
            <h3 className="text-xl font-semibold text-foreground text-center mb-3">
              Why teams choose Unicon
            </h3>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              Built by developers who got tired of copy-pasting SVGs from five different tabs.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-lavender)]/10 flex items-center justify-center mb-3">
                  <ScanSearchIcon className="w-4 h-4 text-[var(--accent-lavender)]" />
                </div>
                <h4 className="font-medium text-foreground mb-2">One search, all icons</h4>
                <p className="text-sm text-muted-foreground">
                  Lucide, Heroicons, Phosphor, Tabler, and 50+ more libraries. Search once, find exactly what you need.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-aqua)]/10 flex items-center justify-center mb-3">
                  <WorkflowIcon className="w-4 h-4 text-[var(--accent-aqua)]" />
                </div>
                <h4 className="font-medium text-foreground mb-2">Copy-paste to production</h4>
                <p className="text-sm text-muted-foreground">
                  Get React components, Vue, SVG, or JSX with one click. No conversion tools needed.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-mint)]/10 flex items-center justify-center mb-3">
                  <AiIcon className="w-4 h-4 text-[var(--accent-mint)]" />
                </div>
                <h4 className="font-medium text-foreground mb-2">AI-native workflows</h4>
                <p className="text-sm text-muted-foreground">
                  MCP server lets Claude and other AI tools add icons directly. CLI integrates with your build process.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h3 className="text-xl font-semibold text-foreground text-center mb-3">
              Frequently asked questions
            </h3>
            <p className="text-center text-muted-foreground mb-8">
              Everything you need to know about Unicon.
            </p>
            <div className="max-w-2xl mx-auto rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] px-6">
              {FAQ_ITEMS.map((item, index) => (
                <FAQItem key={index} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              Still have questions? Email us at{" "}
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
