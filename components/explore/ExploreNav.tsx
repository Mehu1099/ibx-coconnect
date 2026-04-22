"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS: { label: string; href: string; active?: boolean }[] = [
  { label: "Explore", href: "/explore", active: true },
  { label: "Engage", href: "#" },
  { label: "Analyze", href: "#" },
];

export default function ExploreNav() {
  const [titleHovered, setTitleHovered] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-6 border-b"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "#E0DCD4",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <motion.span
          onMouseEnter={() => setTitleHovered(true)}
          onMouseLeave={() => setTitleHovered(false)}
          animate={{ color: titleHovered ? "#F47560" : "#0B1D3A" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{
            display: "inline-block",
            cursor: "pointer",
            fontFamily: "var(--font-space-grotesk)",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          IBX Co-Connect
        </motion.span>
      </Link>

      <motion.div
        className="flex items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="relative text-[14px] transition-colors"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              color: link.active ? "#0B1D3A" : "#8899AA",
              fontWeight: link.active ? 600 : 500,
            }}
          >
            {link.label}
            {link.active && (
              <span
                className="absolute left-1/2 -translate-x-1/2 block rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: "#1ABFAD",
                  bottom: -8,
                }}
              />
            )}
          </a>
        ))}

        <div
          className="rounded-full"
          style={{
            width: 32,
            height: 32,
            background: "#E0DCD4",
            border: "1px solid #D0CBC0",
          }}
          aria-label="User avatar placeholder"
        />
      </motion.div>
    </nav>
  );
}
