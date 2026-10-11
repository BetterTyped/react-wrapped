import { useCallback, useEffect, useState } from "react";

import {
  configFromSearch,
  DEFAULT_WRAPPED_CONFIG,
  parseWrappedSearch,
  searchFromConfig,
  type WrappedConfig,
} from "@react-wrapped/core";

/** The config, kept in the address bar: read from the link when the page opens, written back on every change. */
export function useUrlConfig(defaults: WrappedConfig = DEFAULT_WRAPPED_CONFIG) {
  const [config, setConfig] = useState(defaults);

  // After the first paint: the server does not know the query string of a static page, so both render the defaults.
  useEffect(() => {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    setConfig(configFromSearch(parseWrappedSearch(query), defaults));
  }, [defaults]);

  const change = useCallback(
    (next: WrappedConfig) => {
      setConfig(next);
      const params = new URLSearchParams();
      // The same defaults both ways, so "left out" means the same thing when the link is read again.
      for (const [key, value] of Object.entries(searchFromConfig(next, defaults))) {
        if (value !== undefined) params.set(key, String(value));
      }
      const query = params.toString();
      // Replaced, not pushed: trying six palettes should not take six presses of the back button to undo.
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    },
    [defaults],
  );

  return [config, change] as const;
}
