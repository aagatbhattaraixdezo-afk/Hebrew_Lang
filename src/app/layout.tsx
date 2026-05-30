import React from "react";
import type { Metadata, Viewport } from "next";
import { Rubik, Heebo, Mukta } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-rubik",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700"],
  variable: "--font-heebo",
  display: "swap",
});

const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "700"],
  variable: "--font-mukta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#3d6b65",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Shalom — Hebrew Learning Platform",
  description:
    "Shalom helps Nepali workers learn Hebrew through structured lessons, spaced-repetition flashcards, and AI conversation practice.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We keep the old variable definitions as well for backwards compatibility
  const fontVars = `${rubik.variable} ${heebo.variable} ${mukta.variable} --font-display:var(--font-rubik) --font-he:var(--font-heebo) --font-ne:var(--font-mukta)`;
  
  return (
    <html lang="en" className={`${rubik.variable} ${heebo.variable} ${mukta.variable}`} suppressHydrationWarning>
      <body className={`${rubik.className} min-h-screen antialiased`} suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
