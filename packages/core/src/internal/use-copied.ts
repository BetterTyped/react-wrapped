import { useCallback, useEffect, useRef, useState } from "react";

const RESET_MS = 1800;

/** Copies a string and reports it in place for a moment, so nobody wonders whether it took. */
export function useCopied(): [copied: boolean, copy: (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }, []);

  return [copied, copy];
}
