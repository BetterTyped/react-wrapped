import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import type { AtRule, Plugin as PostcssPlugin } from "postcss";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

/**
 * Two things a compiled stylesheet must not do to the page it is loaded on.
 *
 * It must not sit in cascade layers: rules in a layer lose to any rule outside one, so a host with a plain
 * `button { ... }` in its stylesheet would beat every class on the library's buttons. Out of the layer a class beats
 * an element selector the way it always has.
 *
 * And it must not define animations under common names: `@keyframes pulse` here would replace a host's own `pulse`.
 * Every animation gets the library's prefix, in its definition and wherever it is used.
 */
const selfContained = (): PostcssPlugin => ({
  postcssPlugin: "react-wrapped-self-contained",
  Once: (root) => {
    root.walkAtRules("layer", (rule: AtRule) => {
      // `@layer a, b;` only names an order; with nothing layered there is nothing to order.
      if (!rule.nodes) rule.remove();
      else rule.replaceWith(rule.nodes);
    });
    const renamed = new Map<string, string>();
    root.walkAtRules("keyframes", (rule: AtRule) => {
      if (rule.params.startsWith("wr-")) return;
      renamed.set(rule.params, `wr-${rule.params}`);
      rule.replaceWith(rule.clone({ params: `wr-${rule.params}` }));
    });
    if (renamed.size === 0) return;
    const names = new RegExp(`(?<![\\w-])(${[...renamed.keys()].join("|")})(?![\\w-])`, "g");
    root.walkDecls(/^(animation|animation-name|--wr-animate-.*)$/, (declaration) => {
      declaration.replaceWith(
        declaration.clone({ value: declaration.value.replace(names, (name) => renamed.get(name) ?? name) }),
      );
    });
  },
});

/**
 * How every package of the library is built and tested: one ES module per entry with its types, one stylesheet,
 * and nothing bundled that the package did not write.
 */
export function libConfig({
  dir,
  entries = { index: "src/index.ts" },
}: {
  /** The package's own directory: `__dirname` of its vite.config.ts. */
  dir: string;
  /** Entry points by the name they are built under. */
  entries?: Record<string, string>;
}) {
  return defineConfig({
    root: dir,
    cacheDir: path.join(dir, "../../node_modules/.vite", path.basename(path.dirname(dir)), path.basename(dir)),
    // Tailwind is a build tool here and nothing more: it compiles the chrome's utility classes into the stylesheet
    // the package ships (see packages/core/src/chrome-theme.css).
    css: { postcss: { plugins: [selfContained()] } },
    plugins: [tailwindcss(), react(), dts({ entryRoot: "src", tsconfigPath: path.join(dir, "tsconfig.lib.json") })],
    build: {
      outDir: "./dist",
      emptyOutDir: true,
      lib: { entry: entries, formats: ["es" as const], cssFileName: "styles" },
      rolldownOptions: {
        // A library bundles nothing it did not write: every package it imports stays an import, so there is one
        // React and one GSAP on the page and the consumer's bundler decides what ships.
        external: (id) => !id.startsWith(".") && !path.isAbsolute(id),
      },
    },
    test: {
      watch: false,
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      setupFiles: [path.join(dir, "../../tools/test-setup.ts")],
      passWithNoTests: true,
      reporters: ["default"],
    },
  });
}
