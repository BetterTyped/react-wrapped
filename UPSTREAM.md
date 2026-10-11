# Where this code came from

The engine in `packages/` started as a copy of the Wrapped engine in a private repository (the Hype Stack site).
The two are separate from here on: nothing is shared at build time, and changes are carried across by hand.

## Snapshot

- Date: 2026-10-11
- Source folder: `apps/frontend/src/features/wrapped/modules/wrapped-engine/` (38 files) and the palette and rarity
  data from `packages/enums/src/wrapped/index.ts`
- Base commit of the source repository: `ce8442f7b37b541abdcaafe6215c3ed9be963c86`
- The snapshot was taken from the working tree, so it also holds changes that were not committed there yet:
  fitting a scene to its frame in the square and wide formats, the token pixel art size in the square format,
  visible empty tiles on the calendar panel, graphics that draw once the scan unlocks them, and the shine on a
  legendary card.

## Carrying a later change across

File names and the `wr-` class names are kept the same on purpose, so a change made on either side can be read as
a diff against the matching file here. The three biggest files (`charts.tsx`, `scenes.tsx`, `year-scan.tsx`) stay
single files for the same reason.
