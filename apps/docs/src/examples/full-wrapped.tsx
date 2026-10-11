import { useMemo, useState } from "react";

import {
  DEFAULT_WRAPPED_CONFIG,
  renderInsightCard,
  renderShareCard,
  resolvePalette,
  useOpenedDrops,
  type WrappedConfig,
  type WrappedGraphic,
  WrappedView,
} from "@react-wrapped/kit";
import { directSample, formatShort, sampleInsights, sampleTraits, sampleYear } from "@react-wrapped/sample";

/**
 * A whole Wrapped from one component: a made-up developer's year on a made-up platform, with a player, the settings,
 * a scan that finds four hidden scenes, an editable timeline and the graphics to keep. Nothing here reaches past the
 * packages' public exports, which is the point: if this page needs it, it is exported.
 */
export function FullWrapped({ gate = false }: { gate?: boolean }) {
  const [config, setConfig] = useState<WrappedConfig>({ ...DEFAULT_WRAPPED_CONFIG, format: "story" });
  const sample = useMemo(() => {
    const year = sampleYear();
    return { year, traits: sampleTraits(year) };
  }, []);
  // The example opens fresh on every visit: nothing is stored for it.
  const { opened, open } = useOpenedDrops(null);
  const cut = useMemo(() => directSample(sample.year, sample.traits, opened), [sample, opened]);
  // The cards are drawn in the browser, once per palette. They do not depend on what has been opened: a find
  // would redraw every one of them in the middle of its own reveal.
  const insights = useMemo(() => sampleInsights(sample.year, sample.traits), [sample]);
  const graphics = useMemo((): WrappedGraphic[] => {
    const palette = resolvePalette(config);
    const hidden = new Set(cut.pending.map((drop) => drop.id));
    return [
      {
        id: "share-card",
        title: "Share card",
        line: "The year on one card, sized for a post.",
        image: () => renderShareCard(cut.card, palette),
        fileName: `${sample.year.handle}-wrapped`,
        wide: true,
      },
      ...insights.map((card) => ({
        id: `insight-${card.id}`,
        title: card.name,
        line: card.insight,
        image: () => renderInsightCard(card, palette),
        fileName: `${sample.year.handle}-${card.id}`,
        wide: true,
        locked: card.traitId ? hidden.has(card.traitId) : false,
      })),
    ];
    // The palette is rebuilt from the config; only its colours matter here.
  }, [cut.card, cut.pending, insights, sample.year.handle, config]);

  return (
    <WrappedView
      subject={cut.subject}
      seed={cut.seed}
      scenes={cut.scenes}
      config={config}
      onConfigChange={setConfig}
      share={{ fileName: `${sample.year.handle}-wrapped.mp4`, graphics }}
      opening={{
        calendar: cut.calendar,
        drops: cut.drops,
        found: opened,
        onOpen: open,
        describeDay: (day) => formatShort(sample.year.days[day].date),
        gate,
      }}
    />
  );
}
