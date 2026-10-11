# Where this code came from

The engine in `packages/` started as a copy of the Wrapped engine in a private repository (the Hype Stack site). The two
are separate from here on: nothing is shared at build time, and changes are carried across by hand.

## Snapshot

- Date: 2026-10-11
- Source folder: `apps/frontend/src/features/wrapped/modules/wrapped-engine/` (38 files) and the palette and rarity data
  from `packages/enums/src/wrapped/index.ts`
- Base commit of the source repository: `ce8442f7b37b541abdcaafe6215c3ed9be963c86`
- The snapshot was taken from the working tree, so it also holds changes that were not committed there yet: fitting a
  scene to its frame in the square and wide formats, the token pixel art size in the square format, visible empty tiles
  on the calendar panel, graphics that draw once the scan unlocks them, the shine on a legendary card, and a first
  version of saving the video as an MP4 in the browser (`export-video.ts`, `stage-frame.ts`), which was still being
  worked on there when the snapshot was taken.

## Where this copy already differs

- No brand logos ship. The corner mark is path data the caller passes (`StageMark`).
- The line saying where a video is from is optional (`brand`), and off unless it is set.
- A scene's fit-to-frame factor is a CSS variable (`--wr-fit`), read by one rule in the stylesheet.
- The small UI pieces the engine borrowed from its host (switch, chips, dialog, pill buttons, class joiner, copy hook)
  are the library's own, in `src/internal/`.
- A video that cannot be made is reported inline or through `onError`, not through a toast library.

## Carrying a later change across

File names and the `wr-` class names are kept the same on purpose, so a change made on either side can be read as a diff
against the matching file here. The three biggest files (`charts.tsx`, `scenes.tsx`, `year-scan.tsx`) stay single files
for the same reason.
