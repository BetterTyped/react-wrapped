import { type CSSProperties, useState } from "react";

import {
  configFromSearch,
  DEFAULT_WRAPPED_CONFIG,
  parseWrappedSearch,
  searchFromConfig,
  type WrappedConfig,
} from "@react-wrapped/core";
import { WrappedConfigurator } from "@react-wrapped/player";

/** The config as a query string. A setting at its default is left out, so most links are short. */
export function toQuery(config: WrappedConfig): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchFromConfig(config))) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

/** A query string back into a config. Anything in it that makes no sense falls back to the default. */
export function fromQuery(query: string): WrappedConfig {
  return configFromSearch(parseWrappedSearch(Object.fromEntries(new URLSearchParams(query))));
}

const PANEL: CSSProperties = { maxWidth: 420 };

export function LinkIsTheVideo() {
  const [config, setConfig] = useState<WrappedConfig>(DEFAULT_WRAPPED_CONFIG);
  const [pasted, setPasted] = useState("p=grape&m=light&f=square&s=1.5");
  const query = toQuery(config);
  return (
    <div>
      <div style={PANEL}>
        <WrappedConfigurator config={config} onChange={setConfig} />
      </div>
      <output>{query ? `?${query}` : "Nothing to add: every setting is at its default."}</output>
      <div role="group" aria-label="Open a link">
        <input
          type="text"
          aria-label="A query string to open"
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
        />
        <button type="button" onClick={() => setConfig(fromQuery(pasted))}>
          Open this link
        </button>
      </div>
    </div>
  );
}
