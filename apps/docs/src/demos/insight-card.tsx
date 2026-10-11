import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

import { resolvePalette, type WrappedConfig } from "@react-wrapped/core";
import { InsightCard, type InsightCardSpec, renderInsightCard } from "@react-wrapped/graphics";

// The card is always drawn 1200 by 630. On a page it is scaled down to the room it has.
const BOX: CSSProperties = { position: "relative", aspectRatio: "1200 / 630", overflow: "hidden", borderRadius: 14 };

export function InsightCardOnThePage({
  spec,
  config,
  fileName,
}: {
  spec: InsightCardSpec;
  config: WrappedConfig;
  fileName: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [busy, setBusy] = useState(false);
  const palette = resolvePalette(config);

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const fit = () => setScale(element.clientWidth / 1200);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const download = async () => {
    setBusy(true);
    try {
      // The same card, captured off screen at twice its size.
      const png = await renderInsightCard(spec, palette);
      const url = URL.createObjectURL(png);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div ref={box} style={BOX}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <InsightCard spec={spec} palette={palette} />
        </div>
      </div>
      <div role="group" aria-label="Insight card">
        <button type="button" disabled={busy} onClick={() => void download()}>
          {busy ? "Drawing the PNG" : "Download the PNG"}
        </button>
      </div>
    </div>
  );
}
