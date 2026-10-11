import { type CSSProperties, useRef, useState } from "react";

import type { SceneInstance, WrappedConfig, WrappedSubject } from "@react-wrapped/core";
import { WrappedPlayer, type WrappedPlayerHandle } from "@react-wrapped/player";

// The player fits its frame into the room it is given, so the room needs a height.
const ROOM: CSSProperties = { display: "grid", height: 560 };

export function PlayerRemote({
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
  const player = useRef<WrappedPlayerHandle>(null);
  const [said, setSaid] = useState("Nothing measured yet.");

  const measure = () => {
    const handle = player.current;
    if (!handle) return;
    // Both are in seconds at normal speed: the length of the video, and where each scene starts in it.
    const starts = handle.scenes().map((scene) => `${scene.label} at ${scene.time.toFixed(1)}s`);
    setSaid(`${handle.duration().toFixed(1)}s in all. ${starts.join(", ")}.`);
  };

  return (
    <div>
      <div style={ROOM}>
        <WrappedPlayer ref={player} subject={subject} seed={seed} scenes={scenes} config={config} />
      </div>
      <div role="group" aria-label="Drive the player from outside">
        <button type="button" onClick={() => player.current?.play()}>
          Play
        </button>
        <button type="button" onClick={() => player.current?.pause()}>
          Pause
        </button>
        <button type="button" onClick={() => player.current?.restart()}>
          Restart
        </button>
        <button type="button" onClick={() => player.current?.seek(player.current.duration())}>
          Jump to the end
        </button>
        <button type="button" onClick={measure}>
          Measure
        </button>
      </div>
      <output>{said}</output>
    </div>
  );
}
