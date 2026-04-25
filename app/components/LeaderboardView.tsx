"use client";
import { motion } from "framer-motion";
import { Crown, Zap, Sparkles, Flame, Star, Heart, Brain, Send, Plus } from "lucide-react";
import React from "react";

interface LeaderboardViewProps {
  leaderboardMode: "all" | "weekly";
  setLeaderboardMode: (mode: "all" | "weekly") => void;
  leaderboard: any[];
  weeklyLeaderboard: any[];
  user: any;
  getMemberTier: (mem: string, expiry: string) => string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboardMode,
  setLeaderboardMode,
  leaderboard,
  weeklyLeaderboard,
  user,
  getMemberTier
}) => {
  const data = leaderboardMode === "weekly" ? weeklyLeaderboard : leaderboard;
  const p1 = data[0];
  const p2 = data[1];
  const p3 = data[2];

  const getBadgeIcon = (p: any) => {
    const pt = getMemberTier(p.membership || "", p.membershipExpiry || "");
    if (pt === "free" || !pt) return null;
    
    const color = pt === "ultra" ? "#FFD700" : pt === "pro" ? "#3B82F6" : "#A78BFA";
    
    if (pt === "ultra") {
      return (
        <span style={{ 
          display: "inline-flex", 
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0px 0px 4px rgba(255, 215, 0, 0.4))",
          marginLeft: "4px",
          fontWeight: "900",
          fontFamily: "var(--font-syne)",
          color: color,
          fontSize: "15px",
          lineHeight: "1"
        }}>
          U
        </span>
      );
    }
    
    if (pt === "pro") {
      return <Crown size={16} fill={color} stroke={color} style={{ marginLeft: "4px" }} />;
    }
    
    return (
      <span style={{ marginLeft: "4px", display: "inline-flex", alignItems: "center" }}>
        <Plus size={16} color={color} strokeWidth={3} />
      </span>
    );
  };

  return (
    <motion.div
      key="leaderboard"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}
    >
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#ffb300" />
            <stop offset="100%" stopColor="#fff8b0" />
          </linearGradient>
        </defs>
      </svg>
      <h1 className="page-title" style={{ textAlign: "center", marginBottom: "40px", fontFamily: "var(--font-syne)", fontWeight: "800" }}>Hall of Fame 🏆</h1>
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "48px" }}>
        <button className="btn btn-secondary" onClick={() => setLeaderboardMode("all")} style={{ borderRadius: "20px", background: leaderboardMode === "all" ? "var(--accent)" : "var(--input-bg)", color: leaderboardMode === "all" ? "white" : "var(--text)", border: "none", fontSize: "14px", fontWeight: "700", padding: "8px 24px" }}>All Time</button>
        <button className="btn btn-secondary" onClick={() => setLeaderboardMode("weekly")} style={{ borderRadius: "20px", background: leaderboardMode === "weekly" ? "var(--accent)" : "var(--input-bg)", color: leaderboardMode === "weekly" ? "white" : "var(--text)", border: "none", fontSize: "14px", fontWeight: "700", padding: "8px 24px" }}>Weekly</button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "16px", marginBottom: "56px", width: "100%", padding: "0 10px" }}>
        {/* Rank 2 */}
        {p2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ flex: 1, textAlign: "center", minWidth: "100px", maxWidth: "160px" }}>
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--input-bg)", border: "3px solid #C0C0C0", margin: "0 auto", display: "grid", placeItems: "center", fontSize: "22px", fontWeight: "900", color: "#C0C0C0" }}>
                {p2.email?.[0].toUpperCase()}
              </div>
              <div style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", background: "#C0C0C0", color: "white", padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "900" }}>2nd</div>
            </div>
            <p style={{ fontWeight: "700", fontSize: "13px", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              {p2.uiSettings?.displayName || p2.email?.split('@')[0]}
              {getBadgeIcon(p2)}
            </p>
            <p style={{ fontFamily: "var(--font-syne)", fontWeight: "800", fontSize: "13px", color: "var(--accent)" }}>{leaderboardMode === "weekly" ? (p2.weeklyXP || 0) : (p2.xp || 0)} XP</p>
          </motion.div>
        )}

        {/* Rank 1 */}
        {p1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} style={{ flex: 1, textAlign: "center", minWidth: "130px", maxWidth: "200px", transform: "scale(1.15)", zIndex: 2 }}>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <div style={{ width: "88px", height: "88px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #F59E0B)", border: "4px solid white", margin: "0 auto", display: "grid", placeItems: "center", fontSize: "32px", fontWeight: "900", color: "white", boxShadow: "0 10px 25px rgba(245, 158, 11, 0.5)" }}>
                {p1.email?.[0].toUpperCase()}
              </div>
              <div style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", background: "#FFD700", color: "black", padding: "4px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: "900", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>1st</div>
              <Crown size={28} fill="#FFD700" color="#FFD700" style={{ position: "absolute", top: "-24px", left: "50%", transform: "translateX(-50%) rotate(-15deg)" }} />
            </div>
            <p style={{ fontWeight: "800", fontSize: "16px", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              {p1.uiSettings?.displayName || p1.email?.split('@')[0]}
              {getBadgeIcon(p1)}
            </p>
            <p style={{ fontFamily: "var(--font-syne)", fontWeight: "900", fontSize: "16px", color: "var(--accent)" }}>{leaderboardMode === "weekly" ? (p1.weeklyXP || 0) : (p1.xp || 0)} XP</p>
          </motion.div>
        )}

        {/* Rank 3 */}
        {p3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ flex: 1, textAlign: "center", minWidth: "100px", maxWidth: "160px" }}>
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--input-bg)", border: "3px solid #CD7F32", margin: "0 auto", display: "grid", placeItems: "center", fontSize: "22px", fontWeight: "900", color: "#CD7F32" }}>
                {p3.email?.[0].toUpperCase()}
              </div>
              <div style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", background: "#CD7F32", color: "white", padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "900" }}>3rd</div>
            </div>
            <p style={{ fontWeight: "700", fontSize: "13px", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              {p3.uiSettings?.displayName || p3.email?.split('@')[0]}
              {getBadgeIcon(p3)}
            </p>
            <p style={{ fontFamily: "var(--font-syne)", fontWeight: "800", fontSize: "13px", color: "var(--accent)" }}>{leaderboardMode === "weekly" ? (p3.weeklyXP || 0) : (p3.xp || 0)} XP</p>
          </motion.div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {data.slice(3).map((p, i) => {
          const pt = getMemberTier(p.membership || "", p.membershipExpiry || "");
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card" style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "12px 24px", background: p.id === user?.uid ? "rgba(var(--accent-rgb), 0.1)" : "var(--card)", border: p.id === user?.uid ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: "16px", transform: "none" }}
            >
              <span style={{ width: "40px", fontWeight: "900", color: "var(--muted)", fontSize: "14px", fontFamily: "var(--font-syne)" }}>#{i + 4}</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--input-bg)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: "900", marginRight: "16px" }}>{p.email?.[0].toUpperCase()}</div>
              <span style={{ flex: 1, fontWeight: "700", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                {p.uiSettings?.displayName || p.email?.split('@')[0]}
                {getBadgeIcon(p)}
              </span>
              <span style={{ fontFamily: "var(--font-syne)", fontWeight: "800", fontSize: "15px", background: "var(--accent-soft)", color: "var(--accent)", padding: "6px 16px", borderRadius: "12px" }}>{leaderboardMode === "weekly" ? (p.weeklyXP || 0) : (p.xp || 0)} XP</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
