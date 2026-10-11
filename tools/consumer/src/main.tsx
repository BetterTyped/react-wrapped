// What a first user writes: a Wrapped from the all-in-one package, with a label replaced, a mark in the corner and
// a few parts restyled.
import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  bigNumberScene,
  chartScene,
  DEFAULT_WRAPPED_CONFIG,
  type SlotClassNames,
  WrappedProvider,
  type WrappedSlot,
  WrappedView,
} from "@react-wrapped/kit";
import { markOf } from "@react-wrapped/marks";
// oxlint-disable-next-line import/no-unassigned-import -- the library's stylesheet
import "@react-wrapped/kit/styles.css";

const scenes = [
  bigNumberScene(
    { eyebrow: "This year", value: 1687, title: ["commits."], lede: "**4.6** a day.", counter: "climb", variant: 0 },
    { key: "total", label: "Total" },
  ),
  chartScene(
    {
      eyebrow: "Your year",
      title: ["Then came", "*launch week.*"],
      lede: "The busiest stretch, lit.",
      chart: { type: "spark", values: [4, 9, 6, 14, 22, 31, 18, 12], band: { from: 4, to: 5, label: "Launch week" } },
    },
    { key: "launch", label: "Launch week" },
  ),
];

// A class per slot for the whole page, typed against every slot the library has.
const CLASS_NAMES: SlotClassNames<WrappedSlot> = { "player-play": "go-button", "settings-chip": "chip" };

function App() {
  const [config, setConfig] = useState(DEFAULT_WRAPPED_CONFIG);
  return (
    <WrappedProvider labels={{ player: { play: "Go" } }} classNames={CLASS_NAMES}>
      <WrappedView
        subject={{ handle: "ada", caption: "Orbit Wrapped", mark: markOf("github") }}
        seed="ada-2026"
        scenes={scenes}
        config={config}
        onConfigChange={setConfig}
        classNames={{ "view-player-panel": "card", "timeline-segment-bar": "bar" }}
      />
    </WrappedProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
