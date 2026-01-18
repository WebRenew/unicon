"use client";

import Lenis from "lenis";
import {
  // Navigation
  Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownLeft,
  Home, LayoutDashboard, Compass, Map, Navigation,
  // Actions
  Search, Plus, Minus, Edit, Pencil, Trash, Trash2, Copy, Download, Upload, 
  Share, Share2, Send, Save, Undo, Redo, RefreshCw, RotateCcw,
  // UI Feedback
  Check, CheckCircle, XCircle, Info, AlertCircle, AlertTriangle, HelpCircle,
  // Settings & Config
  Settings, Sliders, Filter, SlidersHorizontal,
  // User & Auth
  User, Users, UserPlus, UserMinus, UserCheck, LogIn, LogOut, Lock, Unlock, Key, Shield,
  // Media
  Play, Pause, Square, SkipBack, SkipForward, Volume, Volume1, Volume2, VolumeX,
  ImageIcon, Camera, Video, Music, Mic, MicOff,
  // Communication
  Mail, MessageCircle, MessageSquare, Phone, PhoneCall, Bell, BellOff, AtSign,
  // Files & Folders
  File, FileText, FilePlus, Folder, FolderOpen, FolderPlus, Archive, Paperclip,
  // Social & Engagement
  Heart, Star, ThumbsUp, ThumbsDown, Bookmark, Flag,
  // View & Display
  Eye, EyeOff, Maximize, Minimize, Expand, Shrink, ZoomIn, ZoomOut,
  Grid, List, LayoutGrid, Columns, Rows,
  // Links & External
  Link, Link2, ExternalLink, Globe, Wifi, WifiOff,
  // Time & Date
  Calendar, Clock, Timer, Hourglass,
  // Data & Charts
  BarChart, BarChart2, LineChart, PieChart, TrendingUp, TrendingDown, Activity,
  // Misc Utilities
  MoreHorizontal, MoreVertical, Grip, Move,
  Loader, Loader2, Circle, Triangle,
  // Code & Dev
  Code, Terminal, Database, Server, Cloud, CloudUpload, CloudDownload,
  Cpu, HardDrive, Monitor, Smartphone,
  // Commerce
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Tag, Package,
  // Document Actions
  Printer, ClipboardCopy, ClipboardCheck, ClipboardList,
  // Arrows & Direction
  MoveUp, MoveDown, MoveLeft, MoveRight, ChevronsUp, ChevronsDown,
  // Brand
  Github,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy as CopyIcon, Check as CheckIcon } from "lucide-react";

type IconStyle = "metal" | "brutal" | "glow" | "random";

