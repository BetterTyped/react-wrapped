import { useCallback, useEffect, useState } from "react";

/**
 * Which drops have been opened, remembered on this device (or, with no key,
 * for this visit only). Keyed by the roll
 * (subject and roll time), so a new roll starts unopened. Storage can be
 * blocked or empty, so every read and write fails soft: at worst the drops can
 * be opened again, they can never change.
 */
export function useOpenedDrops(storageKey: string | null): {
  opened: readonly string[];
  open: (id: string) => void;
  ready: boolean;
} {
  const [opened, setOpened] = useState<readonly string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // No key: remembered for this visit only (the landing's example).
    if (!storageKey) {
      setReady(true);
      return;
    }
    let stored: string[] = [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) stored = parsed.filter((id): id is string => typeof id === "string");
    } catch {
      stored = [];
    }
    setOpened(stored);
    setReady(true);
  }, [storageKey]);

  const open = useCallback(
    (id: string) => {
      setOpened((current) => {
        if (current.includes(id)) return current;
        const next = [...current, id];
        if (!storageKey) return next;
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Private windows and blocked storage: the drop is still opened for this visit.
        }
        return next;
      });
    },
    [storageKey],
  );

  return { opened, open, ready };
}
