"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn, signUp } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

const NAVY = "#0B1D3A";
const TEAL = "#1ABFAD";
const CORAL = "#F47560";
const CREAM = "#F5F2EB";
const SLATE = "#6B7A8C";
const FAINT_BORDER = "#E0DCD4";

type Mode = "signin" | "signup";

// Whitelist for the post-auth redirect target. We never push to an arbitrary
// string from the URL — that's an open-redirect / phishing vector — so the
// list below is the full set of in-app destinations that callers can pass
// via `?redirect=`. Anything else falls through to /analyze (the default
// landing for stakeholders, who are the primary users of this page).
const ALLOWED_REDIRECTS = new Set([
  "/analyze",
  "/engage",
  "/explore",
  "/",
]);

function resolveRedirect(raw: string | null): string {
  if (!raw) return "/analyze";
  if (ALLOWED_REDIRECTS.has(raw)) return raw;
  return "/analyze";
}

export default function StakeholderAuthPage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: "100vh", background: CREAM }} />}
    >
      <StakeholderAuthForm />
    </Suspense>
  );
}

function StakeholderAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolveRedirect(searchParams.get("redirect"));
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    displayName: "",
    email: "",
    password: "",
    organization: "",
  });

  function switchMode(next: Mode) {
    if (mode === next) return;
    setMode(next);
    setError(null);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await signIn(signInData.email, signInData.password);
    if (result.success) {
      await refresh();
      router.push(redirectTo);
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (signUpData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    const result = await signUp(signUpData);
    if (result.success) {
      await refresh();
      router.push(redirectTo);
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: CREAM,
        fontFamily: "var(--font-space-grotesk)",
        color: NAVY,
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          width: "min(440px, 100%)",
          background: "#FFFFFF",
          borderRadius: 20,
          padding: 36,
          boxShadow: "0 18px 48px rgba(11, 29, 58, 0.10)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: NAVY,
          }}
        >
          IBX Co-Connect
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: TEAL,
          }}
        >
          Stakeholder Access
        </div>
        <h1
          style={{
            marginTop: 6,
            fontSize: 22,
            fontWeight: 500,
            color: NAVY,
            lineHeight: 1.25,
          }}
        >
          {mode === "signin" ? "Sign in to your account" : "Welcome, planner"}
        </h1>

        {/* Tab toggle */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 22,
            padding: 4,
            background: CREAM,
            borderRadius: 9999,
          }}
        >
          <TabButton
            active={mode === "signin"}
            onClick={() => switchMode("signin")}
          >
            Sign in
          </TabButton>
          <TabButton
            active={mode === "signup"}
            onClick={() => switchMode("signup")}
          >
            Create account
          </TabButton>
        </div>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} style={{ marginTop: 22 }}>
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={signInData.email}
              onChange={(v) =>
                setSignInData((s) => ({ ...s, email: v }))
              }
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={signInData.password}
              onChange={(v) =>
                setSignInData((s) => ({ ...s, password: v }))
              }
            />
            {error && <ErrorText>{error}</ErrorText>}
            <SubmitButton loading={isLoading}>Sign in</SubmitButton>
          </form>
        ) : (
          <form onSubmit={handleSignUp} style={{ marginTop: 22 }}>
            <Field
              label="Display name"
              hint="How should we address you?"
              autoComplete="name"
              required
              value={signUpData.displayName}
              onChange={(v) =>
                setSignUpData((s) => ({ ...s, displayName: v }))
              }
            />
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={signUpData.email}
              onChange={(v) =>
                setSignUpData((s) => ({ ...s, email: v }))
              }
            />
            <Field
              label="Password"
              type="password"
              autoComplete="new-password"
              hint="At least 6 characters"
              required
              minLength={6}
              value={signUpData.password}
              onChange={(v) =>
                setSignUpData((s) => ({ ...s, password: v }))
              }
            />
            <Field
              label="Organization"
              hint="Your agency, firm, or organization"
              autoComplete="organization"
              required
              value={signUpData.organization}
              onChange={(v) =>
                setSignUpData((s) => ({ ...s, organization: v }))
              }
            />
            {error && <ErrorText>{error}</ErrorText>}
            <SubmitButton loading={isLoading}>
              Create stakeholder account
            </SubmitButton>
          </form>
        )}

        <div
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: `1px solid ${FAINT_BORDER}`,
            textAlign: "center",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: SLATE,
              textDecoration: "none",
            }}
          >
            Continue as anonymous user →
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

// ── Form primitives ────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 14px",
        borderRadius: 9999,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 600,
        background: active ? CORAL : "transparent",
        color: active ? "#FFFFFF" : NAVY,
        transition: "background 0.18s ease, color 0.18s ease",
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  hint,
  type = "text",
  value,
  onChange,
  required,
  minLength,
  autoComplete,
}: {
  label: string;
  hint?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          color: SLATE,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: `1px solid ${FAINT_BORDER}`,
          fontFamily: "inherit",
          fontSize: 14,
          color: NAVY,
          background: "#FFFFFF",
          outline: "none",
        }}
      />
      {hint && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: SLATE,
          }}
        >
          {hint}
        </div>
      )}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        marginTop: 4,
        marginBottom: 14,
        fontSize: 12,
        fontWeight: 500,
        color: CORAL,
      }}
    >
      {children}
    </div>
  );
}

function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        marginTop: 6,
        width: "100%",
        padding: "12px 16px",
        borderRadius: 9999,
        border: "none",
        cursor: loading ? "wait" : "pointer",
        background: CORAL,
        color: "#FFFFFF",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.2px",
        opacity: loading ? 0.7 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "#FFFFFF",
        display: "inline-block",
        animation: "stakeholder-spinner 0.8s linear infinite",
      }}
    />
  );
}
