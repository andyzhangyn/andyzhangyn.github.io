import type { Metadata } from "next";

import { EmbeddedDomino } from "../embedded-domino";
import { VisualizationProjectShell } from "../project-shell";

export const metadata: Metadata = {
  title: "What is a domino?",
  description:
    "An interactive visualization of the degree 0 and degree 1 basis lattices of the Raynaud ring.",
  alternates: {
    canonical: "/visualizations/what-is-a-domino/",
  },
  openGraph: {
    type: "website",
    url: "/visualizations/what-is-a-domino/",
    title: "What is a domino? | Yuanning Zhang",
    description:
      "An interactive visualization of the Raynaud ring and dominoes in de Rham–Witt theory.",
  },
};

export default function DominoVisualizationPage() {
  return (
    <VisualizationProjectShell title="What is a domino?">
      <EmbeddedDomino />
    </VisualizationProjectShell>
  );
}
