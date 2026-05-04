"use client";

import { motion } from "framer-motion";

// "Planner's Desk" splash backdrop — a hand-laid scene of paper sheets,
// sticky notes, theme cards, a pencil, and faint connector lines that
// suggests a stakeholder's working desk rather than abstract data
// floating in space. The viewBox is 1600×900 with preserveAspectRatio
// "xMidYMid slice", so on any window the central area stays clear for
// the message card; corners may crop on narrow/tall viewports.
//
// Visibility tuning: the previous pass leaned too transparent and the
// scene read as ghostly. Strokes and content opacities here are bumped
// across the board (papers, theme cards, sticky-note text, connectors)
// and the original full-frame vignette is replaced with a small radial
// "cardBackdrop" that only softens the area immediately behind the
// message card — corners and edges stay fully visible.
//
// Two structural notes:
//
//   1. Traveling dots use SVG's native <animateMotion> rather than CSS
//      offsetPath / framer-motion offsetDistance. animateMotion is
//      purpose-built for path-following and works in every browser
//      without depending on the (still-spotty) SVG offsetPath support.
//
//   2. Theme cards that need both a static rotation AND a bobbing y
//      animation wrap a <g transform="rotate(...)"> around the
//      motion.g. Putting both on the same element fails because
//      framer-motion's y animation injects a CSS transform that
//      overrides the SVG transform attribute.

