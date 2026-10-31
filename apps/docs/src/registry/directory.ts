import { bigNumberScene, type MarkId, type SceneInstance } from "@react-wrapped/kit";

/*
 * Every Wrapped that plays on Hype Stack, built on this library. The names, colours and lines are Hype Stack's own
 * (its `wrapped-nav.tsx` and `source-pages.ts`), so a card here says what the page it opens says. The scene on each
 * card plays a made-up year in that platform's words: the same opening number its real video leads with.
 */

/** The shelves Hype Stack files its Wrappeds on, in its order. */
export const SHELVES = [
  { id: "code", label: "Code", accent: "in code." },
  { id: "ai", label: "AI", accent: "with AI." },
  { id: "sales", label: "Sales", accent: "in sales." },
  { id: "social", label: "Social", accent: "in public." },
  { id: "search", label: "Search", accent: "in search." },
] as const;

export type ShelfId = (typeof SHELVES)[number]["id"];

/** How a year gets in: a public name, a file the platform exports, or a file the person's own AI writes. */
export type Intake = "lookup" | "file" | "prompt";

export const INTAKES: Readonly<Record<Intake, string>> = {
  lookup: "Just a username",
  file: "One export file",
  prompt: "One prompt to your AI",
};

export interface DirectoryEntry {
  /** The anchor on this page and the scene's key. */
  id: string;
  /** "Claude": the platform, as the card names it. */
  name: string;
  shelf: ShelfId;
  mark: MarkId;
  /** The platform's colour: the stage plays in a palette made from it, the light under the card is it. */
  accent: string;
  /** Brands whose logo is black and white. Their mark takes the text colour, not the accent. */
  plain?: boolean;
  /** Where it lives on hype-stack.dev. */
  path: string;
  card: string;
  /** A platform with more than one kind of year, each picked on its page. */
  variants?: readonly string[];
  intake: Intake;
  scene: SceneInstance;
}

/** The opening number of a Wrapped, as a card plays it. */
const opener = (
  id: string,
  props: { eyebrow: string; value: number; suffix?: string; title: string; lede: string; cells?: number },
  variant = 0,
) =>
  bigNumberScene(
    { ...props, title: [props.title], counter: variant === 0 ? "climb" : "slot", variant },
    { key: `directory-${id}`, label: "Total" },
  );

