import { type CSSProperties, useMemo, useState } from "react";

import type { SceneInstance, WrappedConfig, WrappedSubject } from "@react-wrapped/core";
import { type MarkId, markOf, MARKS } from "@react-wrapped/marks";
import { WrappedPlayer } from "@react-wrapped/player";

const ROOM: CSSProperties = { display: "grid", height: 520, marginTop: 16 };

const MARK_IDS = Object.keys(MARKS) as MarkId[];

export function MarkPicker({
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
  const [picked, setPicked] = useState<MarkId>(MARK_IDS[0]);
  // The mark is part of who the video is about. `markOf` hands back one path, or one per shape of the mark.
  const marked = useMemo(() => ({ ...subject, mark: markOf(picked) }), [subject, picked]);
  return (
    <div>
      <div role="group" aria-label="Marks">
        {MARK_IDS.map((id) => (
          <button key={id} type="button" aria-pressed={id === picked} onClick={() => setPicked(id)}>
            {/* Every mark is path data in a 24 by 24 box, so it draws as a plain SVG too. */}
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path d={MARKS[id]} fill="currentColor" />
            </svg>
            {id}
          </button>
        ))}
      </div>
      <div style={ROOM}>
        <WrappedPlayer subject={marked} seed={seed} scenes={scenes} config={config} />
      </div>
    </div>
  );
}
