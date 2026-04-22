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
      style={{ background: "#F5F2EB" }}
    >
      {/* Axonometric map fills the viewport */}
      <motion.div
        ref={imageContainerRef}
        className="absolute inset-0"
        style={{ zIndex: 0, cursor: adminMode ? "crosshair" : "default" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/explore/axonometric-base.jpg"
          alt="Axonometric map of the neighborhood"
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
          style={{ background: "rgba(245, 242, 235, 0.1)" }}
        />

        {/* Glowing dot traveling along the IBX transit line. Sits above
            the image (via its own z-index: 10) and below the pins (z-20). */}
        <IBXLineAnimation />

        {/* Pins — rendered inside the image container so their %-based
            positioning matches the admin tool's coordinate system */}
        {!adminMode &&
          EXPLORE_LOCATIONS.map((loc, i) => (
            <LocationPin key={loc.id} location={loc} index={i} />
          ))}
      </motion.div>

      {/* Admin tool lives outside the image container so its own UI
          clicks don't bubble into the image click handler. Its absolute
          markers use %s relative to <main>, which is the same size as
          the image container (both fill the viewport). */}
      <PinAdminTool
        imageContainerRef={imageContainerRef}
        onAdminModeChange={setAdminMode}
      />

      {/* Top nav (above map) */}
      <ExploreNav />

      {/* Welcome text (above map) */}
      <WelcomeText />
    </main>
  );
}
