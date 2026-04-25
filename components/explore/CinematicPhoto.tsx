"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useCallback } from "react";

type Props = {
  src: string;
  alt: string;
  cursor?: string;
  toolTint?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  // Children render layered above the entrance-animated <img> (sticky
  // notes, composer, etc.). They sit inside the same click-target.
  children?: ReactNode;
  photoRef?: React.RefObject<HTMLDivElement | null>;
};

export default function CinematicPhoto({
  src,
  alt,
  cursor,
  toolTint = false,
  onClick,
  children,
  photoRef,
}: Props) {
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (photoRef) {
        photoRef.current = el;
      }
    },
    [photoRef],
  );

  return (
    <div
      ref={setRef}
      className="absolute inset-0"
      style={{ zIndex: 0, cursor, overflow: "hidden" }}
      onClick={onClick}
    >
      {/* Entrance — scale + opacity + blur fade-in. Photo is perfectly
          still after the entrance settles (no mouse-driven parallax). */}
      <motion.div
        className="absolute inset-0"
        style={{ willChange: "transform, opacity, filter" }}
        initial={{ scale: 1.05, opacity: 0, filter: "blur(8px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          fetchPriority="high"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
          }}
          draggable={false}
        />
      </motion.div>

      {/* Children (sticky notes, composer) — layered above the photo. */}
      {children}

      {/* Top + bottom gradient bands for floating-UI contrast. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,29,58,0.4) 0%, transparent 25%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, rgba(11,29,58,0.5) 0%, transparent 25%)",
        }}
      />

      {/* Tool-active teal tint — pointer-events: none, doesn't block clicks. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(26, 191, 173, 0.04)" }}
        initial={false}
        animate={{ opacity: toolTint ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
    </div>
  );
}
