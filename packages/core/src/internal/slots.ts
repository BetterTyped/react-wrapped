import type { ClassValue } from "clsx";
import { useContext } from "react";

import type { SlotClassNames } from "../slots";
import { cn } from "./cn";
import { SlotClassNamesContext } from "./slot-context";

/** What a slot puts on its element: the name to target it by, and its classes. */
export interface SlotProps {
  "data-wr-slot": string;
  /** Undefined when there is nothing to say, so an element with no class does not grow an empty attribute. */
  className: string | undefined;
}

/** Names an element of a component and joins its classes: the library's own, then the provider's, then the prop's. */
export type Slots<Slot extends string> = (slot: Slot, ...classes: ClassValue[]) => SlotProps;

/**
 * How a chrome component names its parts. `own` is the component's `classNames` prop; it may hold slots of the
 * components it renders too, which are simply not read here.
 *
 *   const slot = useSlots<WrappedPlayerSlot>(classNames);
 *   <button {...slot("player-play", control, "wr:bg-foreground")} />
 */
export function useSlots<Slot extends string>(own?: SlotClassNames<Slot>): Slots<Slot> {
  const provided = useContext(SlotClassNamesContext);
  return (slot, ...classes) => ({
    "data-wr-slot": slot,
    className: cn(...classes, provided[slot], own?.[slot]) || undefined,
  });
}
