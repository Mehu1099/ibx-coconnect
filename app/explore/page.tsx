"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExploreNav from "@/components/explore/ExploreNav";
import IBXLineAnimation from "@/components/explore/IBXLineAnimation";
import LocationPin from "@/components/explore/LocationPin";
import PinAdminTool from "@/components/explore/PinAdminTool";
import WelcomeText from "@/components/explore/WelcomeText";
import { getConcernCountByLocation } from "@/lib/annotations-api";
import {
  AXONOMETRIC_NATURAL_HEIGHT,
  AXONOMETRIC_NATURAL_WIDTH,
  EXPLORE_LOCATIONS,
  IBX_ROUTE_WAYPOINTS,
  type ExploreLocation,
} from "@/lib/explore-locations";
import { useImageProjection } from "@/lib/use-image-projection";

const SESSION_FLAG = "ibx-explore-animated";
// Total length of the welcome sequence (intro + lines + pin stagger).
// Past this point we set the session flag so a same-session return
// from a child route skips animations.
const FULL_SEQUENCE_MS = 8500;

export default function ExplorePage() {
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Both `mounted` and `instant` start at false on server AND first
  // client render, so SSR HTML matches initial-client HTML byte-for-byte
  // (no hydration mismatch). The mount effect then reads sessionStorage
  // and flips both at once. Animation-bearing children are only rendered
  // once `mounted` is true — they mount with the correct `instant`.
  const [mounted, setMounted] = useState(false);
  const [instant, setInstant] = useState(false);
  // { locationId → count }, hydrated from Supabase. Empty object until
  // the fetch resolves; pins render with 0 (badge hidden) in the meantime.
  const [concernCounts, setConcernCounts] = useState<Record<string, number>>({});
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let skip = false;
    try {
      skip = window.sessionStorage.getItem(SESSION_FLAG) === "true";
    } catch {
      /* private browsing — fall through with skip=false */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical hydration-safe sessionStorage read
    if (skip) setInstant(true);
    setMounted(true);
  }, []);

  // Mobile portrait detection — drives a focused/zoomed framing of the
  // axonometric so pins land in the visible window on small screens.
  useEffect(() => {
    function check() {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobilePortrait(isMobile && isPortrait);
    }
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // Fire-and-forget. Errors are console-logged inside the helper; if
  // the call fails we just leave concernCounts={} and no badges show.
  useEffect(() => {
    let cancelled = false;
    getConcernCountByLocation().then((counts) => {
      if (!cancelled) setConcernCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Once the welcome sequence finishes, lock the flag for this session
  // so a return from a location page skips the intro. Only runs when
  // the intro actually played; instant=true means it's already set.
  useEffect(() => {
    if (!mounted || instant) return;
    const t = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SESSION_FLAG, "true");
      } catch {
        /* ignore */
      }
    }, FULL_SEQUENCE_MS);
    return () => window.clearTimeout(t);
  }, [mounted, instant]);

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

  // Project natural-image % to container px. With cover at desktop the
  // image fills the viewport (cropped on whichever axis is the longer
  // one). On mobile portrait we zoom 1.5× and slide the focus toward
  // the south-east quadrant (Brooklyn College area) so the most relevant
  // part of the neighborhood lands in-frame.
  const projection = useImageProjection(
    imageContainerRef,
    AXONOMETRIC_NATURAL_WIDTH,
    AXONOMETRIC_NATURAL_HEIGHT,
    "cover",
    isMobilePortrait ? 1.5 : 1,
    isMobilePortrait ? 60 : 50,
    isMobilePortrait ? 70 : 50,
  );

  // Pre-project pin positions whenever the projection changes. Memoizing
  // here means LocationPin's `screenX/screenY` props are referentially
  // stable across unrelated parent re-renders (e.g. concernCounts
  // hydrating), so the memo'd pin doesn't re-render either.
  const projectedPins = useMemo(() => {
    if (!projection) return [];
    return EXPLORE_LOCATIONS.map((loc) => {
      const p = projection.projectPin(loc.x, loc.y);
      return { loc, screenX: p.x, screenY: p.y, visible: p.visible };
    });
  }, [projection]);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "#EDE5D5" }}
    >
      {/* Viewport-sized container. The axonometric is positioned in
          absolute pixels (computed by the projection hook) so we can
          track the rendered image bounds precisely under object-fit:
          cover and apply a mobile zoom + focus shift. */}
      <motion.div
        ref={imageContainerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ zIndex: 0, cursor: adminMode ? "crosshair" : "default" }}
        // Same initial on server and client so SSR HTML matches first
        // client render. The 0.8s fade-in plays on every entry — fine
        // even on instant returns, since the prior page's white fade-out
        // is already covering the swap.
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {projection && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/explore/axonometric-base.jpg"
              alt="Axonometric map of the neighborhood"
              fetchPriority="high"
              style={{
                position: "absolute",
                left: `${projection.imageScreenX}px`,
                top: `${projection.imageScreenY}px`,
                width: `${projection.imageScreenWidth}px`,
                height: `${projection.imageScreenHeight}px`,
                maxWidth: "none",
                display: "block",
                userSelect: "none",
              }}
              draggable={false}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "rgba(237, 229, 213, 0.1)" }}
            />
          </>
        )}

        {/* Animation-bearing children are gated on `mounted` AND a
            ready projection so they never render before we know where
            the image lands. */}
        {mounted && projection && (
          <IBXLineAnimation
            instant={instant}
            waypoints={IBX_ROUTE_WAYPOINTS}
            projection={projection}
          />
        )}

        {mounted && !adminMode &&
          projectedPins.map((p, i) => {
            if (!p.visible) return null;
            return (
              <LocationPin
                key={p.loc.id}
                location={p.loc}
                index={i}
                screenX={p.screenX}
                screenY={p.screenY}
                onSelect={handlePinSelect}
                instant={instant}
                concernCount={concernCounts[p.loc.id] ?? 0}
              />
            );
          })}
      </motion.div>

      <PinAdminTool
        imageContainerRef={imageContainerRef}
        projection={projection}
        onAdminModeChange={setAdminMode}
      />

      <ExploreNav />

      {mounted && <WelcomeText instant={instant} isMobilePortrait={isMobilePortrait} />}

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
