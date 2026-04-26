"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const CORAL = "#F47560";

// Coral pill that drops down from the top after a successful sign-in /
// sign-up redirect (the auth page sends ?welcome=true). Self-dismisses
// after 4s and strips the query param so a refresh doesn't replay it.
export default function WelcomeBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const { profile, user, isLoading } = useAuth();
  const [show, setShow] = useState(false);

  const triggered = params.get("welcome") === "true";

  useEffect(() => {
    if (!triggered || isLoading) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 4000);
    // Strip the query param so reload / back button doesn't re-trigger.
    // replace() (not push) keeps history clean.
    router.replace("/", { scroll: false });
    return () => window.clearTimeout(t);
    // router/replace are stable; isLoading flip is the actual gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggered, isLoading]);

  if (!triggered) return null;

  const name = profile?.display_name ?? user?.email ?? "stakeholder";
  const org = profile?.organization;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            x: "-50%",
            zIndex: 60,
            background: CORAL,
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: 9999,
            fontFamily: "var(--font-space-grotesk)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.2px",
            boxShadow: "0 8px 24px rgba(244, 117, 96, 0.35)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            maxWidth: "calc(100vw - 32px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Welcome, {name}
          {org ? ` from ${org}` : ""}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
