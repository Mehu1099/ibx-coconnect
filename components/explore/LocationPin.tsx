"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { ExploreLocation } from "@/lib/explore-locations";

type Props = {
  location: ExploreLocation;
  index: number;
};

const PIN_DIAMETER = 52;
const NEAR_TOP_THRESHOLD = 15;

export default function LocationPin({ location, index }: Props) {
  const [hovered, setHovered] = useState(false);
  const labelBelow = location.y < NEAR_TOP_THRESHOLD;

  return (
    <motion.button
      type="button"
      className="absolute z-20 cursor-pointer"
      style={{
        left: `${location.x}%`,
        top: `${location.y}%`,
        width: PIN_DIAMETER,
        height: PIN_DIAMETER,
        transform: "translate(-50%, -50%)",
        background: "transparent",
        border: "none",
        padding: 0,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 4.5 + index * 0.1,
        duration: 0.5,
        ease: "easeOut",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={() => {
        console.log(`Clicked: ${location.label}`);
      }}
      aria-label={`${location.label}: ${location.category}`}
    >
      {/* Sonar-ping ring — starts at the outer edge of the visible pin
          (which extends 6px beyond the 52px photo via the box-shadow
          halo) and expands outward. Only scale + opacity animate, so
          this is fully GPU-composited at 60fps. */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -6,
          border: "2px solid #00C4A7",
          willChange: "transform, opacity",
        }}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{
          duration: 2,
          ease: [0.4, 0, 0.2, 1],
          repeat: Infinity,
          delay: index * 0.25,
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
