import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitMatch AI — Wardrobe Intelligence",
    template: "%s | FitMatch AI",
  },
  description:
    "Build better outfits from the clothes you already own. FitMatch AI brings wardrobe organisation, explainable outfit matching and personal styling into one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full bg-[#10120f] font-sans text-[#f4f2e9] selection:bg-[#d3ee9c] selection:text-[#182011]">
        {children}
      </body>
    </html>
  );
}