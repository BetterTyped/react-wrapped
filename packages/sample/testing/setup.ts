// oxlint-disable-next-line import/no-unassigned-import -- registers the DOM matchers on expect
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { gsap } from "gsap";
import { afterEach } from "vitest";

// A scene animates parts it may not have (a fact scene with no pixel art, a card with no tokens), and GSAP warns
// about each one. Hundreds of those lines bury a real failure.
gsap.config({ nullTargetWarn: false });

afterEach(() => {
  cleanup();
});
