import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./app/globals.css";
import { LanguageProvider } from "./app/components/LanguageProvider";
import SlopeSpectralSequencePage from "./app/slope-spectral-sequence/page";
import { enableEmbeddedResize } from "./embedded-resize";

const root = document.getElementById("root");

if (!root) {
  throw new Error("The slope spectral sequence root element is missing.");
}

createRoot(root).render(
  <LanguageProvider>
    <SlopeSpectralSequencePage />
  </LanguageProvider>,
);

enableEmbeddedResize();
