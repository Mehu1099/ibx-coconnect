"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ExploreNav from "@/components/explore/ExploreNav";
import IBXLineAnimation from "@/components/explore/IBXLineAnimation";
import LocationPin from "@/components/explore/LocationPin";
import PinAdminTool from "@/components/explore/PinAdminTool";
import WelcomeText from "@/components/explore/WelcomeText";
import { EXPLORE_LOCATIONS, type ExploreLocation } from "@/lib/explore-locations";

const SESSION_FLAG = "ibx-explore-animated";
// Total length of the welcome sequence (intro + lines + pin stagger).
// Past this point we set the session flag so a same-session return
// from a child route skips animations.
const FULL_SEQUENCE_MS = 8500;

// Initial-render decision. Done at module evaluation time on the
// client so the first render already knows whether to play the intro.
// Falsy on the server (SSR), which means SSR HTML always renders the
// animated state — fine because the page is a client component and
// hydrates before the user can perceive the difference.
function shouldSkipIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_FLAG) === "true";
  } catch {
    return false;
  }
}

export default function ExplorePage() {
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [instant] = useState(shouldSkipIntro);
  const router = useRouter();

  // Once the welcome sequence finishes, lock the flag for this session
  // so a return from a location page skips the intro. Only runs when
  // the intro actually played; instant=true means it's already set.
  useEffect(() => {
    if (instant) return;
    const t = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SESSION_FLAG, "true");
      } catch {
        /* ignore */
      }
    }, FULL_SEQUENCE_MS);
    return () => window.clearTimeout(t);
  }, [instant]);

  const handlePinSelect = useCallback(
    (loc: ExploreLocation) => {
      if (leaving) return;
      setLeaving(true);
      // Mark the flag now so the return-trip render reads it as
      // "skip" even if the user navigates back within the timeout.
      try {
        window.sessionStorage.setItem(SESSION_FLAG, "true");
      } catch {
        /* ignore */
      }
      // White fade out, then route. The location page mounts with its
      // own white background and fades the photo in over 0.6s.
      window.setTimeout(() => router.push(`/explore/${loc.id}`), 380);
    },
    [leaving, router],
  );

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
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={instant ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
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

        <IBXLineAnimation instant={instant} />

        {!adminMode &&
          EXPLORE_LOCATIONS.map((loc, i) => (
            <LocationPin
              key={loc.id}
              location={loc}
              index={i}
              onSelect={handlePinSelect}
              instant={instant}
            />
          ))}
      </motion.div>

      <PinAdminTool
        imageContainerRef={imageContainerRef}
        onAdminModeChange={setAdminMode}
      />

      <ExploreNav />

      <WelcomeText instant={instant} />

      {/* White fade-out when navigating into a location page. The
          destination paints its own white bg and fades the photo in,
          so the visual hand-off is seamless. */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 90, background: "#FFFFFF", pointerEvents: "all" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
