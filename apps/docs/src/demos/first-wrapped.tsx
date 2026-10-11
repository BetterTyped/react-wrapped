import { useState } from "react";

import {
  bigNumberScene,
  calendarFromCounts,
  DEFAULT_WRAPPED_CONFIG,
  listScene,
  openingScene,
  type WrappedConfig,
  type WrappedSubject,
  WrappedView,
} from "@react-wrapped/kit";

// Who the video is about. The handle and the caption sit in the corner of every frame.
const subject: WrappedSubject = {
  handle: "ada",
  name: "Ada",
  avatarUrl: null,
  caption: "Orbit Wrapped",
  period: "Oct 2025 to Oct 2026",
};

// Your numbers. Here: a made-up count per day from 11 October 2025, quiet at weekends.
const counts = Array.from({ length: 365 }, (_unused, day) => (day % 7 < 2 ? 0 : (day * 5) % 9));
const total = counts.reduce((sum, count) => sum + count, 0);
const activeDays = counts.filter((count) => count > 0).length;
// The year as a grid of cells: a level from 0 to 4 per day, the weekday it starts on and the month names.
const calendar = calendarFromCounts(counts, new Date("2025-10-11"));

// A scene is a function: what it says, then the key and the label it goes by on the timeline.
const scenes = [
  openingScene(
    { title: "My year on Orbit.", period: "@ada, Oct 2025 to Oct 2026", calendar, variant: 0 },
    { key: "opening", label: "Opening" },
  ),
  bigNumberScene(
    {
      eyebrow: "In the last 12 months you made",
      value: total,
      title: ["contributions."],
      lede: `On **${activeDays}** active days out of ${counts.length}.`,
      calendar,
      counter: "climb",
      variant: 0,
    },
    { key: "total", label: "Total contributions" },
  ),
  listScene(
    {
      eyebrow: "Where it happened",
      title: ["Your top", "repositories."],
      items: [
        { name: "ada/orbit-cli", value: 742, unit: "commits", meta: "TypeScript", color: "#3178c6" },
        { name: "ada/telemetry", value: 355, unit: "commits", meta: "Go", color: "#00add8" },
        { name: "ada/dotfiles", value: 203, unit: "commits", meta: "Shell", color: "#89e051" },
      ],
    },
    { key: "repositories", label: "Top repositories" },
  ),
];

export function FirstWrapped() {
  // Everything a viewer can change (palette, format, speed, hidden scenes, edited texts) is this one object.
  const [config, setConfig] = useState<WrappedConfig>(DEFAULT_WRAPPED_CONFIG);
  return (
    <WrappedView
      subject={subject}
      // The seed picks the transitions and the small variations. The same seed always plays the same video.
      seed="ada:2026"
      scenes={scenes}
      config={config}
      onConfigChange={setConfig}
    />
  );
}
