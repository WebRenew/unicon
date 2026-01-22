"use client";

import { useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";

const MCP_CONFIG = {
  command: "npx",
  args: ["-y", "@webrenew/unicon-mcp-server"],
};

const CURSOR_INSTALL_URL = `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent("unicon")}&config=${encodeURIComponent(JSON.stringify(MCP_CONFIG))}`;

const CLAUDE_CODE_COMMAND =
  "npx @anthropic-ai/claude-code mcp add unicon -- npx -y @webrenew/unicon-mcp-server";

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClaudeDesktopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="3"
        width="20"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 21h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 17L10 11L4 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </svg>
  );
}

export function MCPInstallButtons() {
  const [showClaudeCodeCommand, setShowClaudeCodeCommand] = useState(false);

  return (
    <div className="space-y-6">
      {/* Quick Install Section */}
      <div className="p-6 rounded-xl border border-[var(--accent-lavender)]/30 bg-gradient-to-br from-[var(--accent-lavender)]/5 to-transparent">
        <h3 className="text-lg font-semibold mb-2">Quick Install</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add Unicon to your AI assistant with one click or command.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Cursor Button */}
          <a
            href={CURSOR_INSTALL_URL}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-[var(--accent-aqua)]/50 transition-all group"
          >
            <div className="p-2 rounded-lg bg-[var(--accent-aqua)]/10 group-hover:bg-[var(--accent-aqua)]/20 transition-colors">
              <CursorIcon className="w-5 h-5 text-[var(--accent-aqua)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Cursor</div>
              <div className="text-xs text-muted-foreground">One-click</div>
            </div>
            <ExternalLinkIcon className="w-4 h-4 text-muted-foreground group-hover:text-[var(--accent-aqua)] transition-colors" />
          </a>

          {/* Claude Code Button */}
          <button
            onClick={() => setShowClaudeCodeCommand(!showClaudeCodeCommand)}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-[var(--accent-lavender)]/50 transition-all group text-left"
          >
            <div className="p-2 rounded-lg bg-[var(--accent-lavender)]/10 group-hover:bg-[var(--accent-lavender)]/20 transition-colors">
              <TerminalIcon className="w-5 h-5 text-[var(--accent-lavender)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Claude Code</div>
              <div className="text-xs text-muted-foreground">CLI command</div>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-muted-foreground group-hover:text-[var(--accent-lavender)] transition-all ${
                showClaudeCodeCommand ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Claude Desktop Button */}
          <a
            href="#claude-desktop"
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-[var(--accent-mint)]/50 transition-all group"
          >
            <div className="p-2 rounded-lg bg-[var(--accent-mint)]/10 group-hover:bg-[var(--accent-mint)]/20 transition-colors">
              <ClaudeDesktopIcon className="w-5 h-5 text-[var(--accent-mint)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Claude Desktop</div>
              <div className="text-xs text-muted-foreground">Config file</div>
            </div>
            <ArrowDownIcon className="w-4 h-4 text-muted-foreground group-hover:text-[var(--accent-mint)] transition-colors" />
          </a>
        </div>

        {/* Claude Code Command (Expandable) */}
        {showClaudeCodeCommand && (
          <div className="mt-4 p-4 rounded-lg border border-border bg-muted/40">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono text-muted-foreground">
                Run in terminal:
              </span>
              <CopyButton value={CLAUDE_CODE_COMMAND} />
            </div>
            <pre className="text-sm font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all">
              {CLAUDE_CODE_COMMAND}
            </pre>
          </div>
        )}
      </div>

      {/* Manual Setup Links */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-muted-foreground">Manual setup:</span>
        <a
          href="#cursor"
          className="text-muted-foreground hover:text-[var(--accent-aqua)] transition-colors flex items-center gap-1.5"
        >
          <CursorIcon className="w-4 h-4" />
          Cursor
        </a>
        <a
          href="#claude-code"
          className="text-muted-foreground hover:text-[var(--accent-lavender)] transition-colors flex items-center gap-1.5"
        >
          <TerminalIcon className="w-4 h-4" />
          Claude Code
        </a>
        <a
          href="#claude-desktop"
          className="text-muted-foreground hover:text-[var(--accent-mint)] transition-colors flex items-center gap-1.5"
        >
          <ClaudeDesktopIcon className="w-4 h-4" />
          Claude Desktop
        </a>
      </div>
    </div>
  );
}
