import { AlertTriangleIcon } from "@/components/icons/ui/alert-triangle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconCart } from "./icon-cart";
import type { IconData } from "@/types/icon";

interface MetallicIconBrowserCartLayerProps {
  items: IconData[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onAddPack: (iconNames: string[]) => void;
  isCartOpen: boolean;
  onCartClose: () => void;
  confirmBundleOpen: boolean;
  pendingBundleCount: number;
  onConfirmBundleOpenChange: (open: boolean) => void;
  onConfirmBundleAdd: () => void;
}

export function MetallicIconBrowserCartLayer({
  items,
  onRemove,
  onClear,
  onAddPack,
  isCartOpen,
  onCartClose,
  confirmBundleOpen,
  pendingBundleCount,
  onConfirmBundleOpenChange,
  onConfirmBundleAdd,
}: MetallicIconBrowserCartLayerProps) {
  return (
    <>
      {/* Cart Drawer */}
      <IconCart
        items={items}
        onRemove={onRemove}
        onClear={onClear}
        onAddPack={onAddPack}
        isOpen={isCartOpen}
        onClose={onCartClose}
      />

      {/* Backdrop */}
      {isCartOpen && (
        <button
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onCartClose}
          aria-label="Close bundle drawer"
        />
      )}

      {/* Confirmation Dialog for Large Bundles */}
      <Dialog open={confirmBundleOpen} onOpenChange={onConfirmBundleOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
              Add {pendingBundleCount} Icons?
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              You&apos;re about to add a large number of icons to your bundle.
              This may increase your bundle size significantly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => onConfirmBundleOpenChange(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmBundleAdd}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent-mint)] text-black hover:bg-[var(--accent-mint)]/80 transition-colors"
            >
              Add All {pendingBundleCount} Icons
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
