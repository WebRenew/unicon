"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckIcon } from "@/components/icons/ui/check";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { PackageIcon } from "@/components/icons/ui/package";
import { toast } from "sonner";
import type { IconData } from "@/types/icon";

interface SaveBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icons: IconData[];
  normalizeStrokes?: boolean;
  targetStrokeWidth?: number;
  onSaved?: () => void;
}

export function SaveBundleDialog({
  open,
  onOpenChange,
  icons,
  normalizeStrokes,
  targetStrokeWidth,
  onSaved,
}: SaveBundleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Bundle name is required");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          icons: icons.map((icon) => ({
            id: icon.id,
            name: icon.name,
            normalizedName: icon.normalizedName,
            sourceId: icon.sourceId,
            svg: icon.content,
            viewBox: icon.viewBox,
            strokeWidth: icon.strokeWidth,
            defaultFill: icon.defaultFill,
            defaultStroke: icon.defaultStroke,
          })),
          normalize_strokes: normalizeStrokes ?? false,
          target_stroke_width: targetStrokeWidth ?? null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to save bundle");
      }

      toast.success("Bundle saved successfully");
      onOpenChange(false);
      setName("");
      setDescription("");
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save bundle");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-[var(--accent-mint)]" />
            Save Bundle
          </DialogTitle>
          <DialogDescription>
            Save your {icons.length} icon{icons.length !== 1 ? "s" : ""} to the cloud for later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="bundle-name" className="text-sm font-medium text-foreground">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="bundle-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Icon Bundle"
              className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent-mint)]/50"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bundle-description" className="text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <textarea
              id="bundle-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Icons for my project..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent-mint)]/50 resize-none"
            />
          </div>

          {normalizeStrokes && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 text-xs text-muted-foreground">
              <CheckIcon className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
              Stroke normalization will be saved ({targetStrokeWidth}px)
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-mint)] text-black text-sm font-medium hover:bg-[var(--accent-mint)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <PackageIcon className="w-4 h-4" />
                Save Bundle
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
