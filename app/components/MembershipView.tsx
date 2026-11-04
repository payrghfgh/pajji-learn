"use client";
import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface MembershipViewProps {
  memTier: string;
  setView: (v: string) => void;
  handleCardMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCardMouseLeave: () => void;
  rotateX: any;
  rotateY: any;
  shineBackground: any;
  user: any;
  getUserName: (u: any) => string;
  profilePic: string;
  membershipExpiry: string;
  getDayDiff: (from: string, to: string) => number;
  getLocalDateKey: () => string;
  userData: any;
  db: any;
  setSaveStatus: (v: string) => void;
}

const FEATS: Record<string, string[]> = {
  free: [
    "All 4 subjects, 480 chapters",
    "Flashcards & spaced repetition",
    "Quizzes & AI study buddy",
    "Notes, pinned key points & export",
    "Leaderboard & achievements",
    "Focus Flight focus timer",
    "12 themes — 6 ready, 6 by achievement",
  ],
  plus: [
    "Everything in Free",
    "5% Pajji bonus",
    "5% more food at the counter",
    "Benefits across all Pajji apps",
    "Basic PSS — stationery service",
    "13 themes — adds Williams Blue",
    "Quiz skips at 10 XP",
    "Plus title beside your name",
  ],
  pro: [
    "Everything in Plus",
    "10% Pajji bonus",
    "10% more food",
    "Full PSS access",
    "Free quiz skips (0 XP)",
    "Premium focus music unlocked",
    "Pro crown beside your name",
  ],
  ultra: [
    "Everything in Pro",
    "25% Pajji bonus",
    "25% more food",
    "Full PSS Premium + PPS protection",
    "2× XP on every answer",
    "All 15 themes, incl. Zenith Gold & Midnight",
    "Custom study themes",
    "Ultra title beside your name",
  ],
};

const TIERS = [
  { key: "free", label: "Free", labelColor: "var(--dim)", pill: "Your plan", pillColor: "var(--dim)", pillBg: "transparent", title: "Everything you need to study", button: null, footer: "Title: none", hot: false },
  { key: "plus", label: "Plus", labelColor: "var(--azure)", pill: "+ title", pillColor: "var(--azure)", pillBg: "var(--azure-soft)", title: "A little extra, on the house", button: "Contact Rushan", footer: null, hot: false },
  { key: "pro", label: "Pro", labelColor: "var(--jade)", pill: null, pillColor: "var(--jade)", pillBg: "var(--jade-soft)", title: "For the regulars", button: "Contact Rushan", footer: null, hot: true },
  { key: "ultra", label: "◆ Ultra", labelColor: "var(--amber)", pill: null, pillColor: "var(--amber)", pillBg: "color-mix(in oklab, var(--amber) 14%, transparent)", title: "Everything, plus a human", button: "Contact Rushan", footer: null, hot: false },
];

