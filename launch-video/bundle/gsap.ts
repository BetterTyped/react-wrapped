/*
 * The film loads GSAP once, as a plain script, and HyperFrames seeks the timelines made with it. The library's own
 * `import { gsap } from "gsap"` is pointed here, so its scenes and charts tween on that same GSAP and their timelines
 * can be nested inside the film's.
 */
const shared = (window as unknown as { gsap: typeof import("gsap").gsap }).gsap;

export { shared as gsap };
export default shared;