export default function SplashAnimation() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern
            id="deskGrid"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="rgba(11,29,58,0.04)"
              strokeWidth="0.5"
            />
          </pattern>

          <filter
            id="paperShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feOffset dx="2" dy="3" result="offsetBlur" />
            <feFlood floodColor="rgba(11,29,58,0.18)" />
            <feComposite in2="offsetBlur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="cardBackdrop" cx="50%" cy="50%" r="22%">
            <stop offset="0%" stopColor="rgba(242,237,224,0.55)" />
            <stop offset="70%" stopColor="rgba(242,237,224,0.15)" />
            <stop offset="100%" stopColor="rgba(242,237,224,0)" />
          </radialGradient>
        </defs>

        {/* Desk surface */}
        <rect width="1600" height="900" fill="url(#deskGrid)" />

        {/* TOP LEFT — document sheet with mock body lines */}
        <motion.g
          initial={{ opacity: 0, y: 20, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ transformOrigin: "180px 200px" }}
        >
          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect
              x="80"
              y="120"
              width="220"
              height="280"
              fill="#FFFFFF"
              stroke="rgba(11,29,58,0.18)"
              strokeWidth="1.5"
              filter="url(#paperShadow)"
            />
            <rect x="100" y="145" width="80" height="3" fill="rgba(11,29,58,0.7)" />
            <rect x="100" y="155" width="60" height="2" fill="rgba(11,29,58,0.4)" />
            {[180, 195, 210, 225, 245, 260, 275, 295, 310, 325, 345, 360].map(
              (y, i) => (
                <rect
                  key={i}
                  x="100"
                  y={y}
                  width={i % 3 === 0 ? 180 : i % 3 === 1 ? 160 : 140}
                  height="1.5"
                  fill="rgba(11,29,58,0.35)"
                />
              ),
            )}
            <rect x="100" y="375" width="50" height="14" fill="#0B1D3A" />
            <text
              x="105"
              y="385"
              fontFamily="monospace"
              fontSize="8"
              fill="#fff"
              letterSpacing="1"
            >
              DOC-01
            </text>
          </motion.g>
        </motion.g>

        {/* BOTTOM RIGHT — chart sheet with mock bars */}
        <motion.g
          initial={{ opacity: 0, y: 20, rotate: 4 }}
          animate={{ opacity: 1, y: 0, rotate: 4 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ transformOrigin: "1380px 700px" }}
        >
          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 6,
              delay: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <rect
              x="1280"
              y="600"
              width="220"
              height="200"
              fill="#FFFFFF"
              stroke="rgba(11,29,58,0.18)"
              strokeWidth="1.5"
              filter="url(#paperShadow)"
            />
            {[
              { x: 1300, h: 60 },
              { x: 1330, h: 90 },
              { x: 1360, h: 45 },
              { x: 1390, h: 110 },
              { x: 1420, h: 75 },
              { x: 1450, h: 95 },
            ].map((bar, i) => (
              <rect
                key={i}
                x={bar.x}
                y={770 - bar.h}
                width="20"
                height={bar.h}
                fill={
                  i % 2 === 0
                    ? "rgba(244,117,96,0.75)"
                    : "rgba(26,191,173,0.75)"
                }
              />
            ))}
            <line
              x1="1295"
              y1="775"
              x2="1485"
              y2="775"
              stroke="rgba(11,29,58,0.5)"
              strokeWidth="1"
            />
            <rect x="1300" y="620" width="100" height="3" fill="rgba(11,29,58,0.6)" />
          </motion.g>
        </motion.g>

        {/* MID LEFT — two theme card abstractions stacked */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          {/* Card 1 (back) — static SVG rotation parent + bob inner */}
          <g transform="rotate(-2 160 580)">
            <motion.g
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 7,
                delay: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <rect
                x="80"
                y="540"
                width="180"
                height="80"
                fill="#FFFFFF"
                stroke="rgba(11,29,58,0.20)"
                strokeWidth="1.5"
                filter="url(#paperShadow)"
              />
              <rect x="80" y="540" width="4" height="80" fill="#F47560" />
              <rect x="84" y="540" width="176" height="3" fill="#F47560" />
              <circle cx="246" cy="554" r="4" fill="#F0A933" />
              <rect x="98" y="558" width="120" height="3" fill="rgba(11,29,58,0.75)" />
              <rect x="98" y="568" width="100" height="2" fill="rgba(11,29,58,0.5)" />
              <rect x="98" y="585" width="20" height="10" fill="rgba(244,117,96,0.4)" />
            </motion.g>
          </g>

          {/* Card 2 (front) — slightly slower lift */}
          <g transform="rotate(1 180 600)">
            <motion.g
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 8,
                delay: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <rect
                x="100"
                y="560"
                width="180"
                height="80"
                fill="#FFFFFF"
                stroke="rgba(11,29,58,0.20)"
                strokeWidth="1.5"
                filter="url(#paperShadow)"
              />
              <rect x="100" y="560" width="4" height="80" fill="#1ABFAD" />
              <rect x="104" y="560" width="176" height="3" fill="#1ABFAD" />
              <circle cx="266" cy="574" r="4" fill="#5DC9A0" />
              <rect x="118" y="578" width="130" height="3" fill="rgba(11,29,58,0.75)" />
              <rect x="118" y="588" width="110" height="2" fill="rgba(11,29,58,0.5)" />
              <rect x="118" y="605" width="24" height="10" fill="rgba(26,191,173,0.4)" />
            </motion.g>
          </g>
        </motion.g>

        {/* TOP RIGHT — three pinned sticky notes wiggling at different rates */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          <motion.g
            animate={{ rotate: [-4, -2, -4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "1340px 180px" }}
          >
            <rect x="1290" y="130" width="100" height="100" fill="#F5D547" filter="url(#paperShadow)" />
            <circle cx="1340" cy="138" r="3" fill="rgba(11,29,58,0.7)" />
            <rect x="1305" y="155" width="70" height="2" fill="rgba(11,29,58,0.65)" />
            <rect x="1305" y="165" width="50" height="2" fill="rgba(11,29,58,0.55)" />
            <rect x="1305" y="175" width="60" height="2" fill="rgba(11,29,58,0.45)" />
          </motion.g>

          <motion.g
            animate={{ rotate: [3, 5, 3] }}
            transition={{
              duration: 5.5,
              delay: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "1240px 220px" }}
          >
            <rect x="1190" y="170" width="100" height="100" fill="#FFD3A8" filter="url(#paperShadow)" />
            <circle cx="1240" cy="178" r="3" fill="rgba(11,29,58,0.7)" />
            <rect x="1205" y="195" width="60" height="2" fill="rgba(11,29,58,0.65)" />
            <rect x="1205" y="205" width="70" height="2" fill="rgba(11,29,58,0.55)" />
            <rect x="1205" y="215" width="40" height="2" fill="rgba(11,29,58,0.45)" />
          </motion.g>

          <motion.g
            animate={{ rotate: [-2, 1, -2] }}
            transition={{
              duration: 7,
              delay: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "1380px 290px" }}
          >
            <rect x="1330" y="240" width="100" height="100" fill="#A8E6CF" filter="url(#paperShadow)" />
            <circle cx="1380" cy="248" r="3" fill="rgba(11,29,58,0.7)" />
            <rect x="1345" y="265" width="65" height="2" fill="rgba(11,29,58,0.65)" />
            <rect x="1345" y="275" width="55" height="2" fill="rgba(11,29,58,0.55)" />
          </motion.g>
        </motion.g>

        {/* BOTTOM LEFT — pencil at angle */}
        <motion.g
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
        >
          <g transform="rotate(-15 220 760)">
            <rect
              x="120"
              y="755"
              width="180"
              height="10"
              fill="#F5D547"
              stroke="rgba(11,29,58,0.3)"
              strokeWidth="1"
            />
            <rect x="120" y="755" width="18" height="10" fill="#FFAFA8" />
            <rect x="138" y="755" width="6" height="10" fill="rgba(11,29,58,0.4)" />
            <polygon points="300,755 310,760 300,765" fill="#D4A574" />
            <polygon points="308,758 314,760 308,762" fill="#0B1D3A" />
          </g>
        </motion.g>

        {/* Connector lines + traveling idea-dots — animateMotion is native
            SVG and avoids the offsetPath/offsetDistance complexity */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <motion.path
            d="M 280 250 Q 700 100, 1240 220"
            fill="none"
            stroke="rgba(26,191,173,0.4)"
            strokeWidth="1"
            strokeDasharray="3 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle r="5" fill="#1ABFAD">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path="M 280 250 Q 700 100, 1240 220"
              begin="1s"
            />
          </circle>

          <motion.path
            d="M 280 600 Q 800 700, 1280 700"
            fill="none"
            stroke="rgba(244,117,96,0.4)"
            strokeWidth="1"
            strokeDasharray="3 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{
              duration: 9,
              delay: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <circle r="5" fill="#F47560">
            <animateMotion
              dur="7s"
              repeatCount="indefinite"
              path="M 280 600 Q 800 700, 1280 700"
              begin="3s"
            />
          </circle>
        </motion.g>

        {/* Soft backdrop ONLY behind the message card — corners and edges
            of the desk scene stay fully visible */}
        <rect width="1600" height="900" fill="url(#cardBackdrop)" />
      </svg>
    </div>
  );
}
