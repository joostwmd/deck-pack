import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import PptxGenJS from "pptxgenjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputDir = join(scriptDir, "../public/mock-slides");

const slides = [
  {
    file: "title-hero",
    title: "Title Hero",
    subtitle: "Cover slide",
    color: "1E3A5F",
    layout: "LAYOUT_WIDE",
  },
  {
    file: "agenda-simple",
    title: "Simple Agenda",
    subtitle: "Outline your topics",
    color: "0F766E",
    layout: "LAYOUT_WIDE",
  },
  {
    file: "two-column",
    title: "Two Column Content",
    subtitle: "Compare two ideas",
    color: "334155",
    layout: "LAYOUT_WIDE",
  },
  {
    file: "chart-focus",
    title: "Chart Focus",
    subtitle: "Highlight key metrics",
    color: "7C3AED",
    layout: "LAYOUT_WIDE",
  },
  {
    file: "team-grid",
    title: "Team Grid",
    subtitle: "Introduce your team",
    color: "B45309",
    layout: "LAYOUT_WIDE",
  },
  {
    file: "closing-cta",
    title: "Closing CTA",
    subtitle: "End with a clear next step",
    color: "BE123C",
    layout: "LAYOUT_WIDE",
  },
  {
    file: "classic-title",
    title: "Classic Title",
    subtitle: "Formal 4:3 cover",
    color: "1D4ED8",
    layout: "LAYOUT_4x3",
  },
  {
    file: "timeline",
    title: "Timeline Roadmap",
    subtitle: "Plan milestones over time",
    color: "047857",
    layout: "LAYOUT_WIDE",
  },
];

mkdirSync(outputDir, { recursive: true });

for (const slide of slides) {
  const pptx = new PptxGenJS();
  pptx.layout = slide.layout;

  const deckSlide = pptx.addSlide();
  deckSlide.background = { color: slide.color };
  deckSlide.addText(slide.title, {
    x: 0.5,
    y: slide.layout === "LAYOUT_4x3" ? 2.2 : 2.5,
    w: slide.layout === "LAYOUT_4x3" ? 9 : 12,
    h: 1,
    fontSize: slide.layout === "LAYOUT_4x3" ? 36 : 44,
    color: "FFFFFF",
    bold: true,
  });
  deckSlide.addText(slide.subtitle, {
    x: 0.5,
    y: slide.layout === "LAYOUT_4x3" ? 3.1 : 3.6,
    w: slide.layout === "LAYOUT_4x3" ? 9 : 12,
    h: 0.6,
    fontSize: 20,
    color: "E2E8F0",
  });

  await pptx.writeFile({ fileName: join(outputDir, `${slide.file}.pptx`) });
}

console.log(`Generated ${slides.length} mock slide files in ${outputDir}`);