const ICON_STYLES: Record<Exclude<IconStyle, "random">, { container: string; icon: string; css: string }> = {
  metal: {
    container: "rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.5)] border-t border-[#999]/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),inset_-8px_-8px_16px_rgba(255,255,255,0.2),inset_8px_8px_16px_rgba(0,0,0,0.5),0_6px_16px_rgba(0,0,0,0.6)]",
    icon: "text-white/80",
    css: `/* Metal Icon Style */
.metal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(to bottom, #555 0%, #222 8%, #111 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.5);
  border-top: 1px solid rgba(153,153,153,0.4);
}
.metal-icon:hover {
  transform: scale(1.1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.5), inset -8px -8px 16px rgba(255,255,255,0.2), inset 8px 8px 16px rgba(0,0,0,0.5), 0 6px 16px rgba(0,0,0,0.6);
}
/* Tailwind: rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.5)] border-t border-[#999]/40 */
/* Icon: w-6 h-6 text-white/80 */`,
  },
  brutal: {
    container: "rounded-none bg-white border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:translate-x-[-4px] hover:translate-y-[-4px]",
    icon: "text-black",
    css: `/* Brutal Icon Style */
.brutal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 0;
  background: white; border: 4px solid black;
  box-shadow: 4px 4px 0 0 #000;
}
.brutal-icon:hover {
  transform: translate(-4px, -4px);
  box-shadow: 8px 8px 0 0 #000;
}
/* Tailwind: rounded-none bg-white border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:translate-x-[-4px] hover:translate-y-[-4px] */
/* Icon: w-6 h-6 text-black */`,
  },
  glow: {
    container: "rounded-2xl bg-[linear-gradient(135deg,rgba(15,15,20,0.95)_0%,rgba(10,10,15,0.98)_100%)] border border-[rgba(168,85,247,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:shadow-[0_4px_32px_rgba(236,72,153,0.15),0_8px_48px_rgba(168,85,247,0.1),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(200,120,200,0.2)]",
    icon: "text-[rgba(180,150,200,0.7)] hover:text-[rgba(200,160,220,0.9)]",
    css: `/* Glow Icon Style - Premium Agency */
.glow-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 16px;
  background: linear-gradient(135deg, rgba(15,15,20,0.95) 0%, rgba(10,10,15,0.98) 100%);
  border: 1px solid rgba(168,85,247,0.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  transition: all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.glow-icon:hover {
  transform: scale(1.1);
  border-color: rgba(200,120,200,0.2);
  box-shadow: 
    0 4px 32px rgba(236,72,153,0.15),
    0 8px 48px rgba(168,85,247,0.1),
    inset 0 1px 0 rgba(255,255,255,0.04);
}
/* Tailwind: rounded-2xl bg-[linear-gradient(135deg,rgba(15,15,20,0.95)_0%,rgba(10,10,15,0.98)_100%)] border border-[rgba(168,85,247,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] */
/* Hover: hover:shadow-[0_4px_32px_rgba(236,72,153,0.15),0_8px_48px_rgba(168,85,247,0.1),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(200,120,200,0.2)] */
/* Icon: w-6 h-6 text-[rgba(180,150,200,0.7)] */`,
  },
};

// Random style generator - varies bg, foreground, stroke, border-radius
const RANDOM_BG_COLORS = [
  "#1a1a2e", "#16213e", "#0f0f23", "#1e1e1e", "#2d132c", "#1a1a1a", 
  "#f8f9fa", "#e9ecef", "#fff8e7", "#f0e6d3", "#e8f4f8", "#f5f0ff"
];

const RANDOM_FG_COLORS = [
  "#ffffff", "#e0e0e0", "#a0a0a0", "#ff6b6b", "#4ecdc4", "#a55eea",
  "#1a1a1a", "#333333", "#2d3436", "#6c5ce7", "#00b894", "#fdcb6e"
];

const RANDOM_BORDER_RADII = ["rounded-none", "rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-full"];

const RANDOM_STROKES = [1, 1.5, 2, 2.5, 3];

const BORDER_RADIUS_VALUES: Record<string, string> = {
  "rounded-none": "0",
  "rounded-sm": "2px",
  "rounded-md": "6px",
  "rounded-lg": "8px",
  "rounded-xl": "12px",
  "rounded-2xl": "16px",
  "rounded-full": "9999px",
};

function generateRandomStyle(seed: number): { container: string; icon: string; css: string; strokeWidth: number; inlineStyles: React.CSSProperties; iconColor: string } {
  // Use seed to deterministically pick values
  const bgColor = RANDOM_BG_COLORS[seed % RANDOM_BG_COLORS.length];
  const fgColor = RANDOM_FG_COLORS[(seed * 3) % RANDOM_FG_COLORS.length];
  const borderRadiusClass = RANDOM_BORDER_RADII[(seed * 7) % RANDOM_BORDER_RADII.length];
  const strokeWidth = RANDOM_STROKES[(seed * 11) % RANDOM_STROKES.length];
  
  // Determine if bg is light or dark for border color
  const isLightBg = bgColor.startsWith("#f") || bgColor.startsWith("#e");
  const borderColor = isLightBg ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";
  
  const borderRadiusValue = BORDER_RADIUS_VALUES[borderRadiusClass];
  
  // Use inline styles for dynamic values
  const inlineStyles: React.CSSProperties = {
    backgroundColor: bgColor,
    borderRadius: borderRadiusValue,
    border: `1px solid ${borderColor}`,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  };
  
  const css = `/* Ephemeral Random Style */
:root {
  --icon-bg: ${bgColor};
  --icon-fg: ${fgColor};
  --icon-stroke: ${strokeWidth};
  --icon-radius: ${borderRadiusValue};
}

.random-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--icon-bg);
  border: 1px solid ${borderColor};
  border-radius: var(--icon-radius);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transition: all 300ms ease;
}

.random-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

.random-icon svg {
  color: var(--icon-fg);
  stroke-width: var(--icon-stroke);
}

/* CSS Values */
/* background: ${bgColor}; border-radius: ${borderRadiusValue}; color: ${fgColor}; stroke-width: ${strokeWidth}; */`;
  
  return { container: "", icon: "", css, strokeWidth, inlineStyles, iconColor: fgColor };
}

