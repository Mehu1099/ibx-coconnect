"use client";

import { motion } from "framer-motion";
import { memo, useState } from "react";
import type { ExploreLocation } from "@/lib/explore-locations";

type Props = {
  location: ExploreLocation;
  index: number;
  /** Container-pixel position of the pin's center, computed by the
   *  projection hook. The parent re-projects on resize so pins track
   *  the rendered image under object-fit: cover + mobile zoom/focus. */
  screenX: number;
  screenY: number;
  onSelect?: (location: ExploreLocation) => void;
  /** Skip the staggered fade-in (used when returning from a child page). */
  instant?: boolean;
  /** Number of concerns logged at this location. 0 hides the badge. */
  concernCount?: number;
};

const PIN_DIAMETER = 52;
const NEAR_TOP_THRESHOLD = 15;

function LocationPinInner({
  location,
  index,
  screenX,
  screenY,
  onSelect,
  instant = false,
  concernCount = 0,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const labelBelow = location.y < NEAR_TOP_THRESHOLD;

  return (
    <motion.button
      type="button"
      className="absolute z-20 cursor-pointer"
      style={{
        // Centering via motion-style x/y so framer composes them into
        // its own transform alongside `scale` (entrance) and any future
        // animated transforms. Inline `transform: translate(-50%, -50%)`
        // would get clobbered every time framer wrote its transform
        // during the scale animation, leaving each pin offset by half
        // its size and the sonar ring visibly wobbling around it.
        left: `${screenX}px`,
        top: `${screenY}px`,
        x: "-50%",
        y: "-50%",
        width: PIN_DIAMETER,
        height: PIN_DIAMETER,
        background: "transparent",
        border: "none",
        padding: 0,
      }}
      initial={instant ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        instant
          ? { duration: 0 }
          : {
              // 7.3s = intro typing (1.2) + hold (1.0) + fade (0.6)
              // + line 1 (2.0) + line 2 (2.0) + ~0.5 cursor blink.
              // Pins land right after the welcome sequence wraps up.
              delay: 7.3 + index * 0.1,
              duration: 0.5,
              ease: "easeOut",
            }
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={() => onSelect?.(location)}
      aria-label={`${location.label}: ${location.category}`}
    >
      {/* Sonar-ping ring — pure CSS animation runs on the compositor
          thread, no JS work per frame. Staggered by index via
          animation-delay so at most 1–2 of the 8 pins pulse at a time
          (CSS keyframes defined in app/globals.css). */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none pin-sonar-pulse"
        style={{
          inset: -6,
          border: "2px solid #00C4A7",
          animationDelay: `${index * 0.7}s`,
        }}
      />

      <motion.div
        className="relative"
        style={{ width: "100%", height: "100%" }}
        animate={{ scale: hovered ? 1.2 : 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Layered edge treatment via stacked OUTER box-shadow spreads:
            2px cream halo, then 4px vibrant teal border (6px total
            spread, minus the inner 2px = 4px teal ring), plus the soft
            drop shadow. Photo stays 52px; visible pin is 64px. */}
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: "100%",
            height: "100%",
            background: "#FFFFFF",
            boxShadow: `
              0 0 0 2px #F5F2EB,
              0 0 0 ${hovered ? 7 : 6}px #00C4A7,
              0 6px 16px rgba(0, 0, 0, 0.18)
            `,
            transition: "box-shadow 0.2s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={location.image}
            alt={location.label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            draggable={false}
          />
        </div>

        {/* Concern count badge — top-right of the pin. Renders only
            when the location has at least one concern. The count is
            fetched once at the page level and passed in as a prop. */}
        {concernCount > 0 && (
          <div
            aria-label={`${concernCount} concerns`}
            className="absolute pointer-events-none rounded-full flex items-center justify-center"
            style={{
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              background: "#F47560",
              color: "#FFFFFF",
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              border: "2px solid #F5F2EB",
              boxShadow: "0 2px 6px rgba(244, 117, 96, 0.35)",
              zIndex: 1,
            }}
          >
            {concernCount > 9 ? "9+" : concernCount}
          </div>
        )}

        {hovered && (
          <div
            className="absolute left-1/2 pointer-events-none"
            style={{
              transform: "translateX(-50%)",
              ...(labelBelow
                ? { top: `calc(100% + 14px)` }
                : { bottom: `calc(100% + 14px)` }),
            }}
          >
            <div
              className="relative rounded-xl"
              style={{
                background: "#FFFFFF",
                padding: "10px 14px",
                boxShadow: "0 6px 20px rgba(11, 29, 58, 0.12)",
                fontFamily: "var(--font-space-grotesk)",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  color: "#0B1D3A",
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {location.label}
              </div>
              <div
                style={{
                  color: "#8899AA",
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginTop: 2,
                }}
              >
                {location.category}
              </div>

              <div
                aria-hidden
                className="absolute left-1/2"
                style={{
                  transform: "translateX(-50%) rotate(45deg)",
                  width: 10,
                  height: 10,
                  background: "#FFFFFF",
                  ...(labelBelow
                    ? {
                        top: -4,
                        boxShadow: "-2px -2px 4px rgba(11, 29, 58, 0.04)",
                      }
                    : {
                        bottom: -4,
                        boxShadow: "2px 2px 4px rgba(11, 29, 58, 0.04)",
                      }),
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.button>
  );
}

// Custom comparator — re-render only when something the pin actually
// renders against has changed. concernCounts hydrating elsewhere on
// the page no longer triggers a pin re-render unless THIS pin's count
// changed. screenX/Y change on resize but the parent memoizes them so
// they're referentially stable across unrelated re-renders.
const LocationPin = memo(LocationPinInner, (prev, next) => {
  return (
    prev.screenX === next.screenX &&
    prev.screenY === next.screenY &&
    prev.location.id === next.location.id &&
    prev.concernCount === next.concernCount &&
    prev.instant === next.instant &&
    prev.index === next.index &&
    prev.onSelect === next.onSelect
  );
});
export default LocationPin;
