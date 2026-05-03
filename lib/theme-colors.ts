// Per-theme signature colour. Each theme deterministically draws one
// hue from a kind-appropriate spectrum:
//
//   • concerns → 12 jewel-tone WARM colours (yellows, ambers, reds,
//     and a couple of muted greens). No orange / pink / coral —
//     coral is reserved for platform identity.
//   • visions  → 12 cool colours (greens, blues, purples). No teal —
//     teal is reserved for system selection states.
//
// Each colour ships three variants so the same identity can flow
// through multiple visual contexts:
//   - soft   → atmospheric halos and the small dot on the theme card
//   - solid  → the saturated pin body (holds white text)
//   - deep   → selected-ring shadow + active border tint

const WARM_SPECTRUM = [
  { name: "lemon", soft: "rgba(252, 232, 122, 0.6)", solid: "#F5D547", deep: "#C4A82E" },
  { name: "amber", soft: "rgba(255, 196, 84, 0.6)", solid: "#F0A933", deep: "#C68820" },
  { name: "gold", soft: "rgba(245, 184, 60, 0.6)", solid: "#E8A41C", deep: "#B7800F" },
  { name: "mustard", soft: "rgba(220, 174, 56, 0.6)", solid: "#C99F26", deep: "#9C7A14" },
  { name: "ochre", soft: "rgba(204, 142, 40, 0.55)", solid: "#B07820", deep: "#7E5612" },
  { name: "honey", soft: "rgba(232, 156, 64, 0.6)", solid: "#D38530", deep: "#A0641E" },
  { name: "brick", soft: "rgba(196, 92, 76, 0.55)", solid: "#A8412F", deep: "#7A2C1F" },
  { name: "ruby", soft: "rgba(208, 76, 92, 0.55)", solid: "#B0344C", deep: "#82213A" },
  { name: "wine", soft: "rgba(160, 60, 88, 0.55)", solid: "#8B2A4A", deep: "#5F1832" },
  { name: "garnet", soft: "rgba(176, 56, 64, 0.55)", solid: "#921F2C", deep: "#65141E" },
  { name: "chartreuse", soft: "rgba(204, 220, 84, 0.6)", solid: "#B5C939", deep: "#869623" },
  { name: "olive", soft: "rgba(168, 176, 76, 0.55)", solid: "#8A9528", deep: "#606818" },
] as const;

const COOL_SPECTRUM = [
  { name: "mint", soft: "rgba(168, 230, 207, 0.65)", solid: "#5DC9A0", deep: "#3D9C7A" },
  { name: "jade", soft: "rgba(126, 200, 168, 0.65)", solid: "#3BA47A", deep: "#1F7654" },
  { name: "sage", soft: "rgba(152, 192, 152, 0.6)", solid: "#6FA572", deep: "#4A7C4D" },
  { name: "fern", soft: "rgba(124, 168, 116, 0.6)", solid: "#4F8A4D", deep: "#356132" },
  { name: "emerald", soft: "rgba(80, 184, 124, 0.6)", solid: "#1F8E5A", deep: "#0F6740" },
  { name: "sky", soft: "rgba(164, 212, 255, 0.65)", solid: "#5BA8E5", deep: "#347AB0" },
  { name: "ocean", soft: "rgba(120, 168, 224, 0.6)", solid: "#3373B8", deep: "#1F4F84" },
  { name: "periwinkle", soft: "rgba(184, 192, 240, 0.65)", solid: "#6F7DD9", deep: "#4754A8" },
  { name: "indigo", soft: "rgba(132, 140, 220, 0.6)", solid: "#4951B8", deep: "#2D3489" },
  { name: "lavender", soft: "rgba(212, 181, 255, 0.65)", solid: "#9678D5", deep: "#6E52A8" },
  { name: "violet", soft: "rgba(176, 132, 220, 0.6)", solid: "#7B4DBA", deep: "#553089" },
  { name: "plum", soft: "rgba(160, 112, 180, 0.55)", solid: "#763C92", deep: "#4F2266" },
] as const;

export interface ThemeColor {
  name: string;
  soft: string; // atmospheric halo / card dot — translucent
  solid: string; // pin body — saturated, holds white text
  deep: string; // shadows + active borders
}

// Deterministic djb2-ish hash → unsigned int. Determinism is the only
// thing that matters; collision distribution across 12 buckets is fine
// for typical theme names.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getThemeColor(
  themeName: string,
  kind: "concern" | "vision",
): ThemeColor {
  const palette = kind === "concern" ? WARM_SPECTRUM : COOL_SPECTRUM;
  const index = hashString(themeName) % palette.length;
  return palette[index];
}
