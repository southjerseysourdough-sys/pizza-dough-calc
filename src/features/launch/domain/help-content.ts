export type HelpTopic = {
  id: string;
  title: string;
  summary: string;
  body: readonly string[];
};

export const PRIVACY_AND_DATA_FACTS = [
  "Saved recipes and Baking Day sessions remain in this browser unless you export them.",
  "Imported JSON is processed locally, and recipe PDFs are generated in the browser.",
  "Shared recipe data is encoded in the URL. Anyone with that URL can read the recipe data.",
  "Clearing browser storage can remove local recipes and sessions. JSON export provides a portable backup.",
  "There is currently no account or cloud synchronization.",
] as const;

export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: "quick-start",
    title: "Quick Start",
    summary: "From size to dough weights.",
    body: [
      "Choose round or pan pizza, enter the size and quantity, then choose instant dry yeast or sourdough starter. Every displayed ingredient weight updates immediately.",
    ],
  },
  {
    id: "dough-loading",
    title: "Dough loading",
    summary: "Dough weight for each square inch.",
    body: [
      "Dough loading controls thickness while preserving the pan or pizza area. Raise it for a thicker result and lower it for a thinner one.",
    ],
  },
  {
    id: "hydration",
    title: "Hydration",
    summary: "Water relative to total formula flour.",
    body: [
      "Hydration changes handling and texture. Flour, technique, and environment all affect what feels workable.",
    ],
  },
  {
    id: "leavening",
    title: "Yeast versus sourdough",
    summary: "Choose instant dry yeast or starter.",
    body: [
      "The beginner path standardizes commercial formulas on instant dry yeast. Sourdough uses ripe starter. Advanced bakers can reveal the hybrid option under More controls without counting starter flour or water twice.",
    ],
  },
  {
    id: "readability",
    title: "Font and text size",
    summary: "Make every screen easier to read.",
    body: [
      "Open Text in the header to choose Atkinson Hyperlegible Next, IBM Plex Sans, or Geist and select standard, comfortable, or large type. The choice stays saved on this device.",
    ],
  },
  {
    id: "starter",
    title: "Starter hydration",
    summary: "Water inside the starter.",
    body: [
      "Starter hydration determines how its weight is divided between flour and water. The calculator includes both in true final hydration.",
    ],
  },
  {
    id: "flour",
    title: "Main dough flour blend",
    summary: "Flour added outside the starter.",
    body: [
      "Blend percentages divide the added flour. Flour already inside a starter stays accounted for separately.",
    ],
  },
  {
    id: "pan-area",
    title: "Measured pan area",
    summary: "Use the interior baking surface.",
    body: [
      "Sheet-pan calculations use usable interior length and width. Measuring inside the pan avoids counting rolled rims or sloped walls.",
    ],
  },
  {
    id: "steel-fit",
    title: "Baking Steel fit",
    summary: "Keep round dough inside the surface.",
    body: [
      "Fit guidance compares pizza diameter with the selected surface. It is guidance; the dough calculation itself remains based on your chosen diameter.",
    ],
  },
  {
    id: "fermentation",
    title: "Fermentation planning",
    summary: "Forward from mix or backward from bake.",
    body: [
      "Forward planning starts at mix time. Backward planning works from the bake time you need and is usually the quickest way to build a schedule. Times are planning guidance, not universal fermentation predictions.",
    ],
  },
  {
    id: "baking-day",
    title: "Baking Day",
    summary: "A kitchen-first execution view.",
    body: [
      "Baking Day keeps stage notes and timestamp-based timers in this browser. Prepare it for offline use before the connection drops when possible.",
    ],
  },
  {
    id: "saving",
    title: "Saving and sharing",
    summary: "Local library and URL restoration.",
    body: [
      "Saved recipes stay on this device. Share links carry recipe data in the URL and are not permanent hosted records.",
    ],
  },
  {
    id: "local-storage",
    title: "Privacy and local data",
    summary: "What stays in this browser.",
    body: PRIVACY_AND_DATA_FACTS,
  },
  {
    id: "offline",
    title: "Offline limitations",
    summary: "Prepared sessions, not a permanent guarantee.",
    body: [
      "A prepared Baking Day can keep working after network loss, including notes, stage completion, and open-page timers. Browsers may evict cached files or local storage, and powering off a device stops browser execution.",
    ],
  },
  {
    id: "printing",
    title: "Printing and PDF",
    summary: "Dedicated print view and selectable text.",
    body: [
      "Print uses a dedicated recipe sheet. PDF generation happens locally and is loaded only when requested.",
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    summary: "Recover without erasing your library.",
    body: [
      "Reload the current screen first. An invalid share URL can be removed without changing saved recipes. Data Management separates cache cleanup, draft reset, recipes, and Baking Day sessions.",
    ],
  },
] as const;

export function findHelpTopic(id: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.id === id);
}
