import { WRAPPED_RARITY_LABELS, type WrappedRarity } from "@internal/enums";

export type Rarity = WrappedRarity;

/** The rarity as a word. Its color is the palette's (`palette.rarity`), so it follows the theme the viewer picked. */
export const RARITY_LABELS = WRAPPED_RARITY_LABELS;
