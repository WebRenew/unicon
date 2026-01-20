import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://unicon.webrenew.com";

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
    "lucide",
    "phosphor",
    "huge icons",
    "svg icons",
    "react components",
    "shadcn",
    "tailwind icons",
    "icon bundle",
    "webrenew",
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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
    creator: "@webrenew",
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
    description: "Browse and install icons from Lucide, Phosphor, and Huge Icons. Like shadcn, but for icons.",
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "WebRenew",
      url: "https://webrenew.com",
    },
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
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
