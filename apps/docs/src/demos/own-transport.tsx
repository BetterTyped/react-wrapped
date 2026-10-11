import { type CSSProperties, useRef } from "react";

import {
  type SceneInstance,
  useWrappedTimeline,
  WRAPPED_FORMATS,
  type WrappedConfig,
  WrappedStage,
  type WrappedSubject,
} from "@react-wrapped/core";
import { Timeline } from "@react-wrapped/player";

/** How wide the frame is drawn on the page. The stage itself is always full size and scaled to this. */
const WIDTH = 280;

export function OwnTransport({
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
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  // The engine behind `WrappedPlayer`: it builds the timeline and writes the clock and the segments through the refs.
  const { playing, marks, toggle, seekTime, duration } = useWrappedTimeline({
    stageRef,
    scenes,
    config,
    seed,
    trackRef,
    clockRef,
  });

  const format = WRAPPED_FORMATS[config.format];
  const scale = WIDTH / format.width;
  const frame: CSSProperties = {
    position: "relative",
    width: WIDTH,
    height: format.height * scale,
    overflow: "hidden",
    borderRadius: 16,
  };

  return (
    <div>
      <div style={frame}>
        <WrappedStage stageRef={stageRef} subject={subject} scenes={scenes} config={config} scale={scale} />
      </div>
      <div role="group" aria-label="Transport">
        <button type="button" onClick={toggle}>
          {playing ? "Pause" : "Play"}
        </button>
        <Timeline
          trackRef={trackRef}
          scenes={scenes}
          marks={marks}
          duration={duration}
          config={config}
          onSeek={seekTime}
        />
        <span ref={clockRef}>0:00 / 0:00</span>
      </div>
    </div>
  );
}
