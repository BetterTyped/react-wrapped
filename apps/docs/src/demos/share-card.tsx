import { useEffect, useState } from "react";

import { resolvePalette, type WrappedConfig } from "@react-wrapped/core";
import { renderShareCard, type ShareCardSpec } from "@react-wrapped/graphics";

export function ShareCard({
  spec,
  config,
  fileName,
}: {
  spec: ShareCardSpec;
  config: WrappedConfig;
  fileName: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const { palette, accent, mode } = config;

  // Drawn on a canvas, so only in the browser, and again whenever the palette changes.
  useEffect(() => {
    let made: string | null = null;
    let gone = false;
    const draw = async () => {
      try {
        const png = await renderShareCard(spec, resolvePalette({ palette, accent, mode }));
        if (gone) return;
        made = URL.createObjectURL(png);
        setUrl(made);
      } catch {
        setFailed(true);
      }
    };
    void draw();
    return () => {
      gone = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [spec, palette, accent, mode]);

  if (failed) return <p>The card could not be drawn in this browser.</p>;
  if (!url) return <p>Drawing the card.</p>;
  return (
    <div>
      <img src={url} alt={`@${spec.handle}, ${spec.caption}`} width={1200} height={630} />
      <div role="group" aria-label="Share card">
        <a href={url} download={fileName}>
          Download the PNG
        </a>
      </div>
    </div>
  );
}
