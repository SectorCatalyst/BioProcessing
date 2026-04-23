import type { Metadata } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

export const metadata: Metadata = {
  title: "BioPilot Fit Assessment + Business Case Builder",
  description:
    "A BioPilot assessment tool for identifying bioprocess gaps, estimating improvement potential, and building a practical ROI view.",
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
