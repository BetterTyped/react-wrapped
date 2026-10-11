/*
 * Prints a value the way someone would type it: a JavaScript literal with bare keys. The usage code on a chart's page
 * is printed from the very object its preview draws, so the two cannot disagree.
 */

const KEY = /^[A-Za-z_$][\w$]*$/;
/** Longer than this and a row of numbers is cut, with a note saying how many were left out. */
const LONG = 12;

function print(value: unknown, indent: string): string {
  const inner = `${indent}  `;
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every((item) => typeof item === "number")) {
      if (value.length <= LONG) return `[${value.join(", ")}]`;
      return `[\n${inner}${value.slice(0, LONG).join(", ")},\n${inner}// ...and ${value.length - LONG} more\n${indent}]`;
    }
    // Rows of rows (a week by the hour) read best as a couple of rows and a count of the rest.
    const shown = value.every(Array.isArray) && value.length > 3 ? value.slice(0, 2) : value;
    const rows = shown.map((item) => `${inner}${print(item, inner)},`);
    const rest = value.length - shown.length;
    return `[\n${rows.join("\n")}\n${rest > 0 ? `${inner}// ...and ${rest} more rows\n` : ""}${indent}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return "{}";
    const parts = entries.map(([key, item]) => `${KEY.test(key) ? key : JSON.stringify(key)}: ${print(item, inner)}`);
    const flat = `{ ${parts.join(", ")} }`;
    return flat.length + indent.length <= 96 && !flat.includes("\n")
      ? flat
      : `{\n${parts.map((part) => `${inner}${part},`).join("\n")}\n${indent}}`;
  }
  return "undefined";
}

export const toSource = (value: unknown, indent = "") => print(value, indent);
