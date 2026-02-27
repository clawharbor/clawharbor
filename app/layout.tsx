import type { Metadata } from "next";

// All pages are dynamic — this is a real-time dashboard
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "clawharbor | Virtual Office for OpenClaw Agents",
  description: "Observation-driven debugging for AI agents. Your OpenClaw agents as pixel art NPCs — see who's working, click to inspect live tool calls, catch conflicts visually.",
  metadataBase: new URL("https://clawharbor.work"),
  openGraph: {
    title: "clawharbor — Your AI Agents, Pixel Art Style 🏢",
    description: "Turn your AI agents into pixel art NPCs in a retro virtual office. Zero config, one command install.",
    url: "https://clawharbor.work",
    siteName: "clawharbor",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "clawharbor — Pixel art office dashboard for AI agents",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "clawharbor — Your AI Agents, Pixel Art Style 🏢",
    description: "Turn your AI agents into pixel art NPCs in a retro virtual office. Zero config, one command install.",
    images: ["/og-image.png"],
  },
  keywords: ["openclaw", "ai agents", "virtual office", "pixel art", "dashboard", "agent management", "retro", "rpg"],
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  other: {
    'theme-color': '#6366f1',
  },
};

// JSON-LD structured data for rich Google results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'clawharbor',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Linux',
  description: 'Turn your AI agents into pixel art NPCs in a retro virtual office. Real-time monitoring, quest system, water cooler chat, and XP progression.',
  url: 'https://clawharbor.work',
  screenshot: 'https://clawharbor.work/og-image.png',
  softwareVersion: '0.1.0',
  author: {
    '@type': 'Organization',
    name: 'clawharbor',
    url: 'https://github.com/clawharbor',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
