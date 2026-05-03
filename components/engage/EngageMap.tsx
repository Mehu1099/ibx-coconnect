"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ExploreLocation } from "@/lib/explore-locations";
import type { LocationCount } from "@/lib/use-engage-data";

interface EngageMapProps {
  locations: ExploreLocation[];
  locationCounts: LocationCount[];
  selectedLocationId: string | null;
  onLocationClick: (id: string) => void;
  // Set of location ids belonging to the currently-selected theme.
  // When non-empty, those pins burn in the theme's saturated signature
  // (white-ringed and surrounded by a soft atmospheric halo) and the
  // rest fade dramatically so the theme reads at-a-glance.
  selectedThemeStations?: string[];
  selectedThemeColor?: {
    solid: string;
    soft: string;
    deep: string;
  } | null;
}

// Some pins have a close vertical neighbor below (e.g. 02 sits just
// above 04) and their default "below the pin" count tag would overlap
// the neighbor. Listing those ids here flips the tag to render ABOVE
// the pin instead. Add other ids if more collisions appear.
const TAGS_ABOVE = new Set<string>(["02"]);

// Map is now contained within a defined panel between the side rails
// (rather than full-bleed under them) so every pin is fully visible
// and clickable. The page-wide cream + paper-grain backdrop lives in
// EngageView; this component only renders the map box itself.
//
// Click-to-clear: clicking the map background (anywhere not on a pin)
// clears `selectedLocationId`. Pins stop event propagation so their
// own onClick keeps working.

