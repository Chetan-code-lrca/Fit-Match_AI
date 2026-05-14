import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitMatch AI",
    template: "%s | FitMatch AI",
  },
  description: "AI-powered wardrobe management, outfit analysis, and stylist recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-black font-sans text-white selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
