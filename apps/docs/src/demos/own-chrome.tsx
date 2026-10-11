import { type CSSProperties, useState } from "react";

import type { SceneInstance, WrappedConfig, WrappedSubject } from "@react-wrapped/core";
import { WrappedConfigurator, WrappedPlayer } from "@react-wrapped/player";

// Set on any ancestor of the library's parts. Each one falls back to the library's own value when left out.
const BRAND = {
  "--wr-ui-bg": "oklch(0.985 0.012 285)",
  "--wr-ui-primary": "oklch(0.62 0.2 285)",
  "--wr-ui-card": "oklch(0.97 0.02 285)",
  "--wr-ui-muted": "oklch(0.93 0.03 285)",
  "--wr-ui-border": "oklch(0.86 0.05 285)",
  "--wr-ui-fg": "oklch(0.25 0.08 285)",
  "--wr-ui-muted-fg": "oklch(0.48 0.08 285)",
  "--wr-font": "Georgia, serif",
} as CSSProperties;

// Your page around the parts can read the same tokens, so the two always match.
const COLUMNS: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 24,
  alignItems: "flex-start",
  marginTop: 14,
  padding: 16,
  borderRadius: 18,
  background: "var(--wr-ui-bg)",
  color: "var(--wr-ui-fg)",
};
const ROOM: CSSProperties = { display: "grid", height: 520, flex: "1 1 260px", minWidth: 0 };
const PANEL: CSSProperties = { flex: "1 1 300px", minWidth: 0 };

export function OwnChrome({
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
  const [branded, setBranded] = useState(true);
  return (
    <div>
      <label>
        <input type="checkbox" checked={branded} onChange={(event) => setBranded(event.target.checked)} />
        Use our tokens
      </label>
      {/* The video keeps its own palette: the tokens only reach the chrome around it. */}
      <div style={branded ? { ...COLUMNS, ...BRAND } : COLUMNS}>
        <div style={ROOM}>
          <WrappedPlayer subject={subject} seed={seed} scenes={scenes} config={config} />
        </div>
        <div style={PANEL}>
          <WrappedConfigurator config={config} onChange={onConfigChange} />
        </div>
      </div>
    </div>
  );
}
