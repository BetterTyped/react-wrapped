# Launch video

A 45 second launch film for react-wrapped, made with [HyperFrames](https://hyperframes.heygen.com) (HTML rendered to
video). It ends on the install line and points people at adding a Wrapped to their own product.

Nothing in it is a mockup of the library. HyperFrames renders by seeking paused GSAP timelines frame by frame, which is
how the library already works, so the film mounts the real thing: the charts are `Chart` with their own entrances, the
year grid is `Calendar`, and the playing videos are `WrappedStage` running the sample year's scenes and the library's
own transitions. They are built from `packages/*/src` into `film/lib/wrapped.js`, which puts `window.RW` on the page.

## Commands

From the repository root:

```bash
pnpm video:bundle    # build the library into film/lib (run after changing packages/ or bundle/)
pnpm video:preview   # open the HyperFrames Studio preview
pnpm video:render    # render film/renders/react-wrapped-launch.mp4
```

HyperFrames needs Node 22+ and FFmpeg (`brew install ffmpeg`).

## Layout

| Path                    | Holds                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| `bundle/`               | The entry that exposes the library to the film (`RW.mountChart`, `mountStage`) |
| `bundle.config.ts`      | The Vite build of that entry, GSAP left out so the film's own GSAP is shared   |
| `film/index.html`       | The root composition: seven scenes and the sound cues                          |
| `film/compositions/`    | One file per scene                                                             |
| `film/assets/sfx/`      | Sound effects bundled with HyperFrames                                         |
| `SPEC.md`, `STORYLINES.md`, `REVIEW.md` | The brief, the storylines not built, and the review notes      |

## Scenes

| Time        | Scene    | What happens                                                                         |
| ----------- | -------- | ------------------------------------------------------------------------------------ |
| 0.0–3.2     | `hook`   | "Your users had a whole year." over the sample year's contribution grid               |
| 3.1–11.4    | `table`  | The same months as a dull report, then the ground floods and they stand up as `bars` |
| 11.3–18.8   | `code`   | `chartScene({ chart: { type } })`: the type rolls, the chart on the right follows     |
| 18.7–24.2   | `wall`   | All 21 charts entering at once, the camera pulling back                              |
| 24.1–31.1   | `engine` | A real `WrappedStage`: big number, week, biggest day, slash and wave cuts            |
| 31.0–37.2   | `share`  | Five users, five palettes, each video ending on its share card                       |
| 37.1–45.1   | `finale` | "Give every user their year.", then the mark, the install line and the link          |
