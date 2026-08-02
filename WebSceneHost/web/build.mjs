import { build } from "esbuild";
import { cp, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: false,
  sourcemap: false,
  target: "es2020",
  format: "iife",
  outfile: "dist/main.js"
});
await cp("src/main.css", "dist/main.css");
await cp("src/index.html", "dist/index.html");
