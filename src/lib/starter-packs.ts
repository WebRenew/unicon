/**
 * Pre-defined starter packs for common use cases.
 * These curated bundles help users quickly get the icons they need.
 */

export interface StarterPack {
  id: string;
  name: string;
  description: string;
  iconNames: string[];
  color: string;
}

export const STARTER_PACKS: StarterPack[] = [
  {
    id: "dashboard",
    name: "Dashboard Essentials",
    description: "Core UI icons for admin dashboards",
    color: "cyan",
    iconNames: [
      "home",
      "settings",
      "user",
      "users",
      "bell",
      "search",
      "menu",
      "x",
      "check",
      "plus",
      "minus",
      "edit",
      "trash",
      "eye",
      "eye-off",
      "log-out",
      "log-in",
      "lock",
      "unlock",
      "key",
      "shield",
      "activity",
      "bar-chart",
      "pie-chart",
      "trending-up",
      "trending-down",
      "calendar",
      "clock",
      "filter",
      "sliders",
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce Kit",
    description: "Shopping, payments, and product icons",
    color: "emerald",
    iconNames: [
      "shopping-cart",
      "shopping-bag",
      "credit-card",
      "wallet",
      "package",
      "truck",
      "store",
      "tag",
      "percent",
      "receipt",
      "gift",
      "heart",
      "star",
      "thumbs-up",
      "thumbs-down",
      "share",
      "bookmark",
      "box",
      "archive",
      "scan",
      "qr-code",
      "barcode",
      "scale",
      "calculator",
    ],
  },
  {
    id: "social",
    name: "Social Media Pack",
    description: "Engagement and social interaction icons",
    color: "pink",
    iconNames: [
      "heart",
      "message-circle",
      "message-square",
      "send",
      "share",
      "share-2",
      "bookmark",
      "flag",
      "bell",
      "at-sign",
      "hash",
      "link",
      "external-link",
      "user-plus",
      "user-minus",
      "users",
      "smile",
      "frown",
      "meh",
      "thumbs-up",
      "thumbs-down",
      "award",
      "zap",
      "trending-up",
    ],
  },
  {
    id: "files",
    name: "File Manager",
    description: "Documents, folders, and file operations",
    color: "amber",
    iconNames: [
      "file",
      "file-text",
      "file-plus",
      "file-minus",
      "file-check",
      "file-x",
      "folder",
      "folder-open",
      "folder-plus",
      "folder-minus",
      "upload",
      "download",
      "cloud",
      "cloud-upload",
      "cloud-download",
      "save",
      "copy",
      "clipboard",
      "scissors",
      "paperclip",
      "image",
      "video",
      "music",
      "archive",
    ],
  },
  {
    id: "navigation",
    name: "Navigation Set",
    description: "Arrows, menus, and directional icons",
    color: "violet",
    iconNames: [
      "arrow-up",
      "arrow-down",
      "arrow-left",
      "arrow-right",
      "chevron-up",
      "chevron-down",
      "chevron-left",
      "chevron-right",
      "chevrons-up",
      "chevrons-down",
      "chevrons-left",
      "chevrons-right",
      "corner-down-left",
      "corner-down-right",
      "corner-up-left",
      "corner-up-right",
      "move",
      "maximize",
      "minimize",
      "menu",
      "more-horizontal",
      "more-vertical",
      "grid",
      "list",
    ],
  },
  {
    id: "media",
    name: "Media Controls",
    description: "Play, pause, and media player icons",
    color: "rose",
    iconNames: [
      "play",
      "pause",
      "stop-circle",
      "skip-back",
      "skip-forward",
      "rewind",
      "fast-forward",
      "volume",
      "volume-1",
      "volume-2",
      "volume-x",
      "mic",
      "mic-off",
      "video",
      "video-off",
      "camera",
      "image",
      "film",
      "tv",
      "monitor",
      "headphones",
      "speaker",
      "radio",
      "podcast",
    ],
  },
];

/**
 * Get a starter pack by ID
 */
export function getStarterPack(id: string): StarterPack | undefined {
  return STARTER_PACKS.find((pack) => pack.id === id);
}

/**
 * Get color classes for a pack - uses consistent light/dark mode patterns
 */
interface PackColorClasses {
  bg: string;
  border: string;
  text: string;
  icon: string;
}

const DEFAULT_COLORS: PackColorClasses = {
  bg: "bg-cyan-500/5 dark:bg-cyan-500/10",
  border: "border-cyan-500/10 dark:border-cyan-500/20",
  text: "text-cyan-700 dark:text-cyan-400",
  icon: "text-cyan-500/60 dark:text-cyan-400/60",
};

const PACK_COLORS: Record<string, PackColorClasses> = {
  cyan: DEFAULT_COLORS,
  emerald: {
    bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
    border: "border-emerald-500/10 dark:border-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: "text-emerald-500/60 dark:text-emerald-400/60",
  },
  pink: {
    bg: "bg-pink-500/5 dark:bg-pink-500/10",
    border: "border-pink-500/10 dark:border-pink-500/20",
    text: "text-pink-700 dark:text-pink-400",
    icon: "text-pink-500/60 dark:text-pink-400/60",
  },
  amber: {
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    border: "border-amber-500/10 dark:border-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    icon: "text-amber-500/60 dark:text-amber-400/60",
  },
  violet: {
    bg: "bg-violet-500/5 dark:bg-violet-500/10",
    border: "border-violet-500/10 dark:border-violet-500/20",
    text: "text-violet-700 dark:text-violet-400",
    icon: "text-violet-500/60 dark:text-violet-400/60",
  },
  rose: {
    bg: "bg-rose-500/5 dark:bg-rose-500/10",
    border: "border-rose-500/10 dark:border-rose-500/20",
    text: "text-rose-700 dark:text-rose-400",
    icon: "text-rose-500/60 dark:text-rose-400/60",
  },
};

export function getPackColorClasses(color: string): PackColorClasses {
  return PACK_COLORS[color] ?? DEFAULT_COLORS;
}
