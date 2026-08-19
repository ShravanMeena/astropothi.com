// Keys must match GLOBAL_COLORS in src/backend/horoscope/compute-highlights.ts exactly — many names ("Sea Green", "Rose Gold") aren't valid CSS named colors.

export const LUCKY_COLOR_HEX = {
  Red:            "#dc2626",
  Crimson:        "#dc143c",
  Coral:          "#ff7f50",
  Maroon:         "#800000",
  Scarlet:        "#ff2400",
  Orange:         "#f97316",
  Saffron:        "#f4c430",
  Amber:          "#ffbf00",
  Yellow:         "#facc15",
  Gold:           "#d4af37",
  Mustard:        "#ffdb58",
  Green:          "#16a34a",
  "Emerald Green":"#50c878",
  "Forest Green": "#228b22",
  "Sea Green":    "#2e8b57",
  Olive:          "#808000",
  Blue:           "#2563eb",
  "Sky Blue":     "#87ceeb",
  Turquoise:      "#40e0d0",
  "Electric Blue":"#7df9ff",
  Indigo:         "#4b0082",
  Navy:           "#001f54",
  Purple:         "#7e22ce",
  Violet:         "#7f00ff",
  Lavender:       "#b497d6",
  Pink:           "#ec4899",
  "Rose Gold":    "#b76e79",
  Peach:          "#ffcba4",
  White:          "#ffffff",
  Ivory:          "#fffff0",
  Cream:          "#fffdd0",
  Pearl:          "#f0ead6",
  Silver:         "#c0c0c0",
  Brown:          "#8b4513",
  Beige:          "#f5f5dc",
  Taupe:          "#483c32",
  Chocolate:      "#7b3f00",
  Black:          "#111111",
  Charcoal:       "#36454f"
};

export function luckyColorHex(name) {
  return LUCKY_COLOR_HEX[name] ?? "#cccccc";
}