// Curated list of most commonly used icons
const POPULAR_ICONS: [string, LucideIcon][] = [
  // Navigation
  ["Menu", Menu], ["X", X], ["ChevronDown", ChevronDown], ["ChevronUp", ChevronUp],
  ["ChevronLeft", ChevronLeft], ["ChevronRight", ChevronRight],
  ["ArrowLeft", ArrowLeft], ["ArrowRight", ArrowRight], ["ArrowUp", ArrowUp], ["ArrowDown", ArrowDown],
  ["ArrowUpRight", ArrowUpRight], ["ArrowDownLeft", ArrowDownLeft],
  ["Home", Home], ["LayoutDashboard", LayoutDashboard], ["Compass", Compass], ["Map", Map], ["Navigation", Navigation],
  // Actions
  ["Search", Search], ["Plus", Plus], ["Minus", Minus], ["Edit", Edit], ["Pencil", Pencil],
  ["Trash", Trash], ["Trash2", Trash2], ["Copy", Copy], ["Download", Download], ["Upload", Upload],
  ["Share", Share], ["Share2", Share2], ["Send", Send], ["Save", Save],
  ["Undo", Undo], ["Redo", Redo], ["RefreshCw", RefreshCw], ["RotateCcw", RotateCcw],
  // UI Feedback
  ["Check", Check], ["CheckCircle", CheckCircle], ["XCircle", XCircle],
  ["Info", Info], ["AlertCircle", AlertCircle], ["AlertTriangle", AlertTriangle], ["HelpCircle", HelpCircle],
  // Settings & Config
  ["Settings", Settings], ["Sliders", Sliders], ["Filter", Filter], ["SlidersHorizontal", SlidersHorizontal],
  // User & Auth
  ["User", User], ["Users", Users], ["UserPlus", UserPlus], ["UserMinus", UserMinus], ["UserCheck", UserCheck],
  ["LogIn", LogIn], ["LogOut", LogOut], ["Lock", Lock], ["Unlock", Unlock], ["Key", Key], ["Shield", Shield],
  // Media
  ["Play", Play], ["Pause", Pause], ["Square", Square], ["SkipBack", SkipBack], ["SkipForward", SkipForward],
  ["Volume", Volume], ["Volume1", Volume1], ["Volume2", Volume2], ["VolumeX", VolumeX],
  ["ImageIcon", ImageIcon], ["Camera", Camera], ["Video", Video], ["Music", Music], ["Mic", Mic], ["MicOff", MicOff],
  // Communication
  ["Mail", Mail], ["MessageCircle", MessageCircle], ["MessageSquare", MessageSquare],
  ["Phone", Phone], ["PhoneCall", PhoneCall], ["Bell", Bell], ["BellOff", BellOff], ["AtSign", AtSign],
  // Files & Folders
  ["File", File], ["FileText", FileText], ["FilePlus", FilePlus],
  ["Folder", Folder], ["FolderOpen", FolderOpen], ["FolderPlus", FolderPlus],
  ["Archive", Archive], ["Paperclip", Paperclip],
  // Social & Engagement
  ["Heart", Heart], ["Star", Star], ["ThumbsUp", ThumbsUp], ["ThumbsDown", ThumbsDown],
  ["Bookmark", Bookmark], ["Flag", Flag],
  // View & Display
  ["Eye", Eye], ["EyeOff", EyeOff], ["Maximize", Maximize], ["Minimize", Minimize],
  ["Expand", Expand], ["Shrink", Shrink], ["ZoomIn", ZoomIn], ["ZoomOut", ZoomOut],
  ["Grid", Grid], ["List", List], ["LayoutGrid", LayoutGrid], ["Columns", Columns], ["Rows", Rows],
  // Links & External
  ["Link", Link], ["Link2", Link2], ["ExternalLink", ExternalLink],
  ["Globe", Globe], ["Wifi", Wifi], ["WifiOff", WifiOff],
  // Time & Date
  ["Calendar", Calendar], ["Clock", Clock], ["Timer", Timer], ["Hourglass", Hourglass],
  // Data & Charts
  ["BarChart", BarChart], ["BarChart2", BarChart2], ["LineChart", LineChart], ["PieChart", PieChart],
  ["TrendingUp", TrendingUp], ["TrendingDown", TrendingDown], ["Activity", Activity],
  // Misc Utilities
  ["MoreHorizontal", MoreHorizontal], ["MoreVertical", MoreVertical],
  ["Grip", Grip], ["Move", Move],
  ["Loader", Loader], ["Loader2", Loader2], ["Circle", Circle], ["Triangle", Triangle],
  // Code & Dev
  ["Code", Code], ["Terminal", Terminal], ["Database", Database], ["Server", Server],
  ["Cloud", Cloud], ["CloudUpload", CloudUpload], ["CloudDownload", CloudDownload],
  ["Cpu", Cpu], ["HardDrive", HardDrive], ["Monitor", Monitor], ["Smartphone", Smartphone],
  // Commerce
  ["ShoppingCart", ShoppingCart], ["ShoppingBag", ShoppingBag], ["CreditCard", CreditCard],
  ["DollarSign", DollarSign], ["Tag", Tag], ["Package", Package],
  // Document Actions
  ["Printer", Printer], ["ClipboardCopy", ClipboardCopy], ["ClipboardCheck", ClipboardCheck], ["ClipboardList", ClipboardList],
  // Arrows & Direction
  ["MoveUp", MoveUp], ["MoveDown", MoveDown], ["MoveLeft", MoveLeft], ["MoveRight", MoveRight],
  ["ChevronsUp", ChevronsUp], ["ChevronsDown", ChevronsDown],
];

