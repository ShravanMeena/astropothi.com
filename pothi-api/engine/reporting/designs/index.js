// ─────────────────────────────────────────────────────────────────────────────
// DESIGNS — three genuinely different books.
//
// A design is the STRUCTURE of the document: what pages exist, how a chapter
// opens, how many columns the body runs in, what furniture each page carries.
// Colour lives separately in ../palettes. Any design pairs with any palette.
//
// Two designs must read like two different publishers, not one book recoloured.
// ─────────────────────────────────────────────────────────────────────────────

export const DESIGNS = {
  classic: {
    id: "classic",
    name: { en: "Classic", hi: "पारंपरिक" },
    tagline: { en: "Traditional Vedic layout, economical to print",
               hi: "पारंपरिक वैदिक शैली, छपाई में किफ़ायती" },
    spec: {
      cover: "banner",            // deity, banner band, profile chips
      frontMatter: ["details", "chart", "toc"],
      chapterOpen: "inline",      // chapters flow, several to a page
      columns: 1,
      dropCap: false,
      header: "rule",
      footer: "line",
      border: "hairline",
      // The frame is the ornament — corner brackets on top of it read as stray marks.
      ornament: "none",
      divider: "rule",
      density: "normal",
      summaryStyle: "callout",
      advisoryStyle: "note",
      // Reading craft. Measure is the fraction of the text column actually used
      // for body copy: unrestrained A4 runs ~95 characters a line, which is far
      // past the 65–75 that reads comfortably.
      bodyFace: "serif",
      headingFace: "serif",
      align: "justify",
      measure: 1,
      margin: 74,
      typeScale: 1,
      backMatter: ["disclaimer"]
    }
  },

  editorial: {
    id: "editorial",
    name: { en: "Editorial", hi: "आधुनिक" },
    tagline: { en: "Modern magazine layout, generous whitespace",
               hi: "आधुनिक पत्रिका शैली, खुली जगह" },
    spec: {
      cover: "editorial",         // typographic, no deity art, huge name
      frontMatter: ["profileGrid", "chart", "toc"],
      chapterOpen: "flow",        // columns run continuously, as a magazine does
      columns: 2,                 // two-column body — the magazine tell
      dropCap: false,
      header: "minimal",
      footer: "minimal",
      border: "none",
      ornament: "none",
      divider: "space",
      density: "airy",
      summaryStyle: "lede",       // large intro paragraph, not a box
      advisoryStyle: "rule",
      bodyFace: "sans",
      headingFace: "sans",
      // Narrow columns must never be justified without hyphenation — the word
      // gaps tear rivers through the text.
      align: "left",
      measure: 1,
      margin: 58,
      typeScale: 1.02,
      backMatter: ["disclaimer"]
    }
  },

  heritage: {
    id: "heritage",
    name: { en: "Heritage", hi: "राजसी" },
    tagline: { en: "Ornate presentation edition with chapter title pages",
               hi: "अलंकृत संस्करण, हर अध्याय का अपना पृष्ठ" },
    spec: {
      cover: "heritage",          // full frame, corner medallions, deity
      frontMatter: ["blessing", "details", "chart", "toc"],
      chapterOpen: "titlepage",   // a dedicated title page per chapter
      columns: 1,
      dropCap: true,              // decorative initial on the first paragraph
      header: "ornate",
      footer: "ornate",
      border: "double",
      ornament: "medallion",
      divider: "ornament",
      density: "airy",
      summaryStyle: "panel",
      advisoryStyle: "note",
      bodyFace: "serif",
      headingFace: "serif",
      align: "justify",
      measure: 1,
      margin: 86,
      typeScale: 1.05,
      backMatter: ["colophon", "disclaimer"]
    }
  }
};

export const DESIGN_IDS = Object.keys(DESIGNS);
export const DEFAULT_DESIGN = "classic";
export const getDesign = (id) => DESIGNS[id] || DESIGNS[DEFAULT_DESIGN];
export const listDesigns = () =>
  DESIGN_IDS.map((id) => {
    const d = DESIGNS[id];
    return {
      id, name: d.name, tagline: d.tagline,
      traits: {
        chapterOpen: d.spec.chapterOpen,
        columns: d.spec.columns,
        ornament: d.spec.ornament !== "none",
        density: d.spec.density
      }
    };
  });
