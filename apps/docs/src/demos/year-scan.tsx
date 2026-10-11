import { useState } from "react";

import { type CalendarLevels, resolvePalette, type WrappedConfig } from "@react-wrapped/core";
import { type HiddenDrop, useOpenedDrops, YearScan } from "@react-wrapped/scan";

export function ScanTheYear({
  calendar,
  drops,
  describeDay,
  config,
}: {
  /** The same calendar the video draws, so the scan hides its drops in the year the viewer just watched. */
  calendar: CalendarLevels;
  drops: readonly HiddenDrop[];
  /** How a day reads on a found card, by its index in the calendar: "Mar 14". */
  describeDay: (day: number) => string;
  config: WrappedConfig;
}) {
  // What has been opened so far. With `null` it is kept for this visit only. A key keeps it on this device.
  const { opened, open } = useOpenedDrops(null);
  const [running, setRunning] = useState(false);
  return (
    <div>
      <YearScan
        calendar={calendar}
        palette={resolvePalette(config)}
        drops={drops}
        found={opened}
        // Called when a card has been turned over and added. This is the moment its scene joins your video.
        onOpen={open}
        describeDay={describeDay}
        onRunChange={setRunning}
      />
      <output>
        {`${opened.length} of ${drops.length} found${running ? ", scanning" : ""}. opened: [${opened.join(", ")}]`}
      </output>
    </div>
  );
}
