import { type CSSProperties, useState } from "react";

import {
  DEFAULT_WRAPPED_CONFIG,
  type SceneInstance,
  type WrappedConfig,
  type WrappedSubject,
} from "@react-wrapped/core";
import { WrappedConfigurator, WrappedPlayer } from "@react-wrapped/player";

// Side by side where there is room, stacked on a phone.
const COLUMNS: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" };
const ROOM: CSSProperties = { display: "grid", height: 520, flex: "1 1 260px", minWidth: 0 };
const PANEL: CSSProperties = { flex: "1 1 300px", minWidth: 0 };

export function Settings({
  subject,
  seed,
  scenes,
}: {
  subject: WrappedSubject;
  seed: string;
  scenes: readonly SceneInstance[];
}) {
  // The panel never keeps a setting itself: it shows the config it is given and hands back the next one.
  const [config, setConfig] = useState<WrappedConfig>(DEFAULT_WRAPPED_CONFIG);
  return (
    <div style={COLUMNS}>
      <div style={ROOM}>
        <WrappedPlayer subject={subject} seed={seed} scenes={scenes} config={config} />
      </div>
      <div style={PANEL}>
        <WrappedConfigurator config={config} onChange={setConfig} />
      </div>
    </div>
  );
}
