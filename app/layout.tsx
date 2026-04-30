import type { Metadata } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: "BioPilot Fit Assessment + Business Case Builder",
  description:
    "A BioPilot assessment tool for identifying bioprocess gaps, estimating improvement potential, and building a practical ROI view.",
  openGraph: {
    title: "BioPilot Fit Assessment + Business Case Builder",
    description:
      "Identify bioprocess gaps, estimate improvement potential, and build a practical ROI view.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
