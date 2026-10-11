import { coverCut, defineTransition, HANDOVER } from "@react-wrapped/core";

/**
 * A cover: three layers fall from the top like a curtain, the old scene leaves behind them, and they fall on out of
 * the bottom of the frame. The stage colours the three `<i />` with the palette's levels two, three and four.
 */
export const curtain = defineTransition({
  id: "curtain",
  label: "Curtain",
  cover: (
    <>
      <i />
      <i />
      <i />
    </>
  ),
  play: (tl, { root, group }) => {
    // A stage that mounted before this transition was defined has no cover for it. Fade, so the scene still leaves.
    if (!group) {
      tl.to(root, { autoAlpha: 0, duration: 0.4 });
      return;
    }
    coverCut(
      tl,
      { root, group },
      // Where a layer waits, where it covers the frame, and where it ends up once the frame is clear again.
      { hidden: { yPercent: -101 }, covering: { yPercent: 0 }, cleared: { yPercent: 101 }, duration: 0.55 },
    );
  },
});

/** A move: nothing is drawn over the frame. The old scene itself tips over and slides out to the left. */
export const tilt = defineTransition({
  id: "tilt",
  label: "Tilt",
  play: (tl, { root }) => {
    tl.to(root, { autoAlpha: 0, xPercent: -30, rotate: -6, duration: 0.5, ease: "power3.in" });
    // The next scene starts here, as the last of this one leaves, so two headlines never share the frame.
    tl.addLabel(HANDOVER, "-=0.07");
  },
});
