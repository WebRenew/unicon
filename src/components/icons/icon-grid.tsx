"use client";

import { IconCard } from "./icon-card";
import type { IconData } from "@/types/icon";

interface IconGridProps {
  icons: IconData[];
  selectedIcon: IconData | null;
  onSelectIcon: (icon: IconData) => void;
}

export function IconGrid({ icons, selectedIcon, onSelectIcon }: IconGridProps) {
  if (icons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-foreground/80">No icons found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
      {icons.map((icon) => (
        <IconCard
          key={icon.id}
          icon={icon}
          isSelected={selectedIcon?.id === icon.id}
          onClick={() => onSelectIcon(icon)}
        />
      ))}
    </div>
  );
}
