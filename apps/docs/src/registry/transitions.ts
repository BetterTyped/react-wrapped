import { TRANSITION_LABELS, WRAPPED_TRANSITIONS } from "@react-wrapped/kit";

/*
 * What the docs say about each transition. Keyed by the library's own list, so a transition added there without a
 * line here stops the build.
 */

export type TransitionId = (typeof WRAPPED_TRANSITIONS)[number];

interface TransitionDoc {
  /** A cover takes the whole frame and clears onto the next scene; a move takes the old scene out itself. */
  kind: "cover" | "move";
  /** A few words after the name in the browser title. */
  tagline: string;
  /** What happens on screen, in one or two sentences. */
  says: string;
}

export const TRANSITION_DOCS: Record<TransitionId, TransitionDoc> = {
  layers: {
    kind: "cover",
    tagline: "flat bands rising up the frame",
    says: "Three flat bands in the palette's colours rise through the frame one after another. The old scene leaves behind them and they clear upward onto the next one.",
  },
  slash: {
    kind: "cover",
    tagline: "slanted bands across the frame",
    says: "Three slanted bands cross the frame from one side. Their trailing edge is a stripe of the palette's colours, never one hard line.",
  },
  arrow: {
    kind: "cover",
    tagline: "a pointed band across the frame",
    says: "The same crossing as Slash, led by a point. It reads as a direction, so it suits a scene that moves the story forward.",
  },
  wave: {
    kind: "cover",
    tagline: "water coming up from below",
    says: "Three swells come up from the bottom out of step with each other, drifting sideways as they climb, and drain away over the next scene.",
  },
  drip: {
    kind: "cover",
    tagline: "paint running down from the top",
    says: "Paint runs down from the top in round-ended fingers of uneven length. Each layer drips differently, and the same way on every replay.",
  },
  bloom: {
    kind: "cover",
    tagline: "discs growing out of a corner",
    says: "Discs grow out of one corner until they fill the frame, then leave into the opposite corner.",
  },
  pulse: {
    kind: "cover",
    tagline: "rings out of the middle",
    says: "Rings spread from the centre until the frame is covered, then the middle opens onto the next scene.",
  },
  blink: {
    kind: "cover",
    tagline: "an eye shutting and opening",
    says: "Two lids close over the frame like an eye and open again on the next scene.",
  },
  spin: {
    kind: "cover",
    tagline: "a clock hand going once round",
    says: "A hand sweeps once round the centre like a clock, covering the frame as it goes, and round again to clear it.",
  },
  fan: {
    kind: "cover",
    tagline: "a wiper hinged at the bottom",
    says: "The same sweeping hand, hinged at the bottom edge like a windscreen wiper.",
  },
  doors: {
    kind: "cover",
    tagline: "two doors shutting on the scene",
    says: "Two doors slide shut from the sides, meet in the middle, and open on the next scene.",
  },
  brush: {
    kind: "cover",
    tagline: "one wide brush stroke",
    says: "A wide brush paints the frame over in one stroke, back and forth from top to bottom. The paint then leaves from where the stroke began.",
  },
  scan: {
    kind: "cover",
    tagline: "a beam crossing the frame",
    says: "A beam of light crosses the frame and leaves it blank, then doubles back and uncovers the next scene. It is the year scan's own beam.",
  },
  flash: {
    kind: "cover",
    tagline: "light swelling from the middle",
    says: "Light swells out of the centre until it is all there is, then thins out over the next scene.",
  },
  iris: {
    kind: "move",
    tagline: "the scene closing to a point",
    says: "The old scene closes into a circle and vanishes into its centre, and the next scene comes in behind it.",
  },
  wipe: {
    kind: "move",
    tagline: "the scene wiped away upward",
    says: "The old scene is wiped away from the bottom edge up. The next scene comes in as the last of it leaves, never on top of it.",
  },
  lift: {
    kind: "move",
    tagline: "the scene rising out of frame",
    says: "The old scene lifts up and fades. It is all but gone before the next one starts, so two headlines never overlap.",
  },
  drop: {
    kind: "move",
    tagline: "the scene falling out of frame",
    says: "The old scene drops down and out of the frame, the quiet opposite of Lift.",
  },
  zoom: {
    kind: "move",
    tagline: "the scene rushing at the camera",
    says: "The old scene grows toward the viewer until it has passed the camera, and the next one is already there.",
  },
};

export const TRANSITIONS = WRAPPED_TRANSITIONS.map((id) => ({
  id,
  name: TRANSITION_LABELS[id],
  ...TRANSITION_DOCS[id],
}));
