"use client";

import Link from "next/link";
import { Home, Search, Terminal, ArrowLeft } from "lucide-react";
import { Tiny5 } from "next/font/google";

const tiny5 = Tiny5({
  weight: "400",
  subsets: ["latin"],
});

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[hsl(0,0%,3%)] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Pixelated 404 */}
        <div className={`${tiny5.className} mb-8`}>
          <h1 
            className="text-[120px] md:text-[180px] leading-none tracking-wider"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(139, 92, 246, 0.3)",
            }}
          >
            404
          </h1>
        </div>

        {/* Error message */}
        <div className="mb-8 space-y-2">
          <h2 className={`${tiny5.className} text-2xl md:text-3xl text-white mb-3`}>
            PAGE NOT FOUND
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-md mx-auto">
            Looks like this icon wandered off the grid. 
            <br className="hidden md:block" />
            Let&apos;s get you back on track.
          </p>
        </div>

        {/* Pixel art decoration */}
        <div className="mb-10 flex justify-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-purple-500 animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-pink-500 animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-lg mx-auto">
          <Link
            href="/"
            className="group relative p-4 md:p-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all duration-200"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                <Home className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className={`${tiny5.className} text-white text-sm mb-0.5`}>
                  HOME
                </div>
                <div className="text-white/50 text-xs">Browse icons</div>
              </div>
            </div>
          </Link>

          <Link
            href="/?q=search"
            className="group relative p-4 md:p-5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-200"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Search className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className={`${tiny5.className} text-white text-sm mb-0.5`}>
                  SEARCH
                </div>
                <div className="text-white/50 text-xs">Find icons</div>
              </div>
            </div>
          </Link>

          <Link
            href="/cli"
            className="group relative p-4 md:p-5 rounded-xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 transition-all duration-200"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                <Terminal className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <div className={`${tiny5.className} text-white text-sm mb-0.5`}>
                  CLI DOCS
                </div>
                <div className="text-white/50 text-xs">Command line</div>
              </div>
            </div>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group relative p-4 md:p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <div className={`${tiny5.className} text-white text-sm mb-0.5`}>
                  GO BACK
                </div>
                <div className="text-white/50 text-xs">Previous page</div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <div className="mt-10 text-white/30 text-xs">
          <p className={tiny5.className}>
            ERROR CODE: ICON_NOT_FOUND
          </p>
        </div>
      </div>
    </div>
  );
}
