"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOutIcon } from "@/components/icons/ui/log-out";
import { PackageIcon } from "@/components/icons/ui/package";
import { CrownIcon } from "@/components/icons/ui/crown";
import { SettingsIcon } from "@/components/icons/ui/settings";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/types/database";

interface UserMenuProps {
  profile: Profile;
  isPro: boolean;
}

export function UserMenu({ profile, isPro }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      setIsSigningOut(false);
    }
  };

  const avatarUrl = profile.avatar_url;
  const displayName = profile.full_name ?? profile.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 hover:ring-2 hover:ring-black/20 dark:hover:ring-white/20 transition-all"
          aria-label="User menu"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-black/70 dark:text-white/70">
              {initials}
            </span>
          )}
          {isPro && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[hsl(0,0%,6%)]">
              <CrownIcon className="w-2 h-2 text-white" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <div className="px-3 py-2 border-b border-black/5 dark:border-white/5">
          <p className="text-sm font-medium text-black dark:text-white truncate">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {profile.email}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {isPro ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-600 dark:text-amber-400">
                <CrownIcon className="w-2.5 h-2.5" />
                Pro
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/5 text-muted-foreground">
                Free
              </span>
            )}
          </div>
        </div>

        <div className="py-1">
          <Link
            href="/bundles"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
          >
            <PackageIcon className="w-4 h-4" />
            My Bundles
          </Link>

          {!isPro && (
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-aqua)] hover:bg-[var(--accent-aqua)]/5 rounded-md transition-colors"
            >
              <CrownIcon className="w-4 h-4" />
              Upgrade to Pro
            </Link>
          )}

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </Link>
        </div>

        <div className="pt-1 border-t border-black/5 dark:border-white/5">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
          >
            {isSigningOut ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <LogOutIcon className="w-4 h-4" />
            )}
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