type RandomStyleType = { container: string; icon: string; css: string; strokeWidth: number; inlineStyles: React.CSSProperties; iconColor: string };

function StyledIcon({ name, IconComponent, style, randomStyles }: { name: string; IconComponent: LucideIcon; style: IconStyle; randomStyles: RandomStyleType | null }) {
  const [copied, setCopied] = useState(false);
  
  const isRandom = style === "random" && randomStyles;

  const handleCopyName = async () => {
    await navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyImport = async () => {
    await navigator.clipboard.writeText(`import { ${name} } from "lucide-react";`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyJsx = async () => {
    await navigator.clipboard.writeText(`<${name} />`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // For random, use inline styles; otherwise use Tailwind classes
  if (isRandom) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="flex items-center justify-center w-12 h-12 shrink-0 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-110 active:scale-95"
            style={randomStyles.inlineStyles}
          >
            <IconComponent className="w-6 h-6" style={{ color: randomStyles.iconColor }} strokeWidth={randomStyles.strokeWidth} />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel className="font-mono">{name}</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleCopyName}>
            {copied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
            Copy name
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyImport}>
            {copied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
            Copy import statement
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyJsx}>
            {copied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
            Copy JSX
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  const styles = ICON_STYLES[style as Exclude<IconStyle, "random">];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`flex items-center justify-center w-12 h-12 shrink-0 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-110 active:scale-95 ${styles.container}`}
        >
          <IconComponent className={`w-6 h-6 ${styles.icon}`} strokeWidth={2} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="font-mono">{name}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyName}>
          {copied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
          Copy name
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyImport}>
          {copied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
          Copy import statement
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyJsx}>
          {copied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
          Copy JSX
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const ICON_STYLE_TOKENS = `/* Metallic Icon Container */
.metallic-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(to bottom, #555 0%, #222 8%, #111 100%);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(153, 153, 153, 0.4);
  transition: all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.metallic-icon:hover {
  transform: scale(1.1);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5),
    inset -8px -8px 16px rgba(255, 255, 255, 0.2),
    inset 8px 8px 16px rgba(0, 0, 0, 0.5),
    0 6px 16px rgba(0, 0, 0, 0.6);
}

/* Tailwind Classes */
/* Container: flex items-center justify-center w-12 h-12 rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.5)] border-t border-[#999]/40 */
/* Hover: hover:scale-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),inset_-8px_-8px_16px_rgba(255,255,255,0.2),inset_8px_8px_16px_rgba(0,0,0,0.5),0_6px_16px_rgba(0,0,0,0.6)] */
/* Transition: transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] */
/* Icon: w-6 h-6 text-white/80 */`;

export default function MetallicIconGrid() {
  const [styleCopied, setStyleCopied] = useState(false);
  const [activeStyle, setActiveStyle] = useState<IconStyle>("metal");
  const [styleKey, setStyleKey] = useState(0);
  const [currentRandomStyle, setCurrentRandomStyle] = useState<RandomStyleType | null>(null);

  const handleCopyStyle = async () => {
    let cssToClipboard: string;
    if (activeStyle === "random" && currentRandomStyle) {
      cssToClipboard = `/* Ephemeral Random Style - Copy now or it's gone! */\n${currentRandomStyle.css}`;
    } else if (activeStyle !== "random") {
      cssToClipboard = ICON_STYLES[activeStyle].css;
    } else {
      return;
    }
    await navigator.clipboard.writeText(cssToClipboard);
    setStyleCopied(true);
    setTimeout(() => setStyleCopied(false), 2000);
  };

  const handleStyleChange = (value: string) => {
    setActiveStyle(value as IconStyle);
    setStyleKey(prev => prev + 1);
    if (value === "random") {
      const newStyle = generateRandomStyle(Date.now() % 1000);
      setCurrentRandomStyle(newStyle);
    }
  };

  const regenerateRandom = () => {
    const newStyle = generateRandomStyle(Date.now() % 1000);
    setCurrentRandomStyle(newStyle);
    setStyleKey(prev => prev + 1);
  };

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,3%)] p-4 lg:px-40 lg:pt-20 lg:pb-40">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦄</span>
          <span className="font-tiny5 text-white/60 text-xs tracking-widest uppercase">UNICON</span>
        </div>
        <a 
          href="https://github.com/WebRenew/unicon" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>
      </header>
      <h1 className="font-mono font-thin text-3xl md:text-4xl lg:text-5xl text-white mb-4 text-balance tracking-tighter leading-tight">
        Just the icons you need. Zero bloat.
      </h1>
      <p className="text-white/50 text-sm md:text-base max-w-xl mb-6">
        Pick icons from popular libraries, preview styles, copy the code. Like shadcn, but for icons.
      </p>
      <div className="relative mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search icons..."
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-colors"
        />
      </div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <Tabs value={activeStyle} onValueChange={handleStyleChange}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger 
              value="metal" 
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 font-mono"
            >
              Metal
            </TabsTrigger>
            <TabsTrigger 
              value="brutal" 
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 font-mono"
            >
              Brutal
            </TabsTrigger>
            <TabsTrigger 
              value="glow" 
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 font-mono"
            >
              Glow
            </TabsTrigger>
            <TabsTrigger 
              value="random" 
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 font-mono"
            >
              Random
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {activeStyle === "random" && (
            <button
              onClick={regenerateRandom}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent hover:bg-white/5 text-white/60 hover:text-white/80 text-sm font-mono transition-colors duration-200 border border-white/20 hover:border-white/30"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          )}
          <button
            onClick={handleCopyStyle}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent hover:bg-white/5 text-white/60 hover:text-white/80 text-sm font-mono transition-colors duration-200 border border-white/20 hover:border-white/30"
          >
            {styleCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
            {styleCopied ? "Copied!" : "Copy Style"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 justify-start">
        {POPULAR_ICONS.map(([name, IconComponent]) => (
          <StyledIcon 
            key={`${name}-${styleKey}`} 
            name={name} 
            IconComponent={IconComponent} 
            style={activeStyle} 
            randomStyles={currentRandomStyle} 
          />
        ))}
      </div>
    </div>
  );
}
