import { type ReactNode, useCallback, useMemo, useState } from "react";

import { useLookConfig } from "../components/look";
import type { PartId } from "../registry/parts";
import {
  describeSampleDay,
  SAMPLE,
  SAMPLE_HANDLE,
  SAMPLE_INSIGHTS,
  sampleCut,
  sampleScene,
  SHORT_SCENES,
} from "../registry/sample";
import { LinkIsTheVideo } from "./config-url";
import { FirstWrapped } from "./first-wrapped";
import { ThingsToKeep } from "./gallery";
import { InsightCardOnThePage } from "./insight-card";
import { WaitingForTheYear } from "./loading";
import { MarkPicker } from "./marks";
import { OwnChrome } from "./own-chrome";
import { OwnColour } from "./own-colour";
import { OwnTransport } from "./own-transport";
import { PlayerRemote } from "./player-remote";
import { Rarities } from "./rarities";
import { ScanFirst } from "./scan-first";
import { EditOneScene } from "./scene-editing";
import { Settings } from "./settings";
import { ShareCard } from "./share-card";
import { EditableCut } from "./timeline-editing";
import { DownloadVideo } from "./video-export";
import { ScanTheYear } from "./year-scan";
import type { WrappedConfig } from "@react-wrapped/core";

/*
 * The interactive previews, fed the sample year. Each component in this folder is written the way a reader would
 * write it: it takes the year as props and imports only the library, and its file is shown on the page as the usage
 * code. This file is the docs' own wiring and is never shown.
 */

const { subject, seed } = SAMPLE;

/**
 * The reader's look, plus what a preview changes for itself alone: hidden scenes, their order, rewritten texts and
 * picked transitions. Those stay with the preview, so editing one page's video does not edit every other page's.
 */
function useOwnConfig(): [WrappedConfig, (next: WrappedConfig) => void] {
  const look = useLookConfig();
  const [own, setOwn] = useState<Pick<WrappedConfig, "hidden" | "order" | "edits" | "cuts">>({
    hidden: look.hidden,
    order: look.order,
    edits: look.edits,
    cuts: look.cuts,
  });
  const config = useMemo(() => ({ ...look, ...own }), [look, own]);
  const change = useCallback(
    (next: WrappedConfig) => setOwn({ hidden: next.hidden, order: next.order, edits: next.edits, cuts: next.cuts }),
    [],
  );
  return [config, change];
}

function PlayerRemotePart() {
  return <PlayerRemote subject={subject} seed={seed} scenes={SHORT_SCENES} config={useLookConfig()} />;
}

function TimelineEditingPart() {
  const [config, change] = useOwnConfig();
  return <EditableCut subject={subject} seed={seed} scenes={SHORT_SCENES} config={config} onConfigChange={change} />;
}

function OwnTransportPart() {
  return <OwnTransport subject={subject} seed={seed} scenes={SHORT_SCENES} config={useLookConfig()} />;
}

function SceneEditorPart() {
  const [config, change] = useOwnConfig();
  return (
    <EditOneScene
      original={sampleScene("total")}
      next={sampleScene("week")}
      seed={seed}
      config={config}
      onConfigChange={change}
    />
  );
}

function VideoExportPart() {
  // Two scenes: a short file, so a reader can see that it works without a long wait.
  const scenes = useMemo(() => SHORT_SCENES.slice(0, 2), []);
  return (
    <DownloadVideo
      subject={subject}
      seed={seed}
      scenes={scenes}
      config={useLookConfig()}
      fileName={`${SAMPLE_HANDLE}-wrapped.mp4`}
    />
  );
}

function LoadingPart() {
  return <WaitingForTheYear config={useLookConfig()} />;
}

function YearScanPart() {
  return (
    <ScanTheYear
      calendar={SAMPLE.calendar}
      drops={SAMPLE.drops}
      describeDay={describeSampleDay}
      config={useLookConfig()}
    />
  );
}

function RaritiesPart() {
  return <Rarities drops={SAMPLE.drops} config={useLookConfig()} />;
}

function ShareCardPart() {
  return <ShareCard spec={SAMPLE.card} config={useLookConfig()} fileName={`${SAMPLE_HANDLE}-wrapped.png`} />;
}

function InsightCardPart() {
  const [insight] = SAMPLE_INSIGHTS;
  return (
    <InsightCardOnThePage spec={insight} config={useLookConfig()} fileName={`${SAMPLE_HANDLE}-${insight.id}.png`} />
  );
}

/** The first five cards, the last two of them still locked, so the gallery shows both kinds of tile. */
const GALLERY_INSIGHTS = SAMPLE_INSIGHTS.slice(0, 5).map((insight, index) => ({ ...insight, locked: index > 2 }));

function GalleryPart() {
  return <ThingsToKeep card={SAMPLE.card} insights={GALLERY_INSIGHTS} config={useLookConfig()} />;
}

function MarksPart() {
  const scenes = useMemo(() => SHORT_SCENES.slice(0, 2), []);
  return <MarkPicker subject={subject} seed={seed} scenes={scenes} config={useLookConfig()} />;
}

function OwnColourPart() {
  return <OwnColour scene={sampleScene("total")} config={useLookConfig()} />;
}

function OwnChromePart() {
  const [config, change] = useOwnConfig();
  return <OwnChrome subject={subject} seed={seed} scenes={SHORT_SCENES} config={config} onConfigChange={change} />;
}

export const PARTS: Record<PartId, { render: () => ReactNode; look: boolean }> = {
  // These keep a whole config of their own, the way an app does, so the site's look controls do not reach them.
  "first-wrapped": { render: () => <FirstWrapped />, look: false },
  "scan-first": {
    render: () => <ScanFirst direct={sampleCut} describeDay={describeSampleDay} storageKey={null} />,
    look: false,
  },
  settings: { render: () => <Settings subject={subject} seed={seed} scenes={SHORT_SCENES} />, look: false },
  "config-url": { render: () => <LinkIsTheVideo />, look: false },
  "player-remote": { render: () => <PlayerRemotePart />, look: true },
  "timeline-editing": { render: () => <TimelineEditingPart />, look: true },
  "own-transport": { render: () => <OwnTransportPart />, look: true },
  "scene-editor": { render: () => <SceneEditorPart />, look: true },
  loading: { render: () => <LoadingPart />, look: true },
  "video-export": { render: () => <VideoExportPart />, look: true },
  "year-scan": { render: () => <YearScanPart />, look: true },
  rarities: { render: () => <RaritiesPart />, look: true },
  "share-card": { render: () => <ShareCardPart />, look: true },
  "insight-card": { render: () => <InsightCardPart />, look: true },
  gallery: { render: () => <GalleryPart />, look: true },
  marks: { render: () => <MarksPart />, look: true },
  "own-colour": { render: () => <OwnColourPart />, look: true },
  "own-chrome": { render: () => <OwnChromePart />, look: true },
};
