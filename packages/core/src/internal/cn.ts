import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names. Temporary: it still merges Tailwind utilities, because the player, the editor and the
 * scanner carry the classes they were written with. It goes away with those classes, when the chrome moves to
 * the library's own stylesheet.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
