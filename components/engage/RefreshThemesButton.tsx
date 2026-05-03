"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

interface Props {
  onSuccess?: () => void;
}

// Stakeholder-only trigger for the AI clustering pass. Renders nothing
// for anonymous viewers. Shows phased status copy during the ~10–30s
// generation so the wait feels like work happening, not a hung button.

export function RefreshThemesButton({ onSuccess }: Props) {
  const [isStakeholder, setIsStakeholder] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsStakeholder(!!data.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsStakeholder(!!session?.user);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isStakeholder) return null;

  const handleClick = async () => {
    setIsGenerating(true);
    setError(null);
    setStatusMessage("Reading community contributions…");

    // Phased status messages — purely cosmetic but useful while the
    // single fetch below is in flight. Cleared on completion.
    const t1 = window.setTimeout(
      () => setStatusMessage("Identifying patterns…"),
      2000,
    );
    const t2 = window.setTimeout(
      () => setStatusMessage("Extracting themes…"),
      5000,
    );

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/generate-themes", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = (await res.json()) as
        | {
            success: true;
            theme_count: number;
            contribution_count: number;
          }
        | { error: string };

      window.clearTimeout(t1);
      window.clearTimeout(t2);

      if (!res.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : `Request failed (${res.status})`,
        );
      }

      setStatusMessage(
        `Generated ${data.theme_count} themes from ${data.contribution_count} contributions`,
      );
      window.setTimeout(() => {
        setStatusMessage(null);
        setIsGenerating(false);
        onSuccess?.();
      }, 2200);
    } catch (err) {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatusMessage(null);
      window.setTimeout(() => {
        setIsGenerating(false);
        setError(null);
      }, 4500);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isGenerating}
        className="engage-refresh-themes"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: isGenerating ? "rgba(244,117,96,0.15)" : "#0B1D3A",
          color: isGenerating ? "#D85A45" : "#FFFFFF",
          border: "1px solid",
          borderColor: isGenerating
            ? "rgba(244,117,96,0.3)"
            : "#0B1D3A",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: isGenerating ? "wait" : "pointer",
          transition: "all 150ms",
          alignSelf: "flex-start",
          borderRadius: 4,
        }}
      >
        <motion.span
          animate={isGenerating ? { rotate: 360 } : { rotate: 0 }}
          transition={
            isGenerating
              ? { duration: 1.5, repeat: Infinity, ease: "linear" }
              : { duration: 0 }
          }
          style={{ display: "flex" }}
        >
          {isGenerating ? (
            <RefreshCw size={11} strokeWidth={2.5} />
          ) : (
            <Sparkles size={11} strokeWidth={2.5} />
          )}
        </motion.span>
        {isGenerating ? "Analysing…" : "Refresh themes"}
      </button>

      <AnimatePresence>
        {statusMessage && (
          <motion.div
            key="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              color: "#6B7A8C",
              letterSpacing: "0.04em",
              lineHeight: 1.5,
            }}
          >
            {statusMessage}
          </motion.div>
        )}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 11,
              color: "#D85A45",
              padding: "6px 10px",
              background: "rgba(216,90,69,0.08)",
              borderRadius: 4,
              lineHeight: 1.45,
            }}
          >
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        :global(.engage-refresh-themes:focus-visible) {
          outline: 2px solid #0b1d3a;
          outline-offset: 2px;
        }
        :global(.engage-refresh-themes:not(:disabled):hover) {
          background: #1a2a47 !important;
        }
      `}</style>
    </div>
  );
}
