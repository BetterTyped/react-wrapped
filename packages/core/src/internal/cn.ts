import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** The chrome's utility classes all carry the library's prefix (see chrome.css). */
const merge = extendTailwindMerge({ prefix: "wr" });

/** Joins class names, a later utility winning over an earlier one it contradicts. */
export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
