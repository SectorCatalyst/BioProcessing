import type { Metadata } from "next";

import { BioPilotFitAssessmentApp } from "@/components/biopilot-fit-assessment-app";

export const metadata: Metadata = {
  title: "Internal BioPilot Assessment",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function InternalBioPilotAssessmentPage() {
  return <BioPilotFitAssessmentApp internalModeRequested />;
}
