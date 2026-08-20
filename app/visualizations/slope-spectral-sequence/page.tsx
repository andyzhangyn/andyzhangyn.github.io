import type { Metadata } from "next";

import { EmbeddedSlopeSpectralSequence } from "../embedded-slope-spectral-sequence";
import { VisualizationProjectShell } from "../project-shell";

export const metadata: Metadata = {
  title: "Slope Spectral Sequence",
  description:
    "An interactive slope spectral sequence with examples from abelian varieties, K3 surfaces, and Enriques surfaces.",
  alternates: {
    canonical: "/visualizations/slope-spectral-sequence/",
  },
  openGraph: {
    type: "website",
    url: "/visualizations/slope-spectral-sequence/",
    title: "Slope Spectral Sequence | Yuanning Zhang",
    description:
      "Explore Newton polygons, slope-zero terms, torsion, and dominoes in the slope spectral sequence.",
  },
};

export default function SlopeSpectralSequenceVisualizationPage() {
  return (
    <VisualizationProjectShell title="Slope Spectral Sequence">
      <EmbeddedSlopeSpectralSequence />
    </VisualizationProjectShell>
  );
}
