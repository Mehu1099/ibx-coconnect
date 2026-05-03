"use client";

import { ArrowLeft, Monitor } from "lucide-react";
import Link from "next/link";

// Full-screen takeover at <1100px. The Living Desk layout depends on
// three side-by-side surfaces + a full-bleed map; below ~1100px there
// isn't room to compress them without losing the metaphor, so we route
// the user back to the mobile-friendly Explore page instead.

export function MobileBlock() {
  return (
    <div
      className="engage-mobile-block"
      style={{
        display: "none",
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "linear-gradient(180deg, #F5F2EB 0%, #EDE5D5 100%)",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: "var(--font-space-grotesk), sans-serif",
        textAlign: "center",
        color: "#0B1D3A",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 76,
          height: 76,
          background: "#FBF6EE",
          border: "1px solid #E0DCD4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F47560",
          marginBottom: 20,
          boxShadow: "0 8px 22px -8px rgba(244,117,96,0.45)",
        }}
      >
        <Monitor size={34} strokeWidth={1.7} />
      </div>

      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.22em",
          color: "#D85A45",
          marginBottom: 10,
        }}
      >
        DESKTOP RECOMMENDED
      </div>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: "#0B1D3A",
          margin: 0,
          letterSpacing: "-0.02em",
          marginBottom: 14,
          maxWidth: 360,
          lineHeight: 1.2,
        }}
      >
        The Engage page is a planner&rsquo;s desk
      </h1>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "#3a4a5c",
          margin: 0,
          maxWidth: 340,
          marginBottom: 24,
        }}
      >
        It lays the city out as a working surface, with themes filed on
        the left, voices on the right, and a live map in the middle.
        Best experienced on a laptop or larger screen.
      </p>

      <Link
        href="/explore"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          background: "#0B1D3A",
          color: "#FBF6EE",
          textDecoration: "none",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          border: "1px solid #0B1D3A",
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Continue to Explore
      </Link>

      <div
        style={{
          marginTop: 28,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9.5,
          color: "#8899AA",
          letterSpacing: "0.18em",
        }}
      >
        IBX · CO-CONNECT · REV 2026.05
      </div>

      <style jsx>{`
        @media (max-width: 1100px) {
          .engage-mobile-block {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