export function EngageMap({
  locations,
  locationCounts,
  selectedLocationId,
  onLocationClick,
  selectedThemeStations,
  selectedThemeColor = null,
}: EngageMapProps) {
  // True when any theme is currently driving the map highlight. Used
  // by the per-pin block below to fade non-theme pins and shift theme
  // pins to the saturated signature.
  const themeIsActive =
    !!selectedThemeColor &&
    !!selectedThemeStations &&
    selectedThemeStations.length > 0;
  const themeStationSet = themeIsActive
    ? new Set(selectedThemeStations)
    : null;
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only fire when the click actually hits the map container itself
    // (not bubbled from a pin or a child overlay). Pins also call
    // stopPropagation, so this is belt-and-suspenders.
    if (e.target !== e.currentTarget) return;
    if (selectedLocationId) onLocationClick("");
  };

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        position: "absolute",
        // Leave room for: 70px header (top:90), 340px themes rail + 20px
        // gap + 20px breathing (left:380), 360px voices feed + 20 + 20
        // (right:400), 60px stats strip + 50px clearance (bottom:110).
        top: 90,
        left: 380,
        right: 400,
        bottom: 110,
        background: "#F5F2EB",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(11,29,58,0.04)",
        cursor: selectedLocationId ? "pointer" : "default",
        zIndex: 5,
      }}
    >
      {/* Photo. pointer-events:none so clicks pass through to the
          container's background-click handler. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/explore/axonometric-base.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(245,242,235,0.05) 0%, rgba(245,242,235,0.15) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Density dots — small jittered coral specks near each active
          location, hinting at intensity without crowding the pins. */}
      {locations.map((location) => {
        const count =
          locationCounts.find((c) => c.locationId === location.id)?.total ?? 0;
        if (count === 0) return null;
        const dots = Array.from({ length: Math.min(count, 6) }, (_, i) => {
          const seed = parseInt(location.id, 10) * 31 + i * 17;
          const jx = ((seed * 7) % 11) - 5;
          const jy = ((seed * 13) % 11) - 5;
          return {
            id: `${location.id}-${i}`,
            x: location.x + jx * 0.6,
            y: location.y + jy * 0.6,
            delay: (i * 0.3) % 2,
          };
        });
        return dots.map((d) => (
          <span
            key={d.id}
            aria-hidden
            style={{
              position: "absolute",
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "rgba(244,117,96,0.55)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 4,
              animation: "engageDotBloom 4s ease-in-out infinite",
              animationDelay: `${d.delay}s`,
            }}
          />
        ));
      })}

      {locations.map((location) => {
        const lc = locationCounts.find((c) => c.locationId === location.id);
        const count = lc?.total ?? 0;
        const isSelected = selectedLocationId === location.id;
        const isActive = count > 0;
        const isHot = (lc?.hot ?? false) && isActive;

        const isInActiveTheme =
          themeIsActive && themeStationSet!.has(location.id);
        const isFadedByTheme = themeIsActive && !isInActiveTheme;

        // Pin colour hierarchy (highest priority first):
        //   1. In active theme → saturated signature solid + soft
        //      atmospheric halo, white text
        //   2. Faded by active theme → soft coral, opacity 0.35
        //   3. Selected location filter → teal
        //   4. Active default → coral / deep coral if hot
        //   5. Inactive → soft coral
        let pinBackground: string;
        let pinBoxShadow: string;
        let pinOpacity = 1;
        if (isInActiveTheme && selectedThemeColor) {
          pinBackground = selectedThemeColor.solid;
          pinBoxShadow = `0 0 0 4px #fff, 0 0 0 9px ${selectedThemeColor.soft}, 0 12px 28px -4px ${selectedThemeColor.deep}A0`;
        } else if (isFadedByTheme) {
          pinBackground = "#F9A48F";
          pinBoxShadow =
            "0 0 0 3px #fff, 0 4px 12px -2px rgba(244,117,96,0.2)";
          pinOpacity = 0.35;
        } else if (isSelected) {
          pinBackground = "#1ABFAD";
          pinBoxShadow =
            "0 0 0 5px #fff, 0 0 0 9px #1ABFAD, 0 12px 28px -4px rgba(26,191,173,0.5)";
        } else if (isActive) {
          pinBackground = isHot ? "#D85A45" : "#F47560";
          pinBoxShadow =
            "0 0 0 4px #fff, 0 8px 20px -4px rgba(244,117,96,0.4)";
        } else {
          pinBackground = "#F9A48F";
          pinBoxShadow =
            "0 0 0 3px #fff, 0 4px 12px -2px rgba(244,117,96,0.25)";
        }

        // Saturated theme pins hold white text well — same as the
        // standard coral/teal pins. The earlier pastel-pin scheme
        // needed dark navy; with saturated solids we're back to white.
        const pinTextColor = "#FFFFFF";

        // Theme-active pins also get a small size lift so they read
        // as the focal points; the actively-selected pin still wins.
        const pinSize = isSelected ? 38 : isInActiveTheme ? 34 : 30;

        return (
          <button
            key={location.id}
            type="button"
            onClick={(e) => {
              // Prevent the map background's clear handler from firing.
              e.stopPropagation();
              onLocationClick(location.id);
            }}
            aria-label={`Location ${location.id} — ${location.label}, ${count} ${count === 1 ? "voice" : "voices"}`}
            aria-pressed={isSelected}
            className="engage-pin"
            style={{
              position: "absolute",
              left: `${location.x}%`,
              top: `${location.y}%`,
              transform: "translate(-50%, -50%)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 4,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Theme-active pins lift above the standard z, even above
              // the location-selected ring (themes are the current
              // analytical focal point when they're active).
              zIndex: isInActiveTheme ? 7 : isSelected ? 6 : 5,
              opacity: pinOpacity,
              transition: "opacity 400ms ease",
            }}
          >
            {/* Soft atmospheric halo around theme pins. Only fires
                while a theme is actively driving the highlight; the
                soft variant of the same colour as the saturated pin
                body underneath. */}
            {isInActiveTheme && selectedThemeColor && (
              <motion.div
                aria-hidden
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [1, 1.45, 1],
                  opacity: [0.7, 0.25, 0.7],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 56,
                  height: 56,
                  marginTop: -28,
                  marginLeft: -28,
                  borderRadius: "50%",
                  background: selectedThemeColor.soft,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            )}

            {/* Pin dot. Width animates via CSS transition so the
                theme-state size lift (30 → 34) feels deliberate
                without conflicting with framer-motion's hover scale. */}
            <motion.div
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                position: "relative",
                width: pinSize,
                height: pinSize,
                borderRadius: "50%",
                background: pinBackground,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: pinTextColor,
                fontWeight: 600,
                fontSize: pinSize >= 38 ? 13 : 12,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                boxShadow: pinBoxShadow,
                transition:
                  "width 250ms ease, height 250ms ease, background 250ms ease, box-shadow 250ms ease, color 250ms ease",
                zIndex: 1,
              }}
            >
              {location.id}
            </motion.div>

            {isActive && (
              <div
                style={{
                  position: "absolute",
                  // Flip above the pin for ids in TAGS_ABOVE so the
                  // badge doesn't collide with a close neighbor below.
                  ...(TAGS_ABOVE.has(location.id)
                    ? { bottom: "calc(100% + 4px)" }
                    : { top: "calc(100% + 4px)" }),
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: isSelected ? "#1ABFAD" : "#0B1D3A",
                  color: "#FFFFFF",
                  padding: "3px 10px",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                  boxShadow: isSelected
                    ? "0 4px 10px -2px rgba(26,191,173,0.35)"
                    : "0 4px 10px -2px rgba(11,29,58,0.3)",
                  opacity: 0.94,
                  pointerEvents: "none",
                  borderRadius: 3,
                  transition: "background 200ms ease",
                }}
              >
                {count} {count === 1 ? "voice" : "voices"}
              </div>
            )}

            {/* Descriptive label — solid white pill so text reads
                cleanly against the map. Fades in on hover or selection. */}
            <div
              className="engage-pin-label"
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#FFFFFF",
                color: "#0B1D3A",
                padding: "6px 12px",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: "nowrap",
                borderRadius: 6,
                border: "1px solid rgba(11, 29, 58, 0.10)",
                boxShadow: "0 4px 12px -2px rgba(11, 29, 58, 0.15)",
                opacity: isSelected ? 1 : 0,
                pointerEvents: "none",
                transition: "opacity 180ms ease",
                maxWidth: 260,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {location.description || location.label}
            </div>
          </button>
        );
      })}

      {/* Floating hint when a location filter is active. Tells the user
          they can click anywhere outside a pin to clear. */}
      <AnimatePresence>
        {selectedLocationId && (
          <motion.div
            key="clear-hint"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "6px 14px",
              background: "rgba(11, 29, 58, 0.85)",
              color: "white",
              borderRadius: 999,
              fontSize: 11,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              letterSpacing: "0.04em",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            Click anywhere on map to clear filter
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        :global(.engage-pin:hover .engage-pin-label),
        :global(.engage-pin:focus-visible .engage-pin-label) {
          opacity: 1 !important;
        }
        :global(.engage-pin:focus-visible) {
          outline: 2px solid #0b1d3a;
          outline-offset: 4px;
          border-radius: 999px;
        }
        @keyframes engageDotBloom {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
