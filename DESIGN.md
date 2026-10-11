# Design notes

One page for anyone about to change something here. It covers how the packages fit together and the handful of rules the
code depends on. For where the code came from and how changes are carried across from the original, see
[UPSTREAM.md](./UPSTREAM.md).

## Packages

Eight packages live in `packages/`, plus `sample` (a made-up year used by the docs and the tests, never published).

| Package    | Holds                                                             | May import                   |
| ---------- | ----------------------------------------------------------------- | ---------------------------- |
| `core`     | The stage, the motion kit, palettes, formats, transitions, config | nothing from this repository |
| `charts`   | 21 charts and their entrances                                     | `core`                       |
| `scenes`   | 11 ready-made scenes and the pixel art set                        | `core`, `charts`             |
| `player`   | The player, the timeline, the scene editor, the settings panel    | `core`                       |
| `scan`     | The year scan that finds hidden scenes                            | `core`                       |
| `graphics` | The share card, insight cards, the gallery                        | `core`, `charts`             |
| `marks`    | The marks for the stage's bottom right corner. Data only          | `core`, for its types        |
| `kit`      | Everything re-exported, plus `WrappedView`                        | all of the above             |

```
core <- charts <- scenes
core <- player
core <- scan
core + charts <- graphics
core <- marks (data only)
kit re-exports all of them
```

The arrows only point one way. `core` never imports a sibling, and nothing but `kit` (and `sample`) imports `kit`. If
`player` needs something from `scenes`, the thing either moves down into `core` or is passed in as a prop. There is no
public hoisting in `pnpm-workspace.yaml`, on purpose: an import a package did not declare fails here first, before it
fails in someone's app.

## One version for everything

All eight packages are released together under one version number. `nx.json` puts them in one fixed release group, the
next version is worked out from the conventional commits since the last `v*` tag, and one tag covers the whole set. Two
packages with the same version always fit each other, and nobody has to read a compatibility table.

What that asks of a change:

- Write conventional commits (`feat:`, `fix:`, `chore:`). They decide the version bump.
- Never bump one package by hand. CI runs `node .github/scripts/packages.mjs check` and fails when the published
  packages disagree on their version, or when a published package depends on a private one.
- Depend on a sibling with `workspace:*`. It is rewritten to the exact shared version when the package is packed.

## Everything animates on a GSAP timeline

The video is not a recording. A scene's `animate` returns a GSAP timeline, the player strings those into one, and that
one timeline can be moved to any time. Scrubbing, the scene editor's previews and the frame by frame export all work by
seeking it. So the rule is strict: **if it moves, it is a tween on the timeline the scene returns.**

- Nothing a scene, a chart or a transition draws may move by CSS transition or keyframes, `setTimeout` or a
  `requestAnimationFrame` loop. None of those can be seeked, so they would be wrong in the exported file. The chrome
  around the video (the scan, the loading stage, the page) is not exported and may use CSS.
- A scene brings itself in and holds. It never takes itself out: the player owns the way out, which is how every scene
  works with all 19 transitions.
- Randomness comes from the seeded `rng` the scene is handed, never `Math.random`. The same link has to play the same
  video twice.
- Query inside the scene's `root`, never the document. Several stages can be on one page (the designs page has dozens).
- Use the motion kit (`linesIn`, `riseIn`, `countUp`, `hold`) before writing a new tween. It is why scenes from
  different packages feel like one piece.

## Palettes are CSS variables

A palette is plain data: the surfaces, five levels and four rarity colours. The stage sets it as custom properties on
its own element and every component reads those, never the page's theme. That is what makes a video look the same on any
site, and it is how a palette change repaints everything without a re-render.

| Variable                                                  | Meaning                                                 |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `--wr-bg`, `--wr-card`                                    | The stage and the surfaces on it                        |
| `--wr-fg`, `--wr-muted`                                   | Text at full strength and supporting text               |
| `--wr-l0` to `--wr-l4`                                    | The five levels, empty to full. `--wr-l4` is the accent |
| `--wr-common`, `--wr-rare`, `--wr-epic`, `--wr-legendary` | What each rarity wears                                  |

Never write a colour into a component. If a new surface needs one, it is a mix of these (`color-mix`) or a new entry in
the palette data, for every palette, in both dark and light.

## Styles: two kinds of classes, one prefix

Everything the library ships is named so it cannot collide with the page it is loaded on: classes start with `wr`,
custom properties with `--wr-`, animations with `wr-`.

- **The stage** (scenes, charts, transitions, cards) is hand-written CSS: `wr-stage`, `wr-title`, `wr-chart`. It lives
  in `packages/core/src/wrapped.css`.
- **The chrome** (player controls, timeline, settings, scan, gallery, editor) is written with utility classes that carry
  the prefix `wr:`, like `wr:flex wr:rounded-full`. Tailwind compiles them once at build time into the stylesheet each
  package ships. It is a build tool here and nothing more: nobody who installs the library needs Tailwind, and the
  page's own Tailwind, if it has one, never sees these classes.

Three things keep the shipped CSS a good guest (`tools/vite-lib.ts`, `packages/core/src/reset.css`):

1. **No cascade layers.** The compiled utilities are taken out of `@layer`, because a layered rule loses to any
   unlayered rule of the host, such as a plain `button { ... }`.
2. **A reset that weighs nothing.** Inside a root of ours (`.wr-root`, or a stage) boxes, buttons and headings are reset
   with selectors wrapped in `:where()`. Outside those roots nothing is touched.
3. **Colours are variables.** The stage reads the video's palette (`--wr-bg`, `--wr-l4`, ...). The chrome reads
   `--wr-ui-*` tokens, set on `:root` with no weight, so a host recolours it by setting them anywhere above.

One limit to know: a host rule that targets elements inside a container, like `.prose h2 { margin-top: 2em }`, is more
specific than a single class and will reach the library's headings. Render a Wrapped outside such containers.

When code comes in from the app this library was cut from, its utility classes have no prefix yet:
`node scripts/prefix-classes.mjs packages/<name>/src --write` adds it (see `UPSTREAM.md`).

## The docs are generated from registries

`apps/docs/src/registry` is the source of the docs site. `charts.ts` and `transitions.ts` are keyed by the library's own
lists, and `pages.ts` builds every page from them. The sidebar, the routes, the sitemap, the Markdown twin of each page
and `llms.txt` all read that one list.

So a new chart or transition gets its page by adding one entry to its registry, and leaving the entry out stops the
build instead of shipping a page with a hole in it. Do not hand-write a page for something a registry already describes.

## Before you open a pull request

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

CI runs the same four on every pull request. A green run on `main` then triggers the release and the docs deploy
(`.github/workflows`).
