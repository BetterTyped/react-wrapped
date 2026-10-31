import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import type { Plugin as PostcssPlugin } from "postcss";
import { defineConfig, type Plugin } from "vite";

/*
 * Builds the library, from its sources, into one script and one stylesheet the film loads: `film/lib/wrapped.js`
 * puts `window.RW` on the page (see bundle/entry.tsx). GSAP stays out of the bundle and comes from the film's own
 * script tag, so every timeline is made by the GSAP that HyperFrames seeks.
 */
const packages = path.resolve(__dirname, "../packages");

/**
 * A render must be the same on every frame and every run. Nothing the film draws reads `Math.random` (the scenes take
 * the seeded `rng`), but React and a default argument or two still mention it, so it is swapped for a seeded source.
 */
const seededRandom = (): Plugin => ({
  name: "launch-video-seeded-random",
  renderChunk: (code) => ({
    code:
      "var __rwSeed=0x9e3779b9;function __rwRandom(){__rwSeed|=0;__rwSeed=(__rwSeed+0x6d2b79f5)|0;" +
      "var t=Math.imul(__rwSeed^(__rwSeed>>>15),1|__rwSeed);t=(t+Math.imul(t^(t>>>7),61|t))^t;" +
      "return((t^(t>>>14))>>>0)/4294967296;}\n" +
      code
        .replaceAll("Math.random", "__rwRandom")
        // HyperFrames' bundler reads selectors in scripts and cannot parse one built by a template literal, so a
        // selector with a value in it is spelled as plain string concatenation instead.
        .replaceAll(/querySelector(All)?\(`([^`]*\$\{[^`]*)`\)/g, (_match, all = "", body: string) => {
          const joined = body
            .split(/\$\{([^}]*)\}/)
            .map((part, index) => (index % 2 ? `+(${part})+` : `'${part.replaceAll("'", "\\'")}'`))
            .join("");
          return `querySelector${all}(${joined})`;
        }),
    map: null,
  }),
});

/**
 * The stylesheet carries the player's chrome too, whose hovers ease in on CSS transitions. The film never shows the
 * chrome, and a transition runs on the browser's clock, which a frame-by-frame render cannot seek.
 */
const noTransitions = (): PostcssPlugin => ({
  postcssPlugin: "launch-video-no-transitions",
  Declaration: (declaration) => {
    if (declaration.prop.startsWith("transition")) declaration.remove();
  },
});

export default defineConfig({
  root: __dirname,
  cacheDir: path.resolve(__dirname, "../node_modules/.vite/launch-video"),
  plugins: [tailwindcss(), react(), seededRandom()],
  css: { postcss: { plugins: [noTransitions()] } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  resolve: {
    alias: [
      { find: /^gsap$/, replacement: path.resolve(__dirname, "bundle/gsap.ts") },
      { find: /^@react-wrapped\/core\/internal$/, replacement: path.join(packages, "core/src/internal/index.ts") },
      { find: /^@react-wrapped\/([a-z]+)$/, replacement: path.join(packages, "$1/src/index.ts") },
    ],
  },
  build: {
    outDir: "film/lib",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "bundle/entry.tsx"),
      formats: ["iife"],
      name: "RW",
      fileName: () => "wrapped.js",
      cssFileName: "wrapped",
    },
  },
});
