import type { Metadata } from "next";
import "./quick-theme.css";

export const metadata: Metadata = {
  title: "BioPilot Quick ROI | Bioprocess value calculator",
  description: "Estimate potential annual value from improved batch review, reduced run losses and technology transfer.",
  openGraph: { title: "BioPilot Quick ROI", description: "Estimate potential value from recovered team time and reduced run losses.", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-background text-foreground antialiased">{children}</body></html>;
}