export const DIRECTORY: readonly DirectoryEntry[] = [
  {
    id: "github",
    name: "GitHub",
    shelf: "code",
    mark: "github",
    accent: "#39d353",
    plain: true,
    path: "/wrapped/github",
    card: "Your own year or a repository's: contributions, streaks, stars, and a badge for your profile.",
    variants: ["You", "A repository"],
    intake: "lookup",
    scene: opener("github", {
      eyebrow: "This year you made",
      value: 1687,
      title: "contributions.",
      lede: "Your longest streak ran **41 days**.",
      cells: 41,
    }),
  },
  {
    id: "npm",
    name: "npm",
    shelf: "code",
    mark: "npm",
    accent: "#cb3837",
    path: "/wrapped/npm",
    card: "Downloads, the best month and the biggest day, for any public package or everything one maintainer ships.",
    intake: "lookup",
    scene: opener(
      "npm",
      {
        eyebrow: "In the last 12 months it was downloaded",
        value: 184,
        suffix: "K",
        title: "times.",
        lede: "**31K** of them in your best month.",
      },
      1,
    ),
  },
  {
    id: "claude",
    name: "Claude",
    shelf: "ai",
    mark: "claude",
    accent: "#d97757",
    path: "/wrapped/claude-code",
    card: "Your Claude Code usage or your Claude chats: prompts, tokens, messages and your type.",
    variants: ["Claude Code", "Chats"],
    intake: "prompt",
    scene: opener("claude", {
      eyebrow: "In the last 12 months you sent",
      value: 18204,
      title: "prompts.",
      lede: "Across **412** sessions in **23** projects.",
    }),
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    shelf: "ai",
    mark: "openai",
    accent: "#10a37f",
    path: "/wrapped/codex",
    card: "Your ChatGPT chats or your Codex usage: messages, prompts, tokens, your busiest day and your type.",
    variants: ["Codex", "Chats"],
    intake: "prompt",
    scene: opener(
      "chatgpt",
      {
        eyebrow: "Over the last year you asked",
        value: 6140,
        title: "messages.",
        lede: "The longest conversation ran **188** messages.",
      },
      1,
    ),
  },
  {
    id: "cursor",
    name: "Cursor",
    shelf: "ai",
    mark: "cursor",
    accent: "#e8e8e3",
    plain: true,
    path: "/wrapped/cursor",
    card: "Requests, the models you leaned on, lines written and your coder type. Read from your own machine.",
    intake: "prompt",
    scene: opener("cursor", {
      eyebrow: "In the last 12 months you made",
      value: 9312,
      title: "requests.",
      lede: "The agent wrote **212K** lines with you.",
    }),
  },
  {
    id: "gemini",
    name: "Gemini",
    shelf: "ai",
    mark: "gemini",
    accent: "#4e8cf7",
    path: "/wrapped/gemini",
    card: "Messages, your busiest day, the hours you chat and your prompter type. Gemini makes the file from one prompt.",
    intake: "prompt",
    scene: opener(
      "gemini",
      {
        eyebrow: "In the last 12 months you sent",
        value: 2875,
        title: "messages.",
        lede: "About **38** words in every one.",
      },
      1,
    ),
  },
  {
    id: "stripe",
    name: "Stripe",
    shelf: "sales",
    mark: "stripe",
    accent: "#635bff",
    path: "/wrapped/stripe",
    card: "Sales, your best month, your biggest day and your founder type. Revenue only if you want it shown.",
    intake: "file",
    scene: opener("stripe", {
      eyebrow: "In the last 12 months you made",
      value: 1240,
      title: "sales.",
      lede: "To **986** customers in **31** countries.",
      cells: 12,
    }),
  },
  {
    id: "lemon-squeezy",
    name: "Lemon Squeezy",
    shelf: "sales",
    mark: "lemon-squeezy",
    accent: "#ffc233",
    path: "/wrapped/lemon-squeezy",
    card: "Sales, your best month, your biggest day and your founder type. Revenue only if you want it shown.",
    intake: "file",
    scene: opener(
      "lemon-squeezy",
      {
        eyebrow: "Over the last year you closed",
        value: 864,
        title: "sales.",
        lede: "Your biggest day brought **47** of them.",
      },
      1,
    ),
  },
  {
    id: "polar",
    name: "Polar",
    shelf: "sales",
    mark: "polar",
    accent: "#0062ff",
    path: "/wrapped/polar",
    card: "Sales, your best month, your biggest day and your founder type. Revenue only if you want it shown.",
    intake: "file",
    scene: opener("polar", {
      eyebrow: "In the last 12 months you made",
      value: 392,
      title: "sales.",
      lede: "Best month: **November**, by a mile.",
    }),
  },
  {
    id: "x",
    name: "X",
    shelf: "social",
    mark: "x",
    accent: "#e7e9ea",
    plain: true,
    path: "/wrapped/x",
    card: "Posts, replies, likes, your best post and your poster type. From your X archive.",
    intake: "file",
    scene: opener(
      "x",
      {
        eyebrow: "In the last 12 months you posted",
        value: 3418,
        title: "times.",
        lede: "Your best post alone got **12K** likes.",
      },
      1,
    ),
  },
  {
    id: "bluesky",
    name: "Bluesky",
    shelf: "social",
    mark: "bluesky",
    accent: "#1185fe",
    path: "/wrapped/bluesky",
    card: "Posts, replies, likes, your best post and your poster type. From your public profile.",
    intake: "lookup",
    scene: opener("bluesky", {
      eyebrow: "Over the last year you wrote",
      value: 1290,
      title: "times.",
      lede: "And **4.2K** likes came back.",
    }),
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    shelf: "social",
    mark: "hacker-news",
    accent: "#ff6600",
    path: "/wrapped/hacker-news",
    card: "Stories, comments, your best thread and your poster type. From your public profile.",
    intake: "lookup",
    scene: opener(
      "hacker-news",
      {
        eyebrow: "In the last 12 months you posted",
        value: 731,
        title: "times.",
        lede: "One thread made the front page for **9 hours**.",
      },
      1,
    ),
  },
  {
    id: "search-console",
    name: "Search Console",
    shelf: "search",
    mark: "search-console",
    accent: "#4285f4",
    path: "/wrapped/search-console",
    card: "Clicks, impressions, top queries, your best month and your biggest day. From the Performance export.",
    intake: "file",
    scene: opener("search-console", {
      eyebrow: "In the last 12 months search sent you",
      value: 48,
      suffix: "K",
      title: "clicks.",
      lede: "From **2.1M** impressions.",
    }),
  },
];
