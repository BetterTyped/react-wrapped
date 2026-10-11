import type { CSSProperties } from "react";

import type { LoadingSubject, WrappedConfig } from "@react-wrapped/core";
import { WrappedPlayerLoading } from "@react-wrapped/player";

const ROOM: CSSProperties = { display: "grid", height: 560 };

// What the address already says about the year: whose it is. The numbers are still on their way.
const subject: LoadingSubject = { handle: "ada", caption: "Orbit Wrapped" };
// More than one line take turns, a new one every 2.6 seconds.
const lines = ["Reading your year.", "Counting the busy days.", "Looking for your longest streak."];

export function WaitingForTheYear({ config }: { config: WrappedConfig }) {
  return (
    <div style={ROOM}>
      <WrappedPlayerLoading subject={subject} lines={lines} config={config} />
    </div>
  );
}
