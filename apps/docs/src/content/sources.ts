/*
 * The source files a page shows as they are: the demos and the examples. A page's code block is the very file its
 * preview runs, read here as text at build time, so the two cannot drift apart. Asking for a file that is not there
 * throws, which stops the build before a page can show an empty block.
 */
const FILES = import.meta.glob<string>(
  // The demos' wiring and their test are the site's own business: nobody is shown those.
  ["../demos/*.{ts,tsx}", "../examples/*.tsx", "!../demos/index.tsx", "!../demos/*.test.ts"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);

export function sourceOf(file: `demos/${string}` | `examples/${string}`): string {
  const source = FILES[`../${file}`];
  if (source === undefined) throw new Error(`No source file "${file}" to show.`);
  return source;
}
