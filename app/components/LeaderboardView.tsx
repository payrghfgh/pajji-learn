"use client";
import { motion } from "framer-motion";
import React from "react";

interface LeaderboardViewProps {
  leaderboardMode: "all" | "weekly";
  setLeaderboardMode: (mode: "all" | "weekly") => void;
  leaderboard: any[];
  weeklyLeaderboard: any[];
  user: any;
  getMemberTier: (mem: string, expiry: string) => string;
}

const POD_GRADIENT: Record<number, string> = {
  1: "linear-gradient(150deg, var(--amber), #9C6A00)",
  2: "linear-gradient(150deg, var(--azure), #1B5FA8)",
  3: "linear-gradient(150deg, var(--coral), #A83535)",
};

const POD_TEXT: Record<number, string> = {
  1: "#22160A",
  2: "#04121F",
  3: "#2A0C0C",
};

const displayName = (p: any) =>
  p?.uiSettings?.displayName || p?.email?.split("@")[0] || "Learner";

const initial = (p: any) => (displayName(p)[0] || "?").toUpperCase();

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboardMode,
  setLeaderboardMode,
  leaderboard,
  weeklyLeaderboard,
  user,
}) => {
  const data = leaderboardMode === "weekly" ? weeklyLeaderboard : leaderboard;
  const p1 = data[0];
  const p2 = data[1];
  const p3 = data[2];
  const rest = data.slice(3);

  const meIndex = data.findIndex((d) => d.id === user?.uid);
  const me = meIndex >= 0 ? data[meIndex] : null;
  const above = meIndex > 0 ? data[meIndex - 1] : null;
  const gap = above && me ? (above.xp || 0) - (me.xp || 0) : 0;

  const Pod = ({ p, place }: { p: any; place: 1 | 2 | 3 }) =>
    !p ? null : (
      <div
        style={{
          borderRadius: "var(--r-l)",
          border: `1px solid ${place === 1 ? "color-mix(in oklab, var(--amber) 50%, transparent)" : "var(--line-2)"}`,
          background:
            place === 1
              ? "linear-gradient(180deg, color-mix(in oklab, var(--amber) 13%, transparent), var(--ink-1))"
              : "linear-gradient(180deg, var(--ink-3), var(--ink-1))",
          padding: "20px",
          paddingTop: place === 1 ? "30px" : "20px",
          textAlign: "center",
        }}
      >
        {place === 1 && (
          <span
            style={{
              display: "inline-block",
              marginBottom: "10px",
              fontSize: "12px",
              fontWeight: "500",
              color: "var(--amber)",
              background: "color-mix(in oklab, var(--amber) 14%, transparent)",
              border: "1px solid color-mix(in oklab, var(--amber) 14%, transparent)",
              borderRadius: "999px",
              padding: "5px 10px",
            }}
          >
            ★ Champion
          </span>
        )}
        <div style={{ fontSize: place === 1 ? "36px" : "30px", margin: place === 1 ? "6px 0 8px" : "0 0 8px" }}>
          {place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉"}
        </div>
        <div
          style={{
            width: place === 1 ? "64px" : "52px",
            height: place === 1 ? "64px" : "52px",
            borderRadius: place === 1 ? "18px" : "16px",
            margin: "0 auto 10px",
            background: POD_GRADIENT[place],
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--disp)",
            fontWeight: 800,
            fontSize: place === 1 ? "24px" : "20px",
            color: POD_TEXT[place],
          }}
        >
          {initial(p)}
        </div>
        <div style={{ fontWeight: 700, fontSize: place === 1 ? "16px" : "14px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName(p)}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: place === 1 ? "var(--amber)" : "var(--dim)", marginTop: "2px" }}>
          {(p.xp || 0).toLocaleString()} XP
        </div>
      </div>
    );

  const Row = ({ p, rank }: { p: any; rank: number }) => {
    const isMe = p.id === user?.uid;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "13px 16px",
          borderRadius: "var(--r-m)",
          border: `1px solid ${isMe ? "color-mix(in oklab, var(--jade) 40%, transparent)" : "var(--line)"}`,
          background: isMe ? "var(--jade-soft)" : "var(--ink-2)",
        }}
      >
        <span style={{ fontFamily: "var(--mono)", width: "26px", color: isMe ? "var(--jade)" : "var(--dim)" }}>{rank}</span>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "11px",
            background: isMe ? "var(--jade)" : "var(--ink-4)",
            color: isMe ? "var(--ink-on-accent)" : "var(--text)",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--disp)",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initial(p)}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontWeight: isMe ? 700 : 600, fontSize: "14px", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName(p)}</span>
          {isMe && (
            <span style={{ flexShrink: 0, fontSize: "11px", color: "var(--jade)", background: "var(--jade-soft)", border: "1px solid color-mix(in oklab, var(--jade) 40%, transparent)", borderRadius: "999px", padding: "3px 8px" }}>
              You
            </span>
          )}
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: isMe ? "var(--jade)" : "var(--text)", flexShrink: 0 }}>
          {(p.xp || 0).toLocaleString()} XP
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-shell"
      style={{ maxWidth: "none", padding: "26px 30px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "22px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 className="sa-h1" style={{ margin: 0 }}>Hall of Pajji</h1>
          <p style={{ margin: "6px 0 0", color: "var(--dim)", fontSize: "13.5px" }}>
            {leaderboardMode === "weekly" ? "This week's rankings" : "All-time rankings"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { key: "weekly", label: "Weekly" },
            { key: "all", label: "All time" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setLeaderboardMode(m.key as "all" | "weekly")}
              style={{
                fontSize: "12px",
                fontWeight: "500",
                padding: "5px 10px",
                borderRadius: "999px",
                cursor: "pointer",
                color: leaderboardMode === m.key ? "var(--jade)" : "var(--dim)",
                background: leaderboardMode === m.key ? "var(--jade-soft)" : "transparent",
                border: `1px solid ${leaderboardMode === m.key ? "var(--jade-soft)" : "var(--line)"}`,
              }}
            >
              {m.label}
            </button>
          ))}
          <button
            aria-disabled="true"
            title="No friends feature yet"
            style={{ fontSize: "12px", fontWeight: "500", padding: "5px 10px", borderRadius: "999px", color: "var(--faint)", background: "transparent", border: "1px solid var(--line)", cursor: "not-allowed", opacity: 0.6 }}
          >
            Friends
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line-2)", borderRadius: "var(--r-m)", color: "var(--faint)", fontSize: "13px" }}>
          No rankings yet.
        </div>
      ) : (
        <>
          <div className="lb-podium" style={{ marginBottom: "22px" }}>
            <Pod p={p2} place={2} />
            <Pod p={p1} place={1} />
            <Pod p={p3} place={3} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {rest.map((p, i) => (
              <Row key={p.id || i} p={p} rank={i + 4} />
            ))}
          </div>

          {above && me && gap > 0 && (
            <div className="card" style={{ marginTop: "20px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", borderColor: "color-mix(in oklab, var(--jade) 35%, transparent)", flexWrap: "wrap" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "var(--jade-soft)", color: "var(--jade)", display: "grid", placeItems: "center", fontSize: "20px", flexShrink: 0 }}>
                ↗
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
                  You're {gap.toLocaleString()} XP from {meIndex}th place
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};
