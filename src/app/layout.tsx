import type { Metadata, Viewport } from "next";
import {
  Atkinson_Hyperlegible_Next,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
} from "next/font/google";

import { Providers } from "@/components/providers";
import { siteConfig } from "@/config/site";

import "./globals.css";

// Names must match the custom properties consumed by @theme in globals.css.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: "variable",
  adjustFontFallback: false,
});

const ibmPlex = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: "variable",
});

const readabilityInitScript = `
  try {
    const saved = JSON.parse(localStorage.getItem("pdc:readability") || "{}");
    const font = ["geist", "atkinson", "plex"].includes(saved.font) ? saved.font : "atkinson";
    const size = ["standard", "comfortable", "large"].includes(saved.size) ? saved.size : "comfortable";
    document.documentElement.dataset.readingFont = font;
    document.documentElement.dataset.textSize = size;
  } catch (_) {
    document.documentElement.dataset.readingFont = "atkinson";
    document.documentElement.dataset.textSize = "comfortable";
  }
`;

/**
 * Open Graph and Twitter images are supplied by the `opengraph-image` file
 * convention in this directory, so they are not listed here.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.seo.title,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.brand }],
  creator: siteConfig.brand,
  publisher: siteConfig.brand,
  category: "food and drink tools",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "Dough Lab",
    statusBarStyle: "black-translucent",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes writes the theme class onto <html> before paint, which the
    // server cannot know about. suppressHydrationWarning scopes React's
    // complaint to this one element rather than silencing anything real.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${atkinson.variable} ${ibmPlex.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: readabilityInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
