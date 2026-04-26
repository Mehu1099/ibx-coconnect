import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
// import FPSCounter from "@/components/dev/FPSCounter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IBX Co-Connect",
  description: "Community-driven planning for the Interborough Express",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Preload the axonometric on every page entry so the browser
            has it cached before the user ever triggers a transition.
            fetchPriority="high" bumps it above deferred resources. */}
        <link
          rel="preload"
          as="image"
          href="/explore/axonometric-base.jpg"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* <FPSCounter /> */}
      </body>
    </html>
  );
}
