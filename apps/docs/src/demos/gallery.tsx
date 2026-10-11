import { useMemo } from "react";

import { resolvePalette, type WrappedConfig } from "@react-wrapped/core";
import {
  GraphicsGallery,
  type InsightCardSpec,
  renderInsightCard,
  renderShareCard,
  type ShareCardSpec,
  type WrappedGraphic,
} from "@react-wrapped/graphics";

/** An insight card with a name for its file, and whether the scan still has to find it. */
type Insight = InsightCardSpec & { id: string; locked?: boolean };

export function ThingsToKeep({
  card,
  insights,
  config,
}: {
  card: ShareCardSpec;
  insights: readonly Insight[];
  config: WrappedConfig;
}) {
  const { palette: id, accent, mode } = config;
  const palette = useMemo(() => resolvePalette({ palette: id, accent, mode }), [id, accent, mode]);
  // Each graphic says how to draw itself. Nothing is drawn until its tile is about to scroll into view.
  const graphics = useMemo(
    (): WrappedGraphic[] => [
      {
        id: "share-card",
        title: "Share card",
        line: "The year on one card, sized for a post.",
        image: () => renderShareCard(card, palette),
        fileName: `${card.handle}-wrapped`,
        wide: true,
      },
      ...insights.map((insight) => ({
        id: insight.id,
        title: insight.name,
        line: insight.insight,
        image: () => renderInsightCard(insight, palette),
        fileName: `${card.handle}-${insight.id}`,
        wide: true,
        locked: insight.locked,
      })),
    ],
    [card, insights, palette],
  );
  return <GraphicsGallery graphics={graphics} palette={palette} />;
}
