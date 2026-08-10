import type { Metadata } from "next";

import { VisualizationProjectShell } from "../project-shell";
import { EmbeddedDominoForest } from "./embedded-domino-forest";

export const metadata: Metadata = {
  title: "Domino Forest",
  description:
    "An interactive weighted-forest visualization for supersingular cyclic Frobenius words.",
  alternates: {
    canonical: "/visualizations/domino-forest/",
  },
  openGraph: {
    type: "website",
    url: "/visualizations/domino-forest/",
    title: "Domino Forest | Yuanning Zhang",
    description:
      "Turn a cyclic Frobenius word into its weighted forest and numerical invariants.",
  },
};

export default function DominoForestPage() {
  return (
    <VisualizationProjectShell title="Domino Forest">
      <EmbeddedDominoForest />
    </VisualizationProjectShell>
  );
}
