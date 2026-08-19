// Design (structure) + Palette (colour) → one style object for the renderer.
import { getDesign } from "./designs/index.js";
import { getPalette } from "./palettes/index.js";

const DENSITY = {
  compact: { margin: 46, lead: 2.2, gapPara: 5.5, gapSec: 15, body: 9.8 },
  normal:  { margin: 54, lead: 3.0, gapPara: 6.5, gapSec: 20, body: 10.3 },
  airy:    { margin: 62, lead: 3.8, gapPara: 8,   gapSec: 26, body: 10.6 }
};

export function composeStyle(designId, paletteId) {
  const design = getDesign(designId);
  const palette = getPalette(paletteId);
  return {
    designId: design.id,
    paletteId: palette.id,
    name: design.name,
    spec: design.spec,
    P: palette.colors,
    D: { ...(DENSITY[design.spec.density] || DENSITY.normal),
         ...(design.spec.margin ? { margin: design.spec.margin } : {}) },
    scale: design.spec.typeScale || 1
  };
}
