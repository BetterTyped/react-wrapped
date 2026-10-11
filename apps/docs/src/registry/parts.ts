/*
 * The interactive previews: whole components a reader can use, not looping stills. A page names one by its id, the
 * component that draws it lives in `demos/`, and the list is here on its own so the page registry (and its tests)
 * can check an id without loading a single component.
 */
export const PART_IDS = [
  "first-wrapped",
  "player-remote",
  "timeline-editing",
  "own-transport",
  "scene-editor",
  "settings",
  "loading",
  "video-export",
  "year-scan",
  "scan-first",
  "rarities",
  "share-card",
  "insight-card",
  "gallery",
  "marks",
  "own-colour",
  "own-chrome",
  "own-style",
  "config-url",
  "labels",
  "share-actions",
] as const;

export type PartId = (typeof PART_IDS)[number];

export const isPart = (id: string): id is PartId => (PART_IDS as readonly string[]).includes(id);
