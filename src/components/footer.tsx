import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-white dark:bg-background/95 dark:backdrop-blur dark:supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 lg:px-20 xl:px-40 py-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © <span suppressHydrationWarning>{currentYear}</span> <Link href="https://webrenew.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">WebRenew</Link>
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
            <a
              href="https://www.webrenew.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://www.webrenew.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
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
