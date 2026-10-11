/*
 * Slots: the named parts of the chrome. Every element of the player, the timeline, the settings, the scan, the
 * gallery and the editor that someone might want to restyle carries `data-wr-slot="<name>"`, and takes a class for
 * that name: from the component's own `classNames`, or from `WrappedProvider` for everything under it. Each
 * component exports the names it has (`WrappedPlayerSlot`, `TimelineSlot`, ...).
 */

/**
 * Classes by slot name. A class given here is added after the library's own classes on that element, so it has the
 * last word wherever the two say something about the same thing.
 */
export type SlotClassNames<Slot extends string = string> = Partial<Record<Slot, string>>;
