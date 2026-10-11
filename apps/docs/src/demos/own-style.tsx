import { type CSSProperties, useState } from "react";

import type { SceneInstance, SlotClassNames, WrappedConfig, WrappedSubject } from "@react-wrapped/core";
import {
  type ConfiguratorSlot,
  type TimelineSlot,
  WrappedConfigurator,
  WrappedPlayer,
  type WrappedPlayerSlot,
} from "@react-wrapped/player";

// Plain CSS classes of your own. This stylesheet comes after the library's, so on the same element a class here
// wins over the library's class. They read the chrome tokens, so they follow light and dark like everything else.
const CSS = `
.orbit-frame { border-radius: 4px; }
.orbit-button {
  border-radius: 6px;
  background: var(--wr-ui-primary);
  color: var(--wr-ui-primary-fg);
  box-shadow: 0 3px 0 color-mix(in oklch, var(--wr-ui-primary) 62%, black);
}
.orbit-clock { font-family: ui-monospace, monospace; color: var(--wr-ui-fg); }
.orbit-bar { border-radius: 2px; background: var(--wr-ui-border); }
.orbit-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--wr-ui-muted-fg); }
.orbit-chip {
  border-radius: 6px;
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--wr-ui-border);
}
/* The library styles a picked chip with the state in its selector, which outweighs a bare class. Name the state. */
.orbit-chip[aria-checked="true"] {
  background: var(--wr-ui-primary);
  color: var(--wr-ui-primary-fg);
  box-shadow: none;
}
.orbit-swatch { border-radius: 6px; }
`;

// A class per slot. The player takes its own slots and the timeline's.
const PLAYER: SlotClassNames<WrappedPlayerSlot | TimelineSlot> = {
  "player-frame": "orbit-frame",
  "player-play": "orbit-button",
  "player-restart": "orbit-button",
  "player-fullscreen": "orbit-button",
  "player-clock": "orbit-clock",
  "timeline-segment-bar": "orbit-bar",
};

const SETTINGS: SlotClassNames<ConfiguratorSlot> = {
  "settings-label": "orbit-label",
  "settings-chip": "orbit-chip",
  "settings-swatch": "orbit-swatch",
};

// Side by side where there is room, stacked on a phone.
const COLUMNS: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", marginTop: 14 };
const ROOM: CSSProperties = { display: "grid", height: 520, flex: "1 1 260px", minWidth: 0 };
const PANEL: CSSProperties = { flex: "1 1 300px", minWidth: 0 };

export function OwnStyle({
  subject,
  seed,
  scenes,
  config,
  onConfigChange,
}: {
  subject: WrappedSubject;
  seed: string;
  scenes: readonly SceneInstance[];
  config: WrappedConfig;
  onConfigChange: (next: WrappedConfig) => void;
}) {
  const [styled, setStyled] = useState(true);
  return (
    <div>
      <style>{CSS}</style>
      <label>
        <input type="checkbox" checked={styled} onChange={(event) => setStyled(event.target.checked)} />
        Use our classes
      </label>
      <div style={COLUMNS}>
        <div style={ROOM}>
          <WrappedPlayer
            subject={subject}
            seed={seed}
            scenes={scenes}
            config={config}
            classNames={styled ? PLAYER : undefined}
          />
        </div>
        <div style={PANEL}>
          <WrappedConfigurator config={config} onChange={onConfigChange} classNames={styled ? SETTINGS : undefined} />
        </div>
      </div>
    </div>
  );
}
