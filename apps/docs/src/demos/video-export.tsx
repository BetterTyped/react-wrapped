import { type CSSProperties, useEffect, useRef, useState } from "react";

import { type SceneInstance, WRAPPED_FORMATS, type WrappedConfig, type WrappedSubject } from "@react-wrapped/core";
import { frameTimes, renderVideo, VIDEO_FPS, WrappedPlayer, type WrappedPlayerHandle } from "@react-wrapped/player";

const ROOM: CSSProperties = { display: "grid", height: 560 };

export function DownloadVideo({
  subject,
  seed,
  scenes,
  config,
  fileName,
}: {
  subject: WrappedSubject;
  seed: string;
  scenes: readonly SceneInstance[];
  config: WrappedConfig;
  /** The saved file's name, extension included. */
  fileName: string;
}) {
  const player = useRef<WrappedPlayerHandle>(null);
  const stop = useRef<AbortController | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [said, setSaid] = useState("No file made yet.");
  // Leaving the page stops a video that is still being made.
  useEffect(() => () => stop.current?.abort(), []);

  const download = async () => {
    // The stage and the playhead, on loan. The player stands still until `release` gives them back.
    const take = player.current?.take();
    if (!take) return;
    const controller = new AbortController();
    stop.current = controller;
    setPercent(0);
    setSaid(`Drawing ${frameTimes(take.seconds, VIDEO_FPS).length} frames, one by one.`);
    try {
      const video = await renderVideo(take, WRAPPED_FORMATS[config.format], {
        signal: controller.signal,
        // Called once a frame. Whole percents, so the page renders a hundred times and not six thousand.
        onProgress: (share) => setPercent(Math.floor(share * 100)),
      });
      const url = URL.createObjectURL(video);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSaid(`Saved ${(video.size / 1_000_000).toFixed(1)} MB as ${fileName}.`);
    } catch (error) {
      // Stopped on purpose is not a failure. Anything else comes with a sentence a person can read.
      if (controller.signal.aborted) setSaid("Stopped.");
      else setSaid(error instanceof Error ? error.message : "The video did not come through. Try again.");
    } finally {
      take.release();
      stop.current = null;
      setPercent(null);
    }
  };

  return (
    <div>
      {/* While the stage is being filmed nothing else may move it. */}
      <div style={ROOM} inert={percent !== null}>
        <WrappedPlayer ref={player} subject={subject} seed={seed} scenes={scenes} config={config} />
      </div>
      <div role="group" aria-label="Video file">
        {percent === null ? (
          <button type="button" onClick={() => void download()}>
            Download the MP4
          </button>
        ) : (
          <button type="button" onClick={() => stop.current?.abort()}>
            Stop at {percent}%
          </button>
        )}
      </div>
      <output>{said}</output>
    </div>
  );
}
