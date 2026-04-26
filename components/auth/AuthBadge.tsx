"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const NAVY = "#0B1D3A";
const CORAL = "#F47560";
const SLATE = "#8899AA";
const FAINT_BORDER = "#E0DCD4";
const CORAL_TINT = "rgba(244, 117, 96, 0.10)";

// How long the dropdown stays open after the cursor leaves the hover
// zone. Forgives a quick straight-line traversal that briefly clips the
// edge of the menu.
const CLOSE_DELAY_MS = 200;
// Visible gap between the pill and the menu card. The wrapper covers
// this space with padding so the hover zone is continuous from one to
// the other — cursor never enters dead space when traveling down to
// "Sign out".
const VISUAL_GAP_PX = 8;

type Props = {
  /** "dark" inverts colors for dark backgrounds (landing page navy bg). */
  variant?: "light" | "dark";
};

function initials(name: string | null, email: string | null | undefined) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "S";
}

export default function AuthBadge({ variant = "light" }: Props) {
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutHover, setSignOutHover] = useState(false);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openNow() {
    clearCloseTimer();
    setOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }

  // Click-outside dismissal — important for touch users who tap to
  // open and won't ever fire mouseleave. Only attached while open so
  // we're not paying for an idle global listener.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Cancel any pending close when unmounting (e.g. signed out).
  useEffect(() => () => clearCloseTimer(), []);

  // Hide entirely during the initial auth check so SSR markup matches
  // the first client paint (no flicker between "Sign in" and the badge).
  if (isLoading) return null;

  if (!isAuthenticated) {
    const linkColor = variant === "dark" ? "rgba(253, 246, 236, 0.85)" : NAVY;
    return (
      <Link
        href="/stakeholder"
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontSize: 12,
          fontWeight: 500,
          color: linkColor,
          textDecoration: "none",
        }}
      >
        Sign in
      </Link>
    );
  }

  const displayName = profile?.display_name ?? user?.email ?? "Stakeholder";

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setOpen(false);
    setSigningOut(false);
    router.refresh();
  }

  return (
    <div
      ref={containerRef}
      // Single hover zone covering pill + bridge + menu. mouseenter
      // here cancels any pending close, mouseleave schedules a close
      // 200ms out (re-entering the zone within that window cancels it).
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      style={{ position: "relative", fontFamily: "var(--font-space-grotesk)" }}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openNow())}
        onFocus={openNow}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Signed in as ${displayName}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px 4px 4px",
          borderRadius: 9999,
          background: variant === "dark" ? "rgba(253, 246, 236, 0.10)" : "#FFFFFF",
          border:
            variant === "dark"
              ? "1px solid rgba(253, 246, 236, 0.20)"
              : `1px solid ${FAINT_BORDER}`,
          cursor: "pointer",
          color: variant === "dark" ? "#FDF6EC" : NAVY,
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: CORAL,
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2px",
          }}
        >
          {initials(profile?.display_name ?? null, user?.email)}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            maxWidth: 120,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          // Outer wrapper sits flush against the pill (top: 100%, no
          // gap) and pads the visible card down by VISUAL_GAP_PX. That
          // padding region is part of the hover zone, so the cursor
          // stays inside the menu the entire trip from pill → button.
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              paddingTop: VISUAL_GAP_PX,
              zIndex: 50,
            }}
          >
            <div
              style={{
                minWidth: 200,
                padding: 8,
                background: "#FFFFFF",
                border: `1px solid ${FAINT_BORDER}`,
                borderRadius: 12,
                boxShadow: "0 12px 32px rgba(11, 29, 58, 0.15)",
                color: NAVY,
              }}
            >
              {profile?.organization && (
                <div
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    color: SLATE,
                    borderBottom: `1px solid ${FAINT_BORDER}`,
                    marginBottom: 6,
                  }}
                >
                  {profile.organization}
                </div>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                role="menuitem"
                onMouseEnter={() => setSignOutHover(true)}
                onMouseLeave={() => setSignOutHover(false)}
                onFocus={() => setSignOutHover(true)}
                onBlur={() => setSignOutHover(false)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  background: signOutHover ? CORAL_TINT : "transparent",
                  border: "none",
                  cursor: signingOut ? "wait" : "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 500,
                  color: NAVY,
                  borderRadius: 8,
                  transition: "background 0.15s ease",
                }}
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
