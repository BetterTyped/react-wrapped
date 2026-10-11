import {
  type CalendarLevels,
  resolvePalette,
  type WrappedConfig,
  type WrappedLabelOverrides,
  WrappedProvider,
} from "@react-wrapped/core";
import { type HiddenDrop, useOpenedDrops, YearScan } from "@react-wrapped/scan";

/** Polish needs three forms of a counted noun: 1 scena, 2 sceny, 5 scen. A label is a function, so it can have them. */
const scenes = (count: number) => {
  const few = count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14);
  return `${count} ${count === 1 ? "scenę" : few ? "sceny" : "scen"}`;
};

// Only what this page shows is translated. Everything left out stays in English.
const POLISH: WrappedLabelOverrides = {
  scan: {
    hiding: (count) => `Twój rok ukrywa ${scenes(count)}.`,
    about: "Twoje osiągnięcia i kilka niespodzianek. Każda trafia do filmu, gdy skan ją znajdzie.",
    scanning: (left) => `Skanuję twój rok. Zostało jeszcze: ${left}.`,
    scanningLast: "Szukam ostatniej.",
    foundAll: (count) => `Wszystkie znalezione: ${count}.`,
    moreHiding: (count) => `W twoim roku kryje się jeszcze: ${count}.`,
    done: "Są już w twoim filmie. Uruchom skan ponownie, żeby zobaczyć je jeszcze raz.",
    start: "Skanuj mój rok",
    resume: "Skanuj dalej",
    findAll: "Znajdź wszystkie",
    again: "Skanuj ponownie",
    finds: "Twoje znaleziska",
    stillHidden: "Wciąż ukryte",
    foundOn: (day) => `Znalezione: ${day}`,
  },
  rarity: { common: "Pospolite", rare: "Rzadkie", epic: "Epickie", legendary: "Legendarne" },
};

export function ScanInPolish({
  calendar,
  drops,
  describeDay,
  config,
}: {
  calendar: CalendarLevels;
  drops: readonly HiddenDrop[];
  describeDay: (day: number) => string;
  config: WrappedConfig;
}) {
  const { opened, open } = useOpenedDrops(null);
  return (
    // Everything inside the provider reads its words from it. Numbers are written the way `locale` writes them.
    <WrappedProvider labels={POLISH} locale="pl-PL">
      <YearScan
        calendar={calendar}
        palette={resolvePalette(config)}
        drops={drops}
        found={opened}
        onOpen={open}
        describeDay={describeDay}
      />
    </WrappedProvider>
  );
}
