import type { CSSProperties } from "react";

// On-photo dialogs (concern composer, sticky composer, marker hover
// popovers) default to opening ABOVE their anchor marker. Near the
// right edge that visually overlaps the planner question rail, even
// when z-index hierarchy keeps them on top — and near the top edge a
// popover above the marker overflows the viewport. This helper picks
// a placement that keeps the dialog inside the photo and away from
// the right rail.
//
// `xPercent` / `yPercent` are 0–100 photo-relative coordinates (the
// same percentages the markers use for their CSS `left`/`top`).

export type PopoverPlacement = "top" | "bottom" | "left";

const RIGHT_EDGE_THRESHOLD = 65;
const TOP_EDGE_THRESHOLD = 25;

export function pickPopoverPlacement(
  xPercent: number,
  yPercent: number,
): PopoverPlacement {
  if (xPercent > RIGHT_EDGE_THRESHOLD) return "left";
  if (yPercent < TOP_EDGE_THRESHOLD) return "bottom";
  return "top";
}

export function getPopoverContainerStyle(
  placement: PopoverPlacement,
  gap = 14,
): CSSProperties {
  switch (placement) {
    case "left":
      return {
        position: "absolute",
        right: `calc(100% + ${gap}px)`,
        left: "auto",
        top: "50%",
        transform: "translateY(-50%)",
      };
    case "bottom":
      return {
        position: "absolute",
        left: "50%",
        top: `calc(100% + ${gap}px)`,
        bottom: "auto",
        transform: "translateX(-50%)",
      };
    case "top":
    default:
      return {
        position: "absolute",
        left: "50%",
        bottom: `calc(100% + ${gap}px)`,
        top: "auto",
        transform: "translateX(-50%)",
      };
  }
}

// Small white diamond pointing back at the marker, tucked against the
// popover edge that faces the marker.
export function getPopoverArrowStyle(
  placement: PopoverPlacement,
  size = 10,
): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    background: "#FFFFFF",
  };
  switch (placement) {
    case "left":
      return {
        ...base,
        right: -size / 2,
        top: "50%",
        transform: "translateY(-50%) rotate(45deg)",
        boxShadow: "2px -2px 4px rgba(0,0,0,0.04)",
      };
    case "bottom":
      return {
        ...base,
        top: -size / 2,
        left: "50%",
        transform: "translateX(-50%) rotate(45deg)",
        boxShadow: "-2px -2px 4px rgba(0,0,0,0.04)",
      };
    case "top":
    default:
      return {
        ...base,
        bottom: -size / 2,
        left: "50%",
        transform: "translateX(-50%) rotate(45deg)",
        boxShadow: "2px 2px 4px rgba(0,0,0,0.04)",
      };
  }
}
