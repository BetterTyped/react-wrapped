/*
 * Prints a value the way someone would type it: a JavaScript literal with bare keys. The usage code on a chart's page
 * is printed from the very object its preview draws, so the two cannot disagree.
 */

/** Values that are written by name instead of spelled out: the very object, and what the code calls it. */
export type SourceNames = ReadonlyMap<unknown, string>;

const KEY = /^[A-Za-z_$][\w$]*$/;
/** Longer than this and a row of numbers is cut, with a note saying how many were left out. */
const LONG = 12;

function print(value: unknown, indent: string, names?: SourceNames): string {
  const inner = `${indent}  `;
  const named = names?.get(value);
  if (named) return named;
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every((item) => typeof item === "number")) {
      if (value.length <= LONG) return `[${value.join(", ")}]`;
      return `[\n${inner}${value.slice(0, LONG).join(", ")},\n${inner}// ...and ${value.length - LONG} more\n${indent}]`;
    }
    // A few short words stay on one line, the way a headline of two lines is typed: ["You ship on", "*Fridays.*"].
    if (value.every((item) => typeof item === "string")) {
      const flat = `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
      if (flat.length + indent.length <= 72) return flat;
    }
    // Rows of rows (a week by the hour) read best as a couple of rows and a count of the rest.
    const shown = value.every(Array.isArray) && value.length > 3 ? value.slice(0, 2) : value;
    const rows = shown.map((item) => `${inner}${print(item, inner, names)},`);
    const rest = value.length - shown.length;
    return `[\n${rows.join("\n")}\n${rest > 0 ? `${inner}// ...and ${rest} more rows\n` : ""}${indent}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return "{}";
    const parts = entries.map(([key, item]) => {
      const text = print(item, inner, names);
      // A value that goes by the same name as its key is written the short way: `calendar`, not `calendar: calendar`.
      return text === key ? key : `${KEY.test(key) ? key : JSON.stringify(key)}: ${text}`;
    });
    const flat = `{ ${parts.join(", ")} }`;
    return flat.length + indent.length <= 96 && !flat.includes("\n")
      ? flat
      : `{\n${parts.map((part) => `${inner}${part},`).join("\n")}\n${indent}}`;
  }
  return "undefined";
}

export const toSource = (value: unknown, indent = "", names?: SourceNames) => print(value, indent, names);

/** A whole source file as a page shows it: without the blank line it ends on. */
export const wholeFile = (source: string) => source.trimEnd();

/**
 * One top-level piece of a source file: from the line holding `start` to the next blank line. Pages show a demo's
 * own file piece by piece this way, so the code a step explains is the code that runs. A missing marker throws, which
 * stops the build before a page can show nothing.
 */
export function excerpt(source: string, start: string): string {
  const at = source.indexOf(start);
  if (at === -1) throw new Error(`No "${start}" in the source.`);
  const from = source.lastIndexOf("\n", at) + 1;
  const end = source.indexOf("\n\n", at);
  const lines = source
    .slice(from, end === -1 ? undefined : end)
    .trimEnd()
    .split("\n");
  // A piece from inside a function is shown from the left edge, like code someone would paste.
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length));
  return lines.map((line) => line.slice(indent)).join("\n");
}
