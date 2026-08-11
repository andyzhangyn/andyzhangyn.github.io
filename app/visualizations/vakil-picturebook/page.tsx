import type { Metadata } from "next";

import { VisualizationProjectShell } from "../project-shell";
import { EmbeddedVakilPicturebook } from "./embedded-vakil";

export const metadata: Metadata = {
  title: "Vakil's Picturebook",
  description:
    "An interactive companion to Ravi Vakil's pictures of exact sequences, subquotients, filtrations, and spectral sequences.",
  alternates: {
    canonical: "/visualizations/vakil-picturebook/",
  },
  openGraph: {
    type: "website",
    url: "/visualizations/vakil-picturebook/",
    title: "Vakil's Picturebook | Yuanning Zhang",
    description:
      "Interactive pictures of exact sequences, subquotients, filtrations, and spectral sequences.",
  },
};

export default function VakilPicturebookPage() {
  return (
    <VisualizationProjectShell
      title="Vakil's Picturebook"
    >
      <EmbeddedVakilPicturebook />
    </VisualizationProjectShell>
  );
}
