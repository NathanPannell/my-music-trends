import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Playlist Timeline",
    template: "%s | Playlist Timeline"
  },
  description: "Visualize the journey of your Spotify playlists. Discover how tracks rise and fall, explore daily rankings, and relive your musical history.",
  openGraph: {
    title: "Playlist Timeline",
    description: "Visualize the journey of your Spotify playlists.",
    siteName: "Playlist Timeline",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Playlist Timeline",
    description: "Visualize the journey of your Spotify playlists.",
  },
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-black text-white`}
        suppressHydrationWarning
      >
        <main className="flex-1">
          {children}
          <Analytics />
        </main>
      </body>
    </html>
  );
}
