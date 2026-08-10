import { cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sourceDirectory = fileURLToPath(new URL("./web/", import.meta.url));
const outputDirectory = fileURLToPath(
  new URL("../../public/visualizations/projects/domino-cyclic-matrix/", import.meta.url),
);

rmSync(outputDirectory, { force: true, recursive: true });
mkdirSync(outputDirectory, { recursive: true });
cpSync(sourceDirectory, outputDirectory, { recursive: true });
