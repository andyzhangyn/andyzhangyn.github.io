import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./app/globals.css";
import { LanguageProvider } from "./app/components/LanguageProvider";
import DominoPage from "./app/page";
import { enableEmbeddedResize } from "./embedded-resize";

const root = document.getElementById("root");

if (!root) {
  throw new Error("The Domino visualization root element is missing.");
}

createRoot(root).render(
  <LanguageProvider>
    <DominoPage />
  </LanguageProvider>,
);

enableEmbeddedResize();
