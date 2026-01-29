"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchIcon } from "@/components/icons/ui/search";
import { PackageIcon } from "@/components/icons/ui/package";
import { XIcon } from "@/components/icons/ui/x";
import { CheckIcon } from "@/components/icons/ui/check";
import { CopyIcon } from "@/components/icons/ui/copy";
import { TerminalIcon } from "@/components/icons/ui/terminal";
import { ArrowRightIcon } from "@/components/icons/ui/arrow-right";
import { V0Icon } from "@/components/icons/ui/v0";
import { STARTER_PACKS, type StarterPack } from "@/lib/starter-packs";
import { generateV0Prompt } from "@/lib/icon-utils";
import { logger } from "@/lib/logger";

type CategoryFilter = "all" | "ui" | "brand";

export function PacksGrid() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [copiedPackId, setCopiedPackId] = useState<string | null>(null);
  const [copiedV0PackId, setCopiedV0PackId] = useState<string | null>(null);

  // Filter packs based on search and category
  const filteredPacks = useMemo(() => {
    let packs = STARTER_PACKS;

    // Category filter
    if (category === "brand") {
      packs = packs.filter((p) => p.id.startsWith("brand-"));
    } else if (category === "ui") {
      packs = packs.filter((p) => !p.id.startsWith("brand-"));
    }

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      packs = packs.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.iconNames.some((name) => name.toLowerCase().includes(query))
      );
    }

    return packs;
  }, [search, category]);

  // Count by category
  const uiPacksCount = STARTER_PACKS.filter((p) => !p.id.startsWith("brand-")).length;
  const brandPacksCount = STARTER_PACKS.filter((p) => p.id.startsWith("brand-")).length;

  // Add pack to bundle and navigate home
  const handleAddPack = useCallback(
    async (pack: StarterPack) => {
      try {
        // Fetch icons by name
        const params = new URLSearchParams({
          names: pack.iconNames.join(","),
        });
        const res = await fetch(`/api/icons?${params}`);
        if (!res.ok) throw new Error("Failed to fetch icons");

        const data = await res.json();
        const fetchedIcons = data.icons || [];

        if (fetchedIcons.length === 0) {
          toast.error("No icons found for this pack");
          return;
        }

        // Get existing cart from localStorage with validation
        let existingItems: Array<{ id: string }> = [];
        try {
          const raw = localStorage.getItem("unicon-bundle");
          const parsed = raw ? JSON.parse(raw) : [];
          existingItems = Array.isArray(parsed) ? parsed : [];
        } catch {
          // Corrupted cart data, reset it
          existingItems = [];
        }
        const existingIds = new Set(existingItems.map((i) => i.id));

        // Merge, skipping duplicates
        const newIcons = fetchedIcons.filter(
          (icon: { id: string }) => !existingIds.has(icon.id)
        );
        const mergedCart = [...existingItems, ...newIcons];

        // Save to localStorage
        localStorage.setItem("unicon-bundle", JSON.stringify(mergedCart));

        // Notify cart update
        window.dispatchEvent(new Event("cartUpdate"));

        toast.success(`Added "${pack.name}" pack (${newIcons.length} icons)`);

        // Navigate to home and open cart
        router.push("/");
        // Small delay to ensure navigation completes
        setTimeout(() => {
          window.dispatchEvent(new Event("openCart"));
        }, 100);
      } catch (error) {
        logger.error("Failed to add pack:", error);
        toast.error("Failed to add pack");
      }
    },
    [router]
  );

  const clearSearch = () => setSearch("");

  const handleCopyV0Prompt = async (pack: StarterPack, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const params = new URLSearchParams({ names: pack.iconNames.join(",") });
      const res = await fetch(`/api/icons?${params}`);
      if (!res.ok) throw new Error("Failed to fetch icons");
      const data = await res.json();
      const icons = data.icons || [];
      if (icons.length === 0) {
        toast.error("No icons found for this pack");
        return;
      }
      const prompt = generateV0Prompt(icons);
      await navigator.clipboard.writeText(prompt);
      setCopiedV0PackId(pack.id);
      toast.success("v0 prompt copied to clipboard");
      setTimeout(() => setCopiedV0PackId(null), 2000);
    } catch (error) {
      logger.error("Failed to copy v0 prompt:", error);
      toast.error("Failed to copy v0 prompt");
    }
  };

  const handleCopyPackCommand = async (pack: StarterPack, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const iconSample = pack.iconNames.slice(0, 5).join(" ");
      const command = `npx @webrenew/unicon bundle --query "${iconSample}" --limit ${pack.iconNames.length}`;
      await navigator.clipboard.writeText(command);
      setCopiedPackId(pack.id);
      toast.success("CLI command copied to clipboard");
      setTimeout(() => setCopiedPackId(null), 2000);
    } catch (error) {
      logger.error("Failed to copy CLI command:", error);
      toast.error("Failed to copy CLI command");
    }
  };

  return (
    <div className="space-y-8">
      <style>{`
        .search-gradient-border {
          --gradient-stop: 8%;
          --gradient-opacity: 1;
          background-image: linear-gradient(135deg, color-mix(in srgb, var(--accent-lavender), transparent calc((1 - var(--gradient-opacity)) * 100%)) 0%, rgba(0,0,0,0.1) var(--gradient-stop), rgba(0,0,0,0.1) 100%);
          transition: --gradient-stop 0.5s cubic-bezier(0.4, 0, 0.2, 1), --gradient-opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dark .search-gradient-border {
          background-image: linear-gradient(135deg, color-mix(in srgb, var(--accent-lavender), transparent calc((1 - var(--gradient-opacity)) * 100%)) 0%, rgba(255,255,255,0.1) var(--gradient-stop), rgba(255,255,255,0.1) 100%);
        }
        .search-gradient-border:focus-within {
          --gradient-stop: 100%;
          --gradient-opacity: 0.4;
          transform: scale(1.01);
        }
      `}</style>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40 z-10" />
          <div className="search-gradient-border rounded-lg p-[1px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packs..."
              className="w-full bg-white dark:bg-[hsl(0,0%,3%)] rounded-lg pl-10 pr-10 py-2.5 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 text-sm focus:outline-none focus:ring-0 focus:bg-gray-50 dark:focus:bg-[hsl(0,0%,5%)] transition-colors duration-500"
            />
          </div>
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors z-10"
              aria-label="Clear search"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              category === "all"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            All ({STARTER_PACKS.length})
          </button>
          <button
            onClick={() => setCategory("ui")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              category === "ui"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            UI Packs ({uiPacksCount})
          </button>
          <button
            onClick={() => setCategory("brand")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              category === "brand"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            Brand Packs ({brandPacksCount})
          </button>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-black/50 dark:text-white/50">
          {filteredPacks.length} pack{filteredPacks.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Grid - Edge-to-edge style matching checkout cart */}
      {filteredPacks.length > 0 ? (
        <div className="border border-black/10 dark:border-white/10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {filteredPacks.map((pack, index) => {
              const iconSample = pack.iconNames.slice(0, 5).join(" ");
              const command = `npx @webrenew/unicon bundle --query "${iconSample}" --limit ${pack.iconNames.length}`;
              const isEven = index % 2 === 0;
              const isLastRow = index >= filteredPacks.length - 2;
              const isLastOddItem = filteredPacks.length % 2 === 1 && index === filteredPacks.length - 1;

              return (
                <div
                  key={pack.id}
                  className={`group bg-transparent hover:bg-black/[0.02] dark:hover:bg-[var(--accent-mint)]/5 transition-all
                    ${isEven && !isLastOddItem ? "md:border-r border-black/10 dark:border-white/10" : ""}
                    ${!isLastRow && !isLastOddItem ? "border-b border-black/10 dark:border-white/10" : ""}
                    ${isLastOddItem ? "md:col-span-2 md:border-r-0" : ""}
                  `}
                >
                  <button
                    onClick={() => handleAddPack(pack)}
                    className="w-full p-4 pb-2 text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-black dark:text-white group-hover:text-[var(--accent-mint)] dark:group-hover:text-[var(--accent-mint)] transition-colors duration-[650ms] ease-out">
                        {pack.name}
                      </span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 text-[var(--accent-mint)] transition-all duration-[650ms] ease-out">Add to cart</span>
                        <ArrowRightIcon className="w-4 h-4 text-black/20 dark:text-white/20 group-hover:text-[var(--accent-mint)] dark:group-hover:text-[var(--accent-mint)] group-hover:translate-x-0.5 transition-all duration-[650ms] ease-out" />
                      </div>
                    </div>
                    <p className="text-[11px] text-black/50 dark:text-white/50 leading-relaxed mb-2">
                      {pack.description}
                    </p>
                    <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                      {pack.iconNames.length} icons
                    </span>
                  </button>

                  {/* CLI Command + v0 Prompt */}
                  <div className="px-4 pb-3 flex gap-1.5">
                    <button
                      onClick={(e) => handleCopyPackCommand(pack, e)}
                      className="flex-1 relative flex items-center gap-1.5 px-2 py-1.5 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group/cmd min-w-0 overflow-hidden"
                      title="Copy CLI command"
                    >
                      <TerminalIcon className="w-3 h-3 text-black/40 dark:text-white/40 group-hover/cmd:text-black/60 dark:group-hover/cmd:text-white/60 shrink-0" />
                      <span className="relative flex-1 min-w-0 overflow-hidden">
                        {/* Command text - always rendered */}
                        <span
                          className={`block text-[9px] font-mono whitespace-nowrap ${copiedPackId === pack.id ? "text-[var(--accent-mint)]" : "text-black/50 dark:text-white/50"}`}
                          style={{ maskImage: 'linear-gradient(to right, black calc(100% - 32px), transparent)', WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 32px), transparent)' }}
                        >
                          <span className="dark:group-hover:text-[var(--accent-mint)] transition-colors duration-[650ms] ease-out">{command}</span>
                        </span>
                        {/* Copied overlay */}
                        {copiedPackId === pack.id && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-semibold text-[var(--accent-mint)] bg-black/5 dark:bg-white/5 rounded">
                            Copied!
                          </span>
                        )}
                      </span>
                      {copiedPackId === pack.id ? (
                        <CheckIcon className="w-3 h-3 text-[var(--accent-mint)] shrink-0" />
                      ) : (
                        <CopyIcon className="w-3 h-3 text-black/30 dark:text-white/30 group-hover/cmd:text-black/50 dark:group-hover/cmd:text-white/50 transition-colors shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleCopyV0Prompt(pack, e)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors text-[9px] font-mono leading-none shrink-0"
                      title="Copy v0 prompt"
                    >
                      {copiedV0PackId === pack.id ? (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <span>Copy</span>
                          <V0Icon className="w-3 h-3" />
                          <span>Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <PackageIcon className="w-8 h-8 text-black/30 dark:text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No packs found</h3>
          <p className="text-sm text-muted-foreground">
            Try a different search term or category
          </p>
        </div>
      )}
    </div>
  );
}
