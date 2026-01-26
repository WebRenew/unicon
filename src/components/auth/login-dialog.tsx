"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GithubIcon } from "@/components/icons/ui/github";
import { GoogleIcon } from "@/components/icons/ui/google";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { signInWithGitHub, signInWithGoogle } from "@/lib/auth/actions";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function LoginDialog({ open, onOpenChange, message }: LoginDialogProps) {
  const [isLoading, setIsLoading] = useState<"github" | "google" | null>(null);

  const handleGitHubSignIn = async () => {
    setIsLoading("github");
    try {
      await signInWithGitHub();
    } catch {
      setIsLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    try {
      await signInWithGoogle();
    } catch {
      setIsLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Sign in to Unicon</DialogTitle>
          <DialogDescription className="text-center">
            {message ?? "Save your icon bundles to the cloud and access them anywhere."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleGitHubSignIn}
            disabled={isLoading !== null}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-[#24292e] hover:bg-[#24292e]/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === "github" ? (
              <Loader2Icon className="w-5 h-5 animate-spin" />
            ) : (
              <GithubIcon className="w-5 h-5" />
            )}
            Continue with GitHub
          </button>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading !== null}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-white hover:bg-gray-50 text-gray-900 font-medium border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === "google" ? (
              <Loader2Icon className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            Continue with Google
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
}
