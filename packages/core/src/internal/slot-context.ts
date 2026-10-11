import { createContext } from "react";

import type { SlotClassNames } from "../slots";

/*
 * The provider's half of slots, kept apart from the hook that reads it (./slots.ts): the provider is part of the
 * package's main entry, and must not pull the class merger in with it for a page that only plays a video.
 */

/** The slot classes the providers above have set. Empty with no provider. */
export const SlotClassNamesContext = createContext<SlotClassNames>({});

/**
 * Slot classes with some of them replaced, the way labels merge: a slot the inner table names takes the inner class,
 * every other slot keeps what it had. With nothing to lay over, it hands back the same object.
 */
export function mergeSlotClassNames(base: SlotClassNames, over?: SlotClassNames): SlotClassNames {
  if (!over) return base;
  const merged = { ...base };
  for (const [slot, value] of Object.entries(over)) {
    // A slot set to undefined is a slot left out: it must not blank a class set further up.
    if (value !== undefined) merged[slot] = value;
  }
  return merged;
}
