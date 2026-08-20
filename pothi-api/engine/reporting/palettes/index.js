// PALETTES — colour only. Any palette pairs with any design.

const P = (o) => ({
  ink: "#241A12", inkSoft: "#6B5B4D", accent: "#C2410C", accentSoft: "#FDF2E2",
  rule: "#D9B382", tableHead: "#F7E3C4", tableAlt: "#FBF6EE",
  chartLine: "#B5651D", paper: "#FFFFFF",
  coverBg: "#FFFBF3", coverInk: "#241A12", coverAccent: "#C2410C", ...o
});

export const PALETTES = {
  saffron: { id: "saffron", name: { en: "Saffron", hi: "केसरी" }, colors: P({}) },

  crimson: { id: "crimson", name: { en: "Crimson", hi: "विवाह लाल" }, colors: P({
    ink: "#3A0B12", inkSoft: "#7A3B44", accent: "#A4161A", accentSoft: "#FDEBEC",
    rule: "#C9A227", tableHead: "#F7DCDE", tableAlt: "#FDF5F5", chartLine: "#A4161A",
    coverBg: "#8C1116", coverInk: "#FFF4E6", coverAccent: "#E8C46A" }) },

  indigo: { id: "indigo", name: { en: "Indigo", hi: "नीलकंठ" }, colors: P({
    ink: "#1B2138", inkSoft: "#5B6488", accent: "#2A3A78", accentSoft: "#EEF1FB",
    rule: "#C3CAE4", tableHead: "#E7ECF9", tableAlt: "#F7F9FE", chartLine: "#2A3A78",
    coverBg: "#0E1430", coverInk: "#F2F5FF", coverAccent: "#8FA5E8" }) },

  emerald: { id: "emerald", name: { en: "Emerald", hi: "हरितम्" }, colors: P({
    ink: "#12281A", inkSoft: "#4F6B57", accent: "#1B5E20", accentSoft: "#E9F3EA",
    rule: "#A8C4AC", tableHead: "#DFEDE1", tableAlt: "#F6FAF6", chartLine: "#1B5E20",
    coverBg: "#0F2E18", coverInk: "#EAF6EC", coverAccent: "#7DC98A" }) },

  gold: { id: "gold", name: { en: "Black & Gold", hi: "स्वर्ण" }, colors: P({
    ink: "#1A1712", inkSoft: "#7A6A50", accent: "#8A6A1F", accentSoft: "#FBF3DF",
    rule: "#C9A227", tableHead: "#F3E7C6", tableAlt: "#FCF9F0", chartLine: "#8A6A1F",
    coverBg: "#0B0A08", coverInk: "#E9D08A", coverAccent: "#C9A227" }) },

  parchment: { id: "parchment", name: { en: "Parchment", hi: "पोथी" }, colors: P({
    ink: "#3B2A18", inkSoft: "#7C6748", accent: "#9B2226", accentSoft: "#F6EEDF",
    rule: "#C4A97C", tableHead: "#EFE2C8", tableAlt: "#FAF4E8", chartLine: "#7C5A33",
    paper: "#FDFAF2", coverBg: "#EFE0C2", coverInk: "#3B2A18", coverAccent: "#9B2226" }) },

  slate: { id: "slate", name: { en: "Slate", hi: "श्वेत" }, colors: P({
    ink: "#111827", inkSoft: "#6B7280", accent: "#334155", accentSoft: "#F1F5F9",
    rule: "#D8DEE7", tableHead: "#F1F5F9", tableAlt: "#FAFBFC", chartLine: "#475569",
    coverBg: "#FFFFFF", coverInk: "#0F172A", coverAccent: "#334155" }) },

  // Named for the kalava — the red thread tied at a wedding, and the reason
  // this is a rose rather than another crimson. Crimson (विवाह लाल) was the
  // obvious choice for a couples book and is already the Laal Kitaab's, and two
  // red spines on a seven-book shelf is how a shelf stops reading as a shelf.
  // Lighter ground than every other palette here: this one is a gift, and a
  // gift should not open like a reference volume.
  kalava: { id: "kalava", name: { en: "Kalava", hi: "कलावा" }, colors: P({
    ink: "#2B1620", inkSoft: "#7A5566", accent: "#C2456A", accentSoft: "#FBEDF1",
    rule: "#E3B7C4", tableHead: "#F7DEE6", tableAlt: "#FDF6F8", chartLine: "#C2456A",
    paper: "#FFFCFD", coverBg: "#F4DCE3", coverInk: "#2B1620", coverAccent: "#A8325A" }) }
};

export const PALETTE_IDS = Object.keys(PALETTES);
export const DEFAULT_PALETTE = "saffron";
export const getPalette = (id) => PALETTES[id] || PALETTES[DEFAULT_PALETTE];
export const listPalettes = () =>
  PALETTE_IDS.map((id) => {
    const p = PALETTES[id];
    return { id, name: p.name, swatch: [p.colors.coverBg, p.colors.accent, p.colors.rule] };
  });

/** Compose the render-time style object the renderer consumes. */
export function composeStyle(designId, paletteId) {
  const { getDesign } = arguments.length ? {} : {};
  return null; // replaced below by style.js
}
