import type { Metadata } from "next";
import "./quick-theme.css";

export const metadata: Metadata = {
  title: "BioPilot Quick ROI | Find your bioprocess bottleneck",
  description: "Get a quick, anonymous estimate of the opportunity in batch review, failed runs or technology transfer. Explore the full BioPilot business case when you are ready.",
  openGraph: { title: "BioPilot Quick ROI", description: "Three inputs. A useful first estimate. No contact details needed.", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-background text-foreground antialiased">{children}</body></html>;
}
