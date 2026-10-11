import { useEffect, useRef, useState } from "react";

/** How long the finished scan stays up before the video takes its place: the last find lands and is seen. */
const GATE_BEAT = 900;

/**
 * The scan comes first. A creator who has opened nothing yet gets the scan as the page; the video and everything
 * around it take over once a scan has come to rest with something found.
 *
 * Render the scan alone while `gated` is true (pass it on as `YearScan`'s `gate`), and hand `onRunChange` to
 * `YearScan`. The page stays the scan's while the scan it started is still going: the first find must not pull the
 * layout out from under the ones after it. A scan run later, under the video, never takes the page back.
 */
export function useScanGate({
  enabled,
  found,
  id,
  beat = GATE_BEAT,
}: {
  /** Whether this Wrapped opens on its scan at all: someone's own year with drops in it, not an example. */
  enabled: boolean;
  /** How many drops have been found so far. */
  found: number;
  /** Which Wrapped this is, so another year opened in the same place starts at its own gate. */
  id: string | null;
  /** Milliseconds the finished scan stays up before the video takes over. */
  beat?: number;
}): { gated: boolean; onRunChange: (running: boolean) => void } {
  const [scanning, setScanning] = useState(false);
  const [passed, setPassed] = useState<string | null>(null);
  const gated = enabled && passed !== id && (found === 0 || scanning);

  const foundRef = useRef(found);
  foundRef.current = found;
  const idRef = useRef(id);
  idRef.current = id;
  const gatedRef = useRef(gated);
  gatedRef.current = gated;
  const beatRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (beatRef.current) clearTimeout(beatRef.current);
    },
    [],
  );

  const onRunChange = (running: boolean) => {
    // A scan run later, under the video, is only a scan: it never takes the page back.
    if (!gatedRef.current) return;
    if (beatRef.current) clearTimeout(beatRef.current);
    beatRef.current = null;
    if (running) {
      setScanning(true);
      return;
    }
    // Stopped with nothing found: the scan is still the page, ready to be run again.
    if (foundRef.current === 0) {
      setScanning(false);
      return;
    }
    beatRef.current = setTimeout(() => {
      setPassed(idRef.current);
      setScanning(false);
    }, beat);
  };

  return { gated, onRunChange };
}
