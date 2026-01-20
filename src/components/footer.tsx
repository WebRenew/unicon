import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} <Link href="https://webrenew.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">WebRenew</Link>
            <span className="mx-2 text-muted-foreground/40">•</span>
            <Link href="https://github.com/WebRenew/unicon" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Open Source
            </Link>
          </div>

          {/* Legal Links */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
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

          {/* Contact */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="mailto:contact@webrenew.io"
              className="hover:text-foreground transition-colors"
            >
              contact@webrenew.io
            </a>
            <span className="text-muted-foreground/40">•</span>
            <a
              href="https://twitter.com/WebRenew_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              @WebRenew_
            </a>
          </div>
        </div>

        {/* Brand Disclaimer */}
        <div className="mt-4 text-center text-xs text-muted-foreground/70">
          Brand logos are trademarks of their respective owners. Use does not indicate endorsement.
        </div>
      </div>
    </footer>
  );
}
