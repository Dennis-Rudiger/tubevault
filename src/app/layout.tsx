import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "./components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TubeVault - YouTube Video & Audio Downloader",
  description: "Download YouTube videos and audio files instantly with TubeVault. Fast, reliable, and beautiful interface for all your media needs.",
  keywords: ["youtube downloader", "video downloader", "audio downloader", "mp4", "mp3", "youtube to mp3", "youtube to mp4"],
  authors: [{ name: "TubeVault Team" }],
  creator: "TubeVault",
  publisher: "TubeVault",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://tubevault.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TubeVault - YouTube Video & Audio Downloader",
    description: "Download YouTube videos and audio files instantly with TubeVault. Fast, reliable, and beautiful interface for all your media needs.",
    url: "https://tubevault.vercel.app",
    siteName: "TubeVault",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TubeVault - YouTube Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TubeVault - YouTube Video & Audio Downloader",
    description: "Download YouTube videos and audio files instantly with TubeVault. Fast, reliable, and beautiful interface.",
    images: ["/og-image.jpg"],
    creator: "@tubevault",
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
  verification: {
    google: "your-google-verification-code",
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TubeVault" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
