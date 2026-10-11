import { wholeFile } from "../content/source";
import type { Block, CodeLanguage } from "../content/types";

/** The day the wording of the hand-written pages last changed. Bump it when a page's text does. */
export const UPDATED = "2026-10-11";

/** A demo's own source file as a code block: the code a page shows is the code its preview runs. */
export const fileBlock = (source: string, file: string, language: CodeLanguage = "tsx"): Block => ({
  kind: "code",
  language,
  code: wholeFile(source),
  file,
});

export const code = (language: CodeLanguage, lines: readonly string[], file?: string): Block => ({
  kind: "code",
  language,
  code: lines.join("\n"),
  file,
});
