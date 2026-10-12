import { useEffect, useMemo, useState } from "react";

import { useLookConfig } from "./preview";
import { WrappedPlayer } from "@react-wrapped/kit";
import { directSample, sampleTraits, sampleYear } from "@react-wrapped/sample";

/**
 * The library itself, playing on the home page: a made-up developer's whole year, every hidden scene already found,
 * in whatever palette and format the reader picked. Nothing here is a recording.
 */
export function HeroPlayer() {
  const look = useLookConfig();
  // A tall frame suits the hero: the look's own format is for the previews further down.
  const config = useMemo(() => ({ ...look, format: "story" as const }), [look]);
  const cut = useMemo(() => {
    const year = sampleYear();
    const traits = sampleTraits(year);
    return directSample(
      year,
      traits,
      traits.drops.map((drop) => drop.id),
    );
  }, []);
  // The player builds a dozen scenes' timelines. Not during the first paint: the words come first.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="d-fan-player">
      {ready ? (
        <WrappedPlayer subject={cut.subject} seed={cut.seed} scenes={cut.scenes} config={config} autoplay />
      ) : null}
    </div>
  );
}
