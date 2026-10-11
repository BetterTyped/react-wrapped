import { BufferTarget, canEncodeVideo, CanvasSource, Mp4OutputFormat, Output } from "mediabunny";

import { createFramePainter } from "./stage-frame";

/** Frames a second in the file. The timeline is asked for each one exactly, so the motion is as smooth as this. */
export const VIDEO_FPS = 60;
const BITS_PER_PIXEL = 6;

/**
 * The player's stage and playhead, on loan to a render. While it is out the video does not play: `show` puts any
 * moment on the stage, and `release` gives everything back the way it was.
 */
export interface StageTake {
  stage: HTMLElement;
  /** How long the video plays at the speed it is set to. */
  seconds: number;
  show: (seconds: number) => void;
  /** False once the video was rebuilt under the render (a setting changed, a scene joined). */
  intact: () => boolean;
  release: () => void;
}

/** The moment each frame of the file shows. The last one is the video's very end, so it stops on the finished scene. */
export function frameTimes(seconds: number, fps: number): number[] {
  const frames = Math.max(1, Math.ceil(seconds * fps));
  return [...Array.from({ length: frames }, (_, frame) => frame / fps), seconds];
}

/**
 * The video as an MP4, made in the page: every frame is the real stage at the video's real resolution, set to its
 * exact moment and encoded by the browser's own H.264 encoder. Nothing is recorded off the screen, so the file does
 * not depend on how big the player is, how fast the machine is, or whether the tab is in front.
 */
export async function renderVideo(
  take: StageTake,
  { width, height }: { width: number; height: number },
  { onProgress, signal }: { onProgress: (share: number) => void; signal: AbortSignal },
): Promise<Blob> {
  // A bitrate, not a quality level: a level asks for a fixed quantizer, which no hardware encoder takes, and the
  // software one made a minute of video in three. This much is about 12 Mbps at 1080p, well past what flat colour
  // and type need, and the encoder spends less wherever the picture holds still.
  const bitrate = width * height * BITS_PER_PIXEL;
  const hardware = await canEncodeVideo("avc", { width, height, bitrate, hardwareAcceleration: "prefer-hardware" });
  if (!hardware && !(await canEncodeVideo("avc", { width, height, bitrate }))) {
    throw new Error("This browser cannot make the video. Chrome, Edge and Safari can.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Your browser blocked the canvas the video is drawn on.");

  const painter = await createFramePainter(take.stage, { width, height });
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    bitrate,
    keyFrameInterval: 2,
    hardwareAcceleration: hardware ? "prefer-hardware" : "no-preference",
  });
  output.addVideoTrack(source, { frameRate: VIDEO_FPS });
  await output.start();

  const times = frameTimes(take.seconds, VIDEO_FPS);
  try {
    for (const [frame, time] of times.entries()) {
      signal.throwIfAborted();
      if (!take.intact()) throw new Error("The video changed while it was being made. Try again.");
      take.show(time);
      // oxlint-disable-next-line no-await-in-loop -- frames are made in order: each one is the stage at its moment
      await painter.paint(context);
      // Resolves when the encoder has room, so frames never pile up in memory.
      // oxlint-disable-next-line no-await-in-loop
      await source.add(frame / VIDEO_FPS, 1 / VIDEO_FPS);
      onProgress((frame + 1) / times.length);
    }
  } catch (error) {
    await output.cancel();
    throw error;
  }
  await output.finalize();
  const { buffer } = output.target;
  if (!buffer) throw new Error("The browser could not finish the video file.");
  return new Blob([buffer], { type: "video/mp4" });
}
