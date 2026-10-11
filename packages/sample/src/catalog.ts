import { formatShort, languagesInUse, nightShare, type SampleYear } from "./year";
import { PIXEL_ART, type PixelArt, type Rarity } from "@react-wrapped/core";

/*
 * Everything a year on Orbit can turn out to be: the types a person can be given, the achievements a year can earn,
 * and the easter eggs a scan can turn up. Plain data plus the test each one is handed out by, so a page can list
 * the whole catalog without rolling anything.
 */

interface CatalogEntry {
  id: string;
  name: string;
  rarity: Rarity;
  /** What it means, said warmly. The one description of a scene that has no chart to explain. */
  about: string;
  /** The short line on a card. A function when it quotes the year's own numbers. */
  line: string | ((year: SampleYear) => string);
  art: PixelArt;
}

export interface SampleTypeEntry extends CatalogEntry {
  /** Whether this year reads as this type. The first type that fits is the one a year gets. */
  fits: (year: SampleYear) => boolean;
}

export interface SampleAchievementEntry extends CatalogEntry {
  earned: (year: SampleYear) => boolean;
}

export interface SampleEggEntry extends CatalogEntry {
  /** How many scans in a hundred turn it up. The six add up to a hundred: every scan finds exactly one. */
  chance: number;
}

export interface SampleCatalog {
  /** Hardest to be first. The last one fits every year. */
  types: readonly SampleTypeEntry[];
  achievements: readonly SampleAchievementEntry[];
  eggs: readonly SampleEggEntry[];
}

const fmt = (count: number) => count.toLocaleString("en-US");
const pct = (share: number) => `${Math.round(share * 100)}%`;

/** How much of the year's commits went into its busiest repository, 0 to 1. */
const homeShare = (year: SampleYear) => (year.repositories[0]?.commits ?? 0) / Math.max(1, year.totals.commits);
const growth = (year: SampleYear) => year.totals.contributions / Math.max(1, year.previous.contributions) - 1;
const normalDay = (year: SampleYear) => year.totals.contributions / Math.max(1, year.totals.activeDays);

