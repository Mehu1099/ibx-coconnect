"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ExploreLocation } from "@/lib/explore-locations";
import type { LocationCount } from "@/lib/use-engage-data";

interface EngageMapProps {
  locations: ExploreLocation[];
  locationCounts: LocationCount[];
  selectedLocationId: string | null;
  onLocationClick: (id: string) => void;
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
}: EngageMapProps) {
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

        // Selected pins flip to teal — both the inner dot and the
        // outer ring — so the selection state reads at a glance and
        // doesn't fight the coral pulse on hot zones (which is paused
        // during selection anyway).
        const pinBg = isSelected
          ? "#1ABFAD"
          : isActive
            ? isHot
              ? "#D85A45"
              : "#F47560"
            : "#F9A48F";
        const pinShadow = isSelected
          ? "0 0 0 5px #fff, 0 0 0 9px #1ABFAD, 0 12px 28px -4px rgba(26,191,173,0.5)"
          : isActive
            ? "0 0 0 4px #fff, 0 8px 20px -4px rgba(244,117,96,0.4)"
            : "0 0 0 3px #fff, 0 4px 12px -2px rgba(244,117,96,0.25)";

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
              zIndex: isSelected ? 7 : 6,
            }}
          >
            {/* Pin dot: 30px base; selected scale 1.27 → ~38px total.
                The hot-zone status reads off color (deep coral for hot,
                regular coral for active, soft coral for inactive) — the
                radiating pulse from earlier iterations was distracting. */}
            <motion.div
              style={{
                position: "relative",
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: pinBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 600,
                fontSize: 12,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                boxShadow: pinShadow,
              }}
              animate={isSelected ? { scale: 1.27 } : { scale: 1 }}
              whileHover={{ scale: isSelected ? 1.27 : 1.06 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
