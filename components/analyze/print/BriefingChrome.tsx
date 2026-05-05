"use client";

import type { ReactNode } from "react";

// Chrome shared by every printed page: running header, running footer,
// page wrapper, and the global @page / @media print stylesheet. One
// wrapper per intended physical print page; long sections (e.g., the
// appendix) split themselves into multiple wrappers at the data layer.

export const PRINT_COLORS = {
  cream: "#F5F2EB",
  navy: "#0B1D3A",
  navyDim: "rgba(11,29,58,0.7)",
  navyHairline: "rgba(11,29,58,0.18)",
  coral: "#F47560",
  teal: "#1ABFAD",
  amber: "#F0A933",
  white: "#FFFFFF",
};

interface BriefingPageProps {
  sectionLabel: string;
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  fullBleed?: boolean;
  children: ReactNode;
}

export function BriefingPage({
  sectionLabel,
  pageNumber,
  totalPages,
  generatedDateLabel,
  fullBleed = false,
  children,
}: BriefingPageProps) {
  return (
    <section
      className={`briefing-page${fullBleed ? " briefing-page-bleed" : ""}`}
    >
      {!fullBleed && (
        <header className="briefing-running-header">
          <span>BRIEFING · IBX-FBC · A-200</span>
          <span>{sectionLabel}</span>
        </header>
      )}

      <div className="briefing-content">{children}</div>

      {!fullBleed && (
        <footer className="briefing-running-footer">
          <span>
            PAGE {String(pageNumber).padStart(2, "0")} OF{" "}
            {String(totalPages).padStart(2, "0")}
          </span>
          <span>GENERATED {generatedDateLabel}</span>
        </footer>
      )}
    </section>
  );
}

export function BriefingPrintStyles() {
  // Single global stylesheet. Browsers vary on @page margin-box support,
  // so running header/footer are rendered as inline divs inside each
  // BriefingPage rather than via @top-left / @bottom-left declarations.
  // That trades cross-section uniformity for predictable cross-browser
  // rendering.
  return (
    <style>{`
      @page { size: letter; margin: 0.75in; }
      @page :first { margin: 0; }

      :root { color-scheme: light; }

      body {
        background: #d5d3cd;
        color: ${PRINT_COLORS.navy};
        margin: 0;
        font-family: var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      .briefing-root {
        max-width: 8.5in;
        margin: 0 auto;
        padding: 32px 0;
      }

      .briefing-page {
        position: relative;
        width: 7in;
        min-height: 9.5in;
        margin: 0 auto 24px auto;
        padding: 0.5in 0.55in;
        background: ${PRINT_COLORS.cream};
        box-shadow: 0 2px 12px rgba(0,0,0,0.10);
        display: flex;
        flex-direction: column;
        page-break-after: always;
        break-after: page;
      }
      .briefing-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }

      .briefing-page-bleed {
        width: 8.5in;
        height: 11in;
        padding: 0;
        margin: 0 auto 24px auto;
      }

      @media print {
        body { background: ${PRINT_COLORS.cream}; padding: 0; }
        .briefing-root { padding: 0; max-width: none; }
        .briefing-page {
          width: auto;
          /* Match the printable area (letter 11in - 0.75in*2 margin =
             9.5in). Fills the page so margin-top:auto on the footer
             pushes it to the bottom of every printed page. */
          min-height: 9.5in;
          padding: 0.3in 0.35in;
          margin: 0;
          box-shadow: none;
        }
        .briefing-page-bleed {
          width: auto;
          min-height: 0;
          height: auto;
          padding: 0;
        }
        html, body, .briefing-page, .briefing-page * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }

      .briefing-running-header,
      .briefing-running-footer {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
        font-size: 9pt;
        color: ${PRINT_COLORS.navyDim};
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .briefing-running-header {
        padding-bottom: 6pt;
        border-bottom: 1px solid ${PRINT_COLORS.navyHairline};
        margin-bottom: 26pt;
      }
      .briefing-running-footer {
        margin-top: auto;
        padding-top: 6pt;
        border-top: 1px solid ${PRINT_COLORS.navyHairline};
      }

      /* No flex-grow: rely on .briefing-running-footer's margin-top:auto
         to push the footer to the bottom of the flex column. With grow
         on content, some browsers stop honoring the auto margin. */
      .briefing-content { flex: 0 0 auto; }

      .briefing-h1 {
        font-size: 32pt;
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.08;
        color: ${PRINT_COLORS.navy};
        margin: 0 0 8pt;
      }

      .briefing-subhead {
        font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
        font-size: 10pt;
        color: ${PRINT_COLORS.navyDim};
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-weight: 600;
        margin: 0 0 24pt;
      }

      .briefing-prose {
        font-size: 11pt;
        line-height: 1.65;
        color: ${PRINT_COLORS.navy};
        max-width: 6.5in;
        margin: 0 0 14pt;
      }
    `}</style>
  );
}
