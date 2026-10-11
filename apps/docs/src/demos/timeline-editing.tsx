import { type CSSProperties, useMemo, useState } from "react";

import { arrangeScenes, type SceneInstance, type WrappedConfig, type WrappedSubject } from "@react-wrapped/core";
import { WrappedPlayer } from "@react-wrapped/player";

const ROOM: CSSProperties = { display: "grid", height: 560 };

export function EditableCut({
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
  const [asked, setAsked] = useState<string | null>(null);
  // Every scene in the viewer's order, the switched-off ones too: the timeline shows them all.
  const ordered = useMemo(() => arrangeScenes(scenes, config.order), [scenes, config.order]);
  // Only what is still on gets played. Memoized: the player rebuilds its timeline when this array changes.
  const playing = useMemo(
    () => ordered.filter((scene) => !config.hidden.includes(scene.key)),
    [ordered, config.hidden],
  );

  const keys = ordered.map((scene) => scene.key);
  const editing = {
    scenes: ordered,
    hidden: config.hidden,
    onToggle: (key: string, on: boolean) =>
      onConfigChange({
        ...config,
        hidden: on ? config.hidden.filter((hidden) => hidden !== key) : [...config.hidden, key],
      }),
    onMove: (key: string, by: -1 | 1) => {
      const from = keys.indexOf(key);
      const to = from + by;
      if (from === -1 || to < 0 || to >= keys.length) return;
      const order = [...keys];
      [order[from], order[to]] = [order[to], order[from]];
      onConfigChange({ ...config, order });
    },
    // The pencil. Open your own editor here, or the library's `SceneEditor`.
    onEdit: setAsked,
  };

  return (
    <div>
      <div style={ROOM}>
        <WrappedPlayer subject={subject} seed={seed} scenes={playing} config={config} editing={editing} />
      </div>
      <output>
        {`hidden: [${config.hidden.join(", ")}] order: [${config.order.join(", ")}]`}
        {asked ? ` asked to edit: ${asked}` : ""}
      </output>
    </div>
  );
}
