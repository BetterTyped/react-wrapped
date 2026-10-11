import { useMemo, useState } from "react";

import {
  type CalendarLevels,
  DEFAULT_WRAPPED_CONFIG,
  type HiddenDrop,
  type SceneInstance,
  useOpenedDrops,
  type WrappedConfig,
  type WrappedSubject,
  WrappedView,
} from "@react-wrapped/kit";

/** What your director returns for one year, given the drops opened so far. */
interface Cut {
  subject: WrappedSubject;
  seed: string;
  /** The story, with a scene for every drop that has been opened. */
  scenes: readonly SceneInstance[];
  calendar: CalendarLevels;
  /** Every hidden scene, found or not. */
  drops: readonly HiddenDrop[];
}

export function ScanFirst({
  direct,
  describeDay,
  storageKey,
}: {
  direct: (opened: readonly string[]) => Cut;
  describeDay: (day: number) => string;
  /** Where the opened drops are remembered on this device. Null keeps them for this visit only. */
  storageKey: string | null;
}) {
  const [config, setConfig] = useState<WrappedConfig>(DEFAULT_WRAPPED_CONFIG);
  const { opened, open, ready } = useOpenedDrops(storageKey);
  // Directed again whenever a drop is opened: that is how a found scene gets into the video.
  const cut = useMemo(() => direct(opened), [direct, opened]);
  // Until storage has been read, nobody knows whether this creator has scanned before.
  if (!ready) return null;
  return (
    <WrappedView
      subject={cut.subject}
      seed={cut.seed}
      scenes={cut.scenes}
      config={config}
      onConfigChange={setConfig}
      opening={{
        calendar: cut.calendar,
        drops: cut.drops,
        found: opened,
        onOpen: open,
        describeDay,
        // The scan is the page until it has run once. Without this the video plays and the scan sits under it.
        gate: true,
      }}
    />
  );
}
