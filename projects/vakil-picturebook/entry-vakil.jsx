import { createRoot } from "react-dom/client";

import App from "./vakil-subquotients.jsx";
import { enableEmbeddedResize } from "./embedded-resize.js";
import "./shell.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("The root element for Vakil's Picturebook is missing.");
}

createRoot(root).render(<App />);
enableEmbeddedResize();
