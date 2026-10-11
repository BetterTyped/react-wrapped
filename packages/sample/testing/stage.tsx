import { render } from "@testing-library/react";

import {
  createRng,
  type SceneContext,
  type SceneInstance,
  WRAPPED_FORMATS,
  type WrappedFormat,
} from "@react-wrapped/kit";

export const FORMATS = Object.keys(WRAPPED_FORMATS) as WrappedFormat[];

/** jsdom draws nothing, so an SVG shape has no box to take its transform origin from. Charts need one to animate. */
export function giveSvgABox() {
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 100, height: 100 }),
  });
}

/** Puts a scene on a stage the way the player does, and hands back its root. */
export function mountScene(scene: SceneInstance): HTMLElement {
  const { container } = render(<div className="wr-stage">{scene.content}</div>);
  const root = container.querySelector<HTMLElement>(".wr-scene");
  if (!root) throw new Error(`${scene.key} did not render.`);
  return root;
}

/** Builds a scene's animation for a format and plays it to its last frame, the way an export does. */
export function playScene(scene: SceneInstance, format: WrappedFormat): number {
  const root = mountScene(scene);
  const context: SceneContext = { root, format, rng: createRng(`${scene.key}:${format}`) };
  const timeline = scene.animate(context);
  timeline.progress(1);
  const seconds = timeline.duration();
  timeline.kill();
  return seconds;
}
