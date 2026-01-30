import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalFooter } from "@/components/conditional-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://unicon.sh";

export const metadata: Metadata = {
  title: {
    default: "Unicon by WebRenew — Icon Library for React",
    template: "%s | Unicon",
  },
  description:
    "Browse 10,000+ icons from Lucide, Phosphor, and Huge Icons. Copy React components, SVGs, or bundle multiple icons. Like shadcn, but for icons. Zero bloat.",
  keywords: [
    "icons",
    "react icons",
    "icon library",
    "open source icons",
    "free icon library",
    "lucide",
    "phosphor",
    "huge icons",
    "heroicons",
    "tabler icons",
    "feather icons",
    "remix icon",
    "simple icons",
    "brand logos",
    "svg icons",
    "react components",
    "vue icons",
    "svelte icons",
    "icon components",
    "shadcn",
    "tailwind icons",
    "icon bundle",
    "icon picker",
    "icon search",
    "ai icon search",
    "semantic icon search",
    "icon aggregator",
    "icon cli",
    "icon tool",
    "developer tools",
    "design system",
    "ui icons",
    "webrenew",
    "mit license",
    "open source",
    "github",
  ],
  authors: [{ name: "WebRenew", url: "https://webrenew.com" }],
  creator: "WebRenew",
  publisher: "WebRenew",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Unicon by WebRenew",
    title: "Unicon — Just the icons you need. Zero bloat.",
    description:
      "Browse 10,000+ icons from Lucide, Phosphor, and Huge Icons. Copy React components or SVGs. Bundle multiple icons for export.",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Unicon — Icon Library for React",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unicon — Just the icons you need. Zero bloat.",
    description:
      "Browse 10,000+ icons from Lucide, Phosphor, and Huge Icons. Like shadcn, but for icons.",
    images: ["/opengraph.png"],
    creator: "@WebRenew_",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Unicon",
    alternateName: "Unicon by WebRenew",
    description: "Browse and install icons from Lucide, Phosphor, and Huge Icons. Like shadcn, but for icons.",
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    softwareVersion: "1.0.0",
    license: "https://opensource.org/licenses/MIT",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "WebRenew",
      url: "https://webrenew.com",
      sameAs: [
        "https://twitter.com/WebRenew_",
        "https://github.com/WebRenew",
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "WebRenew",
      url: "https://webrenew.com",
    },
    codeRepository: "https://github.com/WebRenew/unicon",
    programmingLanguage: [
      {
        "@type": "ComputerLanguage",
        name: "TypeScript",
      },
      {
        "@type": "ComputerLanguage",
        name: "React",
      },
    ],
    keywords: "icon library, react icons, svg icons, open source, lucide, phosphor, huge icons, icon bundle, developer tools",
    installUrl: "https://www.npmjs.com/package/@webrenew/unicon",
    sameAs: [
      "https://github.com/WebRenew/unicon",
      "https://www.npmjs.com/package/@webrenew/unicon",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-lg focus:text-sm focus:font-medium dark:focus:bg-white dark:focus:text-black"
          >
            Skip to main content
          </a>
          <div className="flex-1">
            <main id="main-content">
              {children}
            </main>
          </div>
          <ConditionalFooter />
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
