import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-white dark:bg-background/95 dark:backdrop-blur dark:supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 lg:px-20 xl:px-40 py-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} <Link href="https://webrenew.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">WebRenew</Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/cli"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              CLI
            </Link>
            <Link
              href="/privacy.txt"
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms.txt"
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/disclaimer.txt"
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Disclaimer
            </Link>
            <Link
              href="/license.txt"
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              License
            </Link>
          </nav>

          {/* Social */}
          <div className="text-sm text-muted-foreground">
            <a
              href="https://twitter.com/WebRenew_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              X/Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
