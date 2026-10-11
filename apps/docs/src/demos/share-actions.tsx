import { type CSSProperties, useRef, useState } from "react";

import type { SceneInstance, WrappedConfig, WrappedSubject } from "@react-wrapped/core";
import { ShareActions, WrappedPlayer, type WrappedPlayerHandle } from "@react-wrapped/player";

// Side by side where there is room, stacked on a phone.
const COLUMNS: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" };
const ROOM: CSSProperties = { display: "grid", height: 520, flex: "1 1 260px", minWidth: 0 };
const SIDE: CSSProperties = { flex: "1 1 280px", minWidth: 0 };

export function VideoWithShare({
  subject,
  seed,
  scenes,
  config,
}: {
  subject: WrappedSubject;
  seed: string;
  scenes: readonly SceneInstance[];
  config: WrappedConfig;
}) {
  // The same ref goes to the player and to the row: the row borrows the player's stage to make the file.
  const player = useRef<WrappedPlayerHandle>(null);
  // While the file is made the stage is filmed frame by frame, so the player is kept out of reach.
  const [rendering, setRendering] = useState(false);
  return (
    <div style={COLUMNS}>
      <div style={ROOM} inert={rendering}>
        <WrappedPlayer ref={player} subject={subject} seed={seed} scenes={scenes} config={config} autoplay={false} />
      </div>
      <div style={SIDE}>
        <ShareActions player={player} config={config} fileName="ada-wrapped.mp4" onRendering={setRendering} />
      </div>
    </div>
  );
}
