import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Tiny5 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const tiny5 = Tiny5({ weight: "400", subsets: ["latin"], variable: "--font-tiny5" });

export const metadata: Metadata = {
  title: 'Metallic Icons',
  description: 'Metallic icon showcase with different metal finishes',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${tiny5.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
