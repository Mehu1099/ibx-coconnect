"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import ExploreNav from "@/components/explore/ExploreNav";
import IBXLineAnimation from "@/components/explore/IBXLineAnimation";
import LocationPin from "@/components/explore/LocationPin";
import PinAdminTool from "@/components/explore/PinAdminTool";
import WelcomeText from "@/components/explore/WelcomeText";
import { EXPLORE_LOCATIONS } from "@/lib/explore-locations";

export default function ExplorePage() {
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [adminMode, setAdminMode] = useState(false);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "#EDE5D5" }}
    >
      {/* Axonometric map. Warm cream bg shows through while the image
          loads, so there's no white flash. Fade-in is cosmetic — the
          page is usable from frame one. */}
      <motion.div
        ref={imageContainerRef}
        className="absolute inset-0"
        style={{ zIndex: 0, cursor: adminMode ? "crosshair" : "default" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/explore/axonometric-base.jpg"
          alt="Axonometric map of the neighborhood"
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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(237, 229, 213, 0.1)" }}
        />

        <IBXLineAnimation />

        {!adminMode &&
          EXPLORE_LOCATIONS.map((loc, i) => (
            <LocationPin key={loc.id} location={loc} index={i} />
          ))}
      </motion.div>

      <PinAdminTool
        imageContainerRef={imageContainerRef}
        onAdminModeChange={setAdminMode}
      />

      <ExploreNav />

      <WelcomeText />
    </main>
  );
}
