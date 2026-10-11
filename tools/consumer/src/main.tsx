// What a first user writes: a Wrapped from the all-in-one package, with a label replaced and a mark in the corner.
import { useState } from "react";
import { createRoot } from "react-dom/client";

import { bigNumberScene, chartScene, DEFAULT_WRAPPED_CONFIG, WrappedProvider, WrappedView } from "@react-wrapped/kit";
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

function App() {
  const [config, setConfig] = useState(DEFAULT_WRAPPED_CONFIG);
  return (
    <WrappedProvider labels={{ player: { play: "Go" } }}>
      <WrappedView
        subject={{ handle: "ada", caption: "Orbit Wrapped", mark: markOf("github") }}
        seed="ada-2026"
        scenes={scenes}
        config={config}
        onConfigChange={setConfig}
      />
    </WrappedProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
