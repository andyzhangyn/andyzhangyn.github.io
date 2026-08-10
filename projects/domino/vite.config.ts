import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = fileURLToPath(
  new URL("../../public/visualizations/domino/", import.meta.url),
);

export default defineConfig({
  root: projectRoot,
  base: "./",
  publicDir: fileURLToPath(new URL("./public/", import.meta.url)),
  plugins: [react()],
  build: {
    outDir: outputDirectory,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        domino: fileURLToPath(new URL("./index.html", import.meta.url)),
        slopeSpectralSequence: fileURLToPath(
          new URL("./slope-spectral-sequence/index.html", import.meta.url),
        ),
      },
    },
  },
});
