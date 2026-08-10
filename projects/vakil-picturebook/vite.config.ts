import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = fileURLToPath(
  new URL(
    "../../public/visualizations/projects/vakil-picturebook/",
    import.meta.url,
  ),
);

export default defineConfig({
  root: projectRoot,
  base: "./",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: outputDirectory,
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./index.html", import.meta.url)),
    },
  },
});