export const SAMPLE_CATALOG: SampleCatalog = {
  types: [
    {
      id: "marathoner",
      name: "The Marathoner",
      rarity: "epic",
      art: PIXEL_ART.mountain,
      fits: (year) => year.streak.length >= 30,
      line: (year) => `${year.streak.length} days without a gap. You don't start things, you keep them going.`,
      about: "A long streak is never about one big day. It is about not letting a single one slip by.",
    },
    {
      id: "night-pilot",
      name: "The Night Pilot",
      rarity: "epic",
      art: PIXEL_ART.moon,
      fits: (year) => nightShare(year) >= 0.25,
      line: "Your best hours start when everyone else has logged off.",
      about: "The house is quiet, the chat is quiet, and the work finally gets all of your attention.",
    },
    {
      id: "sprinter",
      name: "The Sprinter",
      rarity: "rare",
      art: PIXEL_ART.bolt,
      fits: (year) => year.busiest.count >= normalDay(year) * 10,
      line: (year) => `${year.busiest.count} contributions in a single day. When you go, you go.`,
      about: "Calm weeks, then a day that does the work of five. It is a rhythm, and it is yours.",
    },
    {
      id: "weekender",
      name: "The Weekender",
      rarity: "rare",
      art: PIXEL_ART.palm,
      fits: (year) => year.weekendShare >= 0.3,
      line: "Saturdays are for side projects, and you have a few.",
      about: "The week belongs to the job. The weekend belongs to the thing you actually wanted to build.",
    },
    {
      id: "cartographer",
      name: "The Cartographer",
      rarity: "rare",
      art: PIXEL_ART.globe,
      fits: (year) => languagesInUse(year) >= 4,
      line: (year) => `${languagesInUse(year)} languages in real use. You know your way around.`,
      about: "You do not have a favorite language so much as a map of them, and you know which road to take.",
    },
    {
      id: "metronome",
      name: "The Metronome",
      rarity: "common",
      art: PIXEL_ART.check,
      fits: () => true,
      line: "Monday to Friday, like clockwork.",
      about: "No drama and no heroics. You show up on working days and the work gets done.",
    },
  ],
  achievements: [
    {
      id: "all-weather",
      name: "All Weather",
      rarity: "legendary",
      art: PIXEL_ART.crown,
      earned: (year) => year.totals.activeDays >= 300,
      line: (year) => `${year.totals.activeDays} active days. Rain or shine, you were there.`,
      about: "Three hundred days of showing up is most of a year. Whatever else was going on, the work kept moving.",
    },
    {
      id: "long-haul",
      name: "Long Haul",
      rarity: "epic",
      art: PIXEL_ART.mountain,
      earned: (year) => year.streak.length >= 30,
      line: (year) => `${year.streak.length} days in a row. Your calendar has a solid wall in it.`,
      about: "A month or more without one day off. A habit like that is built a day at a time, and you built it.",
    },
    {
      id: "second-wind",
      name: "Second Wind",
      rarity: "epic",
      art: PIXEL_ART.phoenix,
      earned: (year) => year.previous.contributions >= 100 && growth(year) >= 0.5,
      line: (year) => `Up ${pct(growth(year))} on last year. Something clicked.`,
      about: "Last year was the warm-up. This is the one where you found your pace.",
    },
    {
      id: "clean-sheet",
      name: "Clean Sheet",
      rarity: "epic",
      art: PIXEL_ART.calendar,
      earned: (year) => year.fullMonth !== null,
      line: (year) => `Every single day of ${year.fullMonth?.name ?? "a month"}. Not one square left empty.`,
      about: "A whole calendar month with something on every day of it. That takes a plan, or stubbornness, or both.",
    },
    {
      id: "launch-day",
      name: "Launch Day",
      rarity: "rare",
      art: PIXEL_ART.rocket,
      earned: (year) => year.busiest.count >= 40,
      line: (year) =>
        `${year.busiest.count} contributions on ${formatShort(year.busiest.date)}. Something big went out.`,
      about: "One day did the work of a week. Whatever went out that day, we hope it landed well.",
    },
    {
      id: "four-digits",
      name: "Four Digits",
      rarity: "rare",
      art: PIXEL_ART.trophy,
      earned: (year) => year.totals.contributions >= 1000,
      line: (year) => `${fmt(year.totals.contributions)} contributions. The counter needed a comma.`,
      about: "A thousand contributions is close to three a day, every day, for a year. You went past it.",
    },
    {
      id: "friday-shipper",
      name: "Friday Shipper",
      rarity: "rare",
      art: PIXEL_ART.flame,
      earned: (year) => year.activeFridays >= 40,
      line: (year) => `${year.activeFridays} Fridays with something shipped. Bold.`,
      about: "They say never ship on a Friday. You did it most weeks, and the weekends survived.",
    },
    {
      id: "home-base",
      name: "Home Base",
      rarity: "rare",
      art: PIXEL_ART.plant,
      earned: (year) => homeShare(year) >= 0.4,
      line: (year) => `${pct(homeShare(year))} of your commits went into ${year.repositories[0]?.name ?? "one place"}.`,
      about: "One repository got most of your year. Things grow when somebody keeps coming back to them.",
    },
    {
      id: "night-watch",
      name: "Night Watch",
      rarity: "rare",
      art: PIXEL_ART.moon,
      earned: (year) => nightShare(year) >= 0.15,
      line: (year) => `${pct(nightShare(year))} of your commits came in after 10 pm.`,
      about: "Some problems only give in after dark. You stayed up for them, more than once.",
    },
    {
      id: "second-pair",
      name: "Second Pair of Eyes",
      rarity: "rare",
      art: PIXEL_ART.eye,
      earned: (year) => year.totals.reviews >= 50,
      line: (year) => `${fmt(year.totals.reviews)} reviews given. Somebody's bug never made it out.`,
      about:
        "Reviewing is the quiet half of the job. You read other people's work with care, and it got better for it.",
    },
    {
      id: "shore-leave",
      name: "Shore Leave",
      rarity: "common",
      art: PIXEL_ART.palm,
      earned: (year) => year.quiet.length >= 7,
      line: (year) => `${year.quiet.length} days away. The code was still there when you got back.`,
      about: "A real break between two days of work. You came back, and you were probably better for it.",
    },
    {
      id: "many-tongues",
      name: "Many Tongues",
      rarity: "common",
      art: PIXEL_ART.globe,
      earned: (year) => languagesInUse(year) >= 3,
      line: (year) => `${languagesInUse(year)} languages in real use. You pick the tool for the job.`,
      about: "More than one language got real work out of you this year. Switching between them is a skill of its own.",
    },
  ],
  eggs: [
    {
      id: "rubber-duck",
      name: "Rubber Duck",
      rarity: "common",
      art: PIXEL_ART.duck,
      chance: 30,
      line: "It heard every bug you explained out loud.",
      about: "It sat on your desk and listened to every bug you explained out loud. Half of them fixed themselves.",
    },
    {
      id: "bottomless-mug",
      name: "Bottomless Mug",
      rarity: "common",
      art: PIXEL_ART.mug,
      chance: 26,
      line: "Never empty for long. Neither was your branch list.",
      about: "Somewhere near your keyboard there is a mug that was never empty for long. This year ran on it.",
    },
    {
      id: "lap-cat",
      name: "Lap Cat",
      rarity: "rare",
      art: PIXEL_ART.cat,
      chance: 18,
      line: "Walked across the keyboard. Improved the commit.",
      about:
        "It sleeps on the warm laptop and walks over the keys at the worst moment. Some commits were better for it.",
    },
    {
      id: "night-owl",
      name: "Night Owl",
      rarity: "rare",
      art: PIXEL_ART.owl,
      chance: 14,
      line: "Still awake when the build finally went green.",
      about: "It keeps you company on the late ones and never asks why you are still up. It saw the build go green.",
    },
    {
      id: "trail-fox",
      name: "Trail Fox",
      rarity: "epic",
      art: PIXEL_ART.fox,
      chance: 8,
      line: "Knows the shortcut through any codebase.",
      about: "Quick, quiet and always a step ahead. It found the shortcut through every codebase you opened this year.",
    },
    {
      id: "comet-dragon",
      name: "Comet Dragon",
      rarity: "legendary",
      art: PIXEL_ART.dragon,
      chance: 4,
      line: "It passes once in a great while. It passed over your year.",
      about:
        "It crosses the sky over Orbit once in a great while and lands where it likes. This time it picked your year.",
    },
  ],
};