export const MembershipView: React.FC<MembershipViewProps> = ({ memTier, setView }) => {
  return (
    <motion.div
      key="membership"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="page-shell"
      style={{ maxWidth: "none", padding: "26px 30px" }}
    >
      <button
        onClick={() => setView("settings")}
        className="btn-link"
        style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
      >
        <ChevronLeft size={16} /> Back to Settings
      </button>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "18px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 className="sa-h1" style={{ margin: 0 }}>Membership</h1>
          <p style={{ margin: "6px 0 0", color: "var(--dim)", fontSize: "13.5px" }}>
            Free for the people who show up. No cards, no subscriptions, no checkout.
          </p>
        </div>
        <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--jade)", background: "var(--jade-soft)", border: "1px solid var(--jade-soft)", borderRadius: "999px", padding: "5px 10px", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          ✓ Every study feature is free
        </span>
      </div>

      <div
        className="card"
        style={{
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          marginBottom: "18px",
          borderColor: "color-mix(in oklab, var(--jade) 35%, transparent)",
          background: "linear-gradient(120deg,color-mix(in oklab, var(--jade) 10%, transparent),var(--ink-1))",
          flexWrap: "wrap",
        }}
      >
        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--jade-soft)", color: "var(--jade)", display: "grid", placeItems: "center", fontSize: "24px", flexShrink: 0 }}>
          🤝
        </div>
        <div style={{ flex: 1, minWidth: "240px" }}>
          <div style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "17px", letterSpacing: "-.015em", color: "var(--text)" }}>
            It's not a purchase — it's a barter between friends.
          </div>
          <div style={{ color: "var(--dim)", fontSize: "13px", marginTop: "4px" }}>
            You help out with Pajji Services, you get the perks back. That's the whole system. Contact Rushan on WhatsApp or face to face to get set up.
          </div>
        </div>
        <button
          aria-disabled="true"
          title="No contact link configured yet"
          style={{ flex: "0 0 auto", padding: "10px 18px", borderRadius: "12px", background: "var(--ink-3)", color: "var(--faint)", fontWeight: 800, border: "1px solid var(--line)", cursor: "not-allowed", opacity: 0.7 }}
        >
          Contact Rushan →
        </button>
      </div>

      <div className="membership-tiers">
        {TIERS.map((t) => {
          const isCurrent = (memTier || "free") === t.key;
          return (
            <div
              key={t.key}
              style={{
                borderRadius: "var(--r-xl)",
                border: `1px solid ${t.hot ? "color-mix(in oklab, var(--jade) 55%, transparent)" : "var(--line-2)"}`,
                background: t.hot ? "linear-gradient(180deg,color-mix(in oklab, var(--jade) 10%, transparent),var(--ink-1))" : "linear-gradient(180deg,var(--ink-2),var(--ink-1))",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {t.hot && (
                <span style={{ position: "absolute", top: "14px", right: "14px", fontFamily: "var(--disp)", fontWeight: 800, fontSize: "12px", letterSpacing: ".02em", padding: "7px 12px", borderRadius: "10px", background: "var(--jade)", color: "var(--ink-on-accent)", transform: "rotate(5deg)" }}>
                  Recommended
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: t.labelColor }}>
                  {t.label}
                </span>
                {t.pill && (
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: t.pillColor, background: t.pillBg, border: `1px solid ${t.pillBg === "transparent" ? "var(--line)" : t.pillBg}`, borderRadius: "999px", padding: "4px 9px" }}>
                    {t.pill}
                  </span>
                )}
                {!t.pill && isCurrent && (
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--jade)", border: "1px solid var(--jade-soft)", background: "var(--jade-soft)", borderRadius: "999px", padding: "4px 9px" }}>
                    Your plan
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "var(--disp)", fontWeight: 800, fontSize: "24px", letterSpacing: "-.02em", color: "var(--text)" }}>
                {t.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "4px" }}>
                {FEATS[t.key].map((f) => (
                  <div key={f} style={{ display: "flex", gap: "10px", fontSize: "13.5px", color: "var(--dim)" }}>
                    <b style={{ color: "var(--jade)" }}>✓</b> {f}
                  </div>
                ))}
              </div>
              {t.footer ? (
                <div style={{ marginTop: "auto", textAlign: "center", fontSize: "12px", color: "var(--dim)", border: "1px solid var(--line)", borderRadius: "999px", padding: "6px 10px" }}>
                  {t.footer}
                </div>
              ) : (
                <button
                  aria-disabled="true"
                  title="No contact link configured yet"
                  style={{ marginTop: "auto", padding: "9px 14px", borderRadius: "12px", fontWeight: 800, fontSize: "13px", border: "1px solid var(--line)", background: "var(--ink-3)", color: "var(--faint)", cursor: "not-allowed", opacity: 0.7 }}
                >
                  {t.button}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: "18px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
        <span style={{ flex: "0 0 auto", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--faint)" }}>
          What actually differs
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "var(--dim)", border: "1px solid var(--line)", borderRadius: "999px", padding: "5px 10px" }}>Free · 12 themes (6 ready + 6 by achievement)</span>
          <span style={{ color: "var(--faint)" }}>→</span>
          <span style={{ fontSize: "12px", color: "var(--azure)", background: "var(--azure-soft)", border: "1px solid var(--azure-soft)", borderRadius: "999px", padding: "5px 10px" }}>Plus · + Williams Blue (13)</span>
          <span style={{ color: "var(--faint)" }}>→</span>
          <span style={{ fontSize: "12px", color: "var(--jade)", background: "var(--jade-soft)", border: "1px solid var(--jade-soft)", borderRadius: "999px", padding: "5px 10px" }}>Pro · + premium music</span>
          <span style={{ color: "var(--faint)" }}>→</span>
          <span style={{ fontSize: "12px", color: "var(--amber)", background: "color-mix(in oklab, var(--amber) 14%, transparent)", border: "1px solid color-mix(in oklab, var(--amber) 14%, transparent)", borderRadius: "999px", padding: "5px 10px" }}>Ultra · all 15 + custom themes</span>
        </div>
        <span style={{ flex: "0 0 auto", fontSize: "12px", color: "var(--dim)", border: "1px solid var(--line)", borderRadius: "999px", padding: "5px 10px" }}>
          Titles: none · + · ♛ · U
        </span>
      </div>
    </motion.div>
  );
};
