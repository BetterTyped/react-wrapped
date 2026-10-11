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

- The corner mark is path data the caller passes (`StageMark`). The ready-made marks live in a package of their own,
  `@react-wrapped/marks`, so nobody gets a logo they did not ask for.
- The line saying where a video is from is optional (`brand`), and off unless it is set.
- A scene's fit-to-frame factor is a CSS variable (`--wr-fit`), read by one rule in the stylesheet.
- The small UI pieces the engine borrowed from its host (switch, chips, dialog, pill buttons, class joiner, copy hook)
  are the library's own, in `src/internal/`.
- A video that cannot be made is reported inline or through `onError`, not through a toast library.

## Changes carried across since the snapshot

- 2026-10-11: the chart entrances (`chart-entrances.ts`, `charts.tsx`): each chart now plays in the order its
  picture reads, with labels landing as the line or bar reaches them.

- 2026-10-11: the scan comes first (`year-scan.tsx`, `wrapped-view.tsx`, `use-opened-drops.ts`): a creator who has
  opened nothing gets the scan as the page, and the video takes over once it has run. Also a second pass over the
  chart entrances.

## The chrome's classes carry a prefix here

In the app the player, the timeline, the scan and the gallery are styled with Tailwind utilities (`flex`, `bg-card`).
Here every one of them carries the library's prefix (`wr:flex`, `wr:bg-card`) and is compiled once into the stylesheet
the library ships, so nobody who installs it needs Tailwind. After carrying a change across, run the prefixer over
the files that came in:

```bash
node scripts/prefix-classes.mjs packages/core/src --write
```

It leaves prefixed classes and the library's own `wr-` classes alone, so it is safe to run again.

## The chrome's elements are slots here

In the app an element of the chrome has a plain `className`. Here every part somebody might restyle is a slot (see
`DESIGN.md`): `className={cn(control, "wr:bg-foreground")}` is written
`{...slot("player-play", control, "wr:bg-foreground")}`, which puts the same classes on the element plus its name. So a
diff against the app's file shows that rewrite on most elements of the player, the timeline, the settings, the scan, the
gallery and the editor, and nothing else about them.

When a change comes across, keep the slot and carry the classes into it. A new element that someone might want to
restyle gets a name in its component's list. The prefixer reads the classes inside `slot(...)` too and leaves the name
alone.

## Carrying a later change across

File names and the `wr-` class names are kept the same on purpose, so a change made on either side can be read as a diff
against the matching file here. The three biggest files (`charts.tsx`, `scenes.tsx`, `year-scan.tsx`) stay single files
for the same reason.
