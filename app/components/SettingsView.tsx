"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, User, LogOut, Crown, Zap, Sparkles, Star, Flame, Heart, Brain, Send, 
  Moon, Sun, Volume2, Eye, Move, Layout, MessageSquare, Trash2, CheckCircle, ChevronRight
} from "lucide-react";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";

interface SettingsViewProps {
  isOwner: boolean;
  mobileQuickSettings: boolean;
  setMobileQuickSettings: (v: boolean) => void;
  setView: (v: string) => void;
  giftUserSearch: string;
  setGiftUserSearch: (v: string) => void;
  giftUserResults: any[];
  setGiftUserResults: (v: any[]) => void;
  setSaveStatus: (v: string) => void;
  allFeedback: any[];
  fetchFeedback: () => void;
  db: any;
  user: any;
  membership: string;
  membershipExpiry: string;
  profilePic: string;
  setProfilePic: (v: string) => void;
  getUserName: (u: any) => string;
  signOut: (a: any) => void;
  auth: any;
  memTier: string;
  streakCount: number;
  dailyGoal: number;
  updateDailyGoal: (n: number) => void;
  plusOnlyThemeIds: string[];

  // New props for full settings
  theme: 'dark' | 'light';
  setTheme: (v: 'dark' | 'light') => void;
  uiTheme: string;
  setUiTheme: (v: string) => void;
  textSize: "compact" | "default" | "large";
  setTextSize: (v: "compact" | "default" | "large") => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  sidebarDensity: "comfortable" | "compact";
  setSidebarDensity: (v: "comfortable" | "compact") => void;
  sidebarStyle: "default" | "floating" | "minimal";
  setSidebarStyle: (v: "default" | "floating" | "minimal") => void;
  aiPersonality: "coach" | "mentor" | "chill";
  setAiPersonality: (v: "coach" | "mentor" | "chill") => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  isZenMode: boolean;
  setIsZenMode: (v: boolean) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  unlockedAchievements: string[];
  adminOnlyThemeIds: string[];
  giftedThemes: string[];
  customThemes: any[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isOwner,
  mobileQuickSettings,
  setMobileQuickSettings,
  setView,
  giftUserSearch,
  setGiftUserSearch,
  giftUserResults,
  setGiftUserResults,
  setSaveStatus,
  allFeedback,
  fetchFeedback,
  db,
  user,
  membership,
  membershipExpiry,
  profilePic,
  setProfilePic,
  getUserName,
  signOut,
  auth,
  memTier,
  streakCount,
  dailyGoal, updateDailyGoal, plusOnlyThemeIds,

  theme, setTheme,
  uiTheme, setUiTheme,
  textSize, setTextSize,
  reduceMotion, setReduceMotion,
  highContrast, setHighContrast,
  sidebarDensity, setSidebarDensity,
  sidebarStyle, setSidebarStyle,
  aiPersonality, setAiPersonality,
  soundEnabled, setSoundEnabled,
  isZenMode, setIsZenMode,
  displayName, setDisplayName,
  unlockedAchievements,
  adminOnlyThemeIds,
  giftedThemes,
  customThemes
}) => {
  // Sections render in one column now; the old tab switcher is gone. Feedback is
  // still loaded for owners, once, guarded so a changing prop identity cannot
  // loop it.
  const adminFetched = React.useRef(false);
  React.useEffect(() => {
    if (isOwner && !adminFetched.current) {
      adminFetched.current = true;
      fetchFeedback();
    }
  }, [isOwner, fetchFeedback]);

  const tierLabel = (t: string) => {
    const n = (t || "").toUpperCase().replace(/[\s_]+/g, "");
    if (n === "PAJJIPLUS") return "Pajji Plus";
    if (n === "PAJJIPRO") return "Pajji Pro";
    if (n === "PAJJIULTRA") return "Pajji Ultra";
    return "None";
  };

  const isExpired = (expiry: string) => expiry && new Date(expiry) < new Date();
  const defaultExpiry = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; };

  const themeAchievementRequirements: Record<string, string> = {
    ocean: "five_masteries",
    sunset: "streak_7",
    cyber: "xp_1000",
    nebula: "streak_21",
    emerald: "xp_10000",
    arctic: "fifty_masteries", // was hundred_masteries: no such achievement exists
  };

  const builtInThemeCards = [
    { key: "default", label: "Default", accent: "#10b981", bg: "linear-gradient(135deg,#f8fafc,#ecfeff)" },
    { key: "f1", label: "F1", accent: "#e10600", bg: "linear-gradient(135deg,#0b0b0c,#2a2a2e)" },
    { key: "liquid", label: "Glass", accent: "#45b7ff", bg: "linear-gradient(135deg,#dff3ff,#f3f8ff)" },
    { key: "amoled", label: "AMOLED", accent: "#29f2a3", bg: "linear-gradient(135deg,#000,#0b0b0b)" },
    { key: "paper", label: "Paper", accent: "#6e5435", bg: "linear-gradient(135deg,#f6efe2,#fffaf1)" },
    { key: "ocean", label: "Ocean", accent: "#0ea5e9", bg: "linear-gradient(135deg,#e0f2fe,#cffafe)" },
    { key: "sunset", label: "Sunset", accent: "#f97316", bg: "linear-gradient(135deg,#fff3ec,#ffe4e6)" },
    { key: "cyber", label: "Cyber", accent: "#22d3ee", bg: "linear-gradient(135deg,#0f172a,#1e293b)" },
    { key: "emoji", label: "Emoji Party 🎉", accent: "#f59e0b", bg: "linear-gradient(135deg,#fff7ed,#ffedd5)" },
    { key: "nebula", label: "Nebula", accent: "#a78bfa", bg: "linear-gradient(135deg,#1b1038,#2f1f69)" },
    { key: "emerald", label: "Emerald", accent: "#22c55e", bg: "linear-gradient(135deg,#022c22,#14532d)" },
    { key: "arctic", label: "Arctic", accent: "#38bdf8", bg: "linear-gradient(135deg,#dbeafe,#ecfeff)" },
    { key: "williams", label: "Williams Blue", accent: "#3267D4", bg: "linear-gradient(135deg,#eef2ff,#e0e7ff)" },
    { key: "zenith", label: "Zenith Gold 💎", accent: "#FFD700", bg: "linear-gradient(135deg,#0f0f10,#2a2100)" },
    { key: "midnight", label: "Midnight 🌌", accent: "#A855F7", bg: "linear-gradient(135deg,#000,#1a0b2e)" },
  ];

  // Display labels for the achievement gates. The gate ids live in
  // themeAchievementRequirements above; this is presentation only.
  const requirementLabel: Record<string, string> = {
    five_masteries: "5 masteries",
    streak_7: "7-day streak",
    xp_1000: "1,000 XP",
    streak_21: "21-day streak",
    xp_10000: "10,000 XP",
    fifty_masteries: "50 masteries",
  };

  const hasThemeAccess = (themeId: string) => {
    const isAdminOnly = adminOnlyThemeIds.includes(themeId);
    const adminAccess = !isAdminOnly || isOwner || giftedThemes.includes(themeId);
    const requiredAchievementId = themeAchievementRequirements[themeId];
    const achievementAccess = !requiredAchievementId || isOwner || unlockedAchievements.includes(requiredAchievementId);
    const isPremium = ["zenith", "midnight"].includes(themeId);
    const membershipAccess = !isPremium || memTier === "ultra" || isOwner;
    const plusAccess = !plusOnlyThemeIds.includes(themeId) || memTier === "plus" || memTier === "pro" || memTier === "ultra" || isOwner;
    return adminAccess && achievementAccess && membershipAccess && plusAccess;
  };

  // Derived from the same gate map the grid reads, so the header can never
  // disagree with the cards. Plus is checked before achievement because a
  // Plus-gated theme could also carry an achievement requirement.
  const gateCounts = builtInThemeCards.reduce(
    (acc, t) => {
      if (["zenith", "midnight"].includes(t.key)) acc.ultra++;
      else if (plusOnlyThemeIds.includes(t.key)) acc.plus++;
      else if (themeAchievementRequirements[t.key]) acc.achievement++;
      else acc.ready++;
      return acc;
    },
    { ready: 0, plus: 0, achievement: 0, ultra: 0 }
  );

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="page-shell" style={{ maxWidth: "800px" }}
    >
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "700", letterSpacing: "-0.02em", color: "var(--text)" }}>Settings</h1>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
          {[
            { label: "Ready", n: gateCounts.ready, color: "var(--jade)", bg: "var(--jade-soft)" },
            { label: "Plus", n: gateCounts.plus, color: "var(--azure)", bg: "var(--azure-soft)" },
            { label: "By achievement", n: gateCounts.achievement, color: "var(--amber)", bg: "color-mix(in oklab, var(--amber) 14%, transparent)" },
            { label: "Ultra", n: gateCounts.ultra, color: "var(--coral)", bg: "var(--coral-soft)" },
          ].map(p => (
            <span key={p.label} style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em", color: p.color, background: p.bg, border: `1px solid ${p.bg}`, borderRadius: "999px", padding: "4px 10px", whiteSpace: "nowrap" }}>
              {p.label} {p.n}
            </span>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {(
          <motion.div key="account-settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="settings-section" style={{ marginBottom: "24px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
                <div className={`${streakCount >= 7 ? "streak-aura" : ""} ${memTier === "ultra" ? "ultra-glow" : ""}`} style={{ width: "80px", height: "80px", borderRadius: "24px", background: "var(--accent-grad)", display: "grid", placeItems: "center", overflow: "hidden", border: "2px solid var(--border)", flexShrink: 0 }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "900" }}>{displayName || getUserName(user)}</h2>
                  <p style={{ fontSize: "14px", color: "var(--muted)" }}>{user?.email}</p>
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span className="xp-badge">{tierLabel(membership)}</span>
                    {membershipExpiry && (
                      <span style={{ fontSize: "11px", color: isExpired(membershipExpiry) ? "var(--coral)" : "var(--muted)", fontWeight: "700" }}>
                        {isExpired(membershipExpiry) ? "Expired" : `Expires: ${membershipExpiry}`}
                      </span>
                    )}
                    <button onClick={() => setView("membership")} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Crown size={12} /> {membership ? "View Benefits" : "Get Premium"}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="input-label">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" style={{ width: "100%" }} />
                </div>
                <div>
                  <label className="input-label">Profile Picture URL</label>
                  <input type="text" value={profilePic} onChange={(e) => setProfilePic(e.target.value)} placeholder="https://..." style={{ width: "100%" }} />
                </div>
                <button onClick={() => signOut(auth)} className="btn btn-secondary" style={{ color: "var(--coral)", borderColor: "var(--coral-soft)", marginTop: "12px" }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Study preferences. The daily goal is the only study preference the app
            actually stores and persists, so it is the only control here. */}
        <motion.div key="study-prefs" className="settings-section" style={{ marginBottom: "24px" }}>
          <div className="card" style={{ padding: "24px" }}>
            <h3 className="section-title">Study preferences</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontWeight: "700", margin: 0 }}>Daily goal</h4>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0" }}>Lessons you aim to finish each day.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <button
                  onClick={() => updateDailyGoal(dailyGoal - 1)}
                  disabled={dailyGoal <= 1}
                  aria-label="Decrease daily goal"
                  style={{ width: "32px", height: "32px", borderRadius: "var(--r-s)", background: "var(--ink-3)", border: "1px solid var(--line)", color: "var(--text)", cursor: dailyGoal <= 1 ? "not-allowed" : "pointer", opacity: dailyGoal <= 1 ? 0.4 : 1 }}
                >
                  −
                </button>
                <span style={{ minWidth: "28px", textAlign: "center", fontSize: "16px", fontWeight: "800", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{dailyGoal}</span>
                <button
                  onClick={() => updateDailyGoal(dailyGoal + 1)}
                  disabled={dailyGoal >= 10}
                  aria-label="Increase daily goal"
                  style={{ width: "32px", height: "32px", borderRadius: "var(--r-s)", background: "var(--ink-3)", border: "1px solid var(--line)", color: "var(--text)", cursor: dailyGoal >= 10 ? "not-allowed" : "pointer", opacity: dailyGoal >= 10 ? 0.4 : 1 }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {(
          <motion.div key="appearance-settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="settings-section" style={{ marginBottom: "24px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h3 className="section-title">Global Theme</h3>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setTheme("dark")} className={`btn ${theme === "dark" ? "btn-primary" : "btn-secondary"}`} style={{ flex: 1 }}>
                    <Moon size={16} /> Dark
                  </button>
                  <button disabled title="Light mode coming soon" className="btn btn-secondary" style={{ flex: 1, opacity: 0.35, cursor: "not-allowed" }}>
                    <Sun size={16} /> Light
                  </button>
                </div>
              </div>

              <div>
                <h3 className="section-title">Themes</h3>
                {/* 5 x 3. Each card carries the real gate as its status line, read
                    from the same maps hasThemeAccess uses -- so a card can never
                    claim a gate the check does not apply. */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                  {builtInThemeCards.map((t) => {
                    const locked = !hasThemeAccess(t.key);
                    const requiredId = themeAchievementRequirements[t.key];
                    const status = ["zenith", "midnight"].includes(t.key)
                      ? "Ultra only"
                      : plusOnlyThemeIds.includes(t.key)
                        ? "Plus only"
                        : requiredId
                          ? (requirementLabel[requiredId] || requiredId)
                          : adminOnlyThemeIds.includes(t.key)
                            ? "Admin only"
                            : "Ready";
                    return (
                      <button
                        key={t.key}
                        onClick={() => !locked && setUiTheme(t.key)}
                        aria-disabled={locked}
                        title={locked ? `Locked — ${status}` : t.label}
                        style={{
                          padding: "10px",
                          borderRadius: "var(--r-m)",
                          border: uiTheme === t.key ? "2px solid var(--jade)" : "1px solid var(--line)",
                          background: t.bg,
                          cursor: locked ? "not-allowed" : "pointer",
                          textAlign: "left",
                          opacity: locked ? 0.55 : 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          minHeight: "64px",
                          justifyContent: "center"
                        }}
                      >
                        <span style={{ color: t.accent, fontWeight: "800", fontSize: "12px" }}>{t.label}</span>
                        <span style={{ color: t.accent, opacity: 0.75, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>{status}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(
          <motion.div key="app-settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="settings-section" style={{ marginBottom: "24px" }}>
            <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="setting-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontWeight: "700" }}>Sound Effects</h4>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>Play UI and game sounds</p>
                </div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`btn ${soundEnabled ? "btn-primary" : "btn-secondary"}`} style={{ padding: "8px 16px" }}>
                  <Volume2 size={16} /> {soundEnabled ? "On" : "Off"}
                </button>
              </div>

              <div className="setting-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontWeight: "700" }}>Focus (Zen) Mode</h4>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>Toggle 25-minute study timer</p>
                </div>
                <button onClick={() => setIsZenMode(!isZenMode)} className={`btn ${isZenMode ? "btn-primary" : "btn-secondary"}`} style={{ padding: "8px 16px" }}>
                  <Brain size={16} /> {isZenMode ? "Active" : "Enable"}
                </button>
              </div>

              <div className="setting-row">
                <h4 style={{ fontWeight: "700", marginBottom: "8px" }}>Text Scaling</h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["compact", "default", "large"].map(s => (
                    <button key={s} onClick={() => setTextSize(s as any)} className={`btn ${textSize === s ? "btn-primary" : "btn-secondary"}`} style={{ flex: 1, textTransform: "capitalize" }}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <h4 style={{ fontWeight: "700", marginBottom: "8px" }}>Sidebar Style</h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["default", "floating", "minimal"].map(s => (
                    <button key={s} onClick={() => setSidebarStyle(s as any)} className={`btn ${sidebarStyle === s ? "btn-primary" : "btn-secondary"}`} style={{ flex: 1, textTransform: "capitalize" }}>{s}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="card" style={{ padding: "12px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "8px" }}>Accessibility</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                      <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} /> Reduce Motion
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                      <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} /> High Contrast
                    </label>
                  </div>
                </div>
                <div className="card" style={{ padding: "12px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "8px" }}>Interface</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                      <input type="checkbox" checked={mobileQuickSettings} onChange={(e) => setMobileQuickSettings(e.target.checked)} /> Quick Settings
                    </label>
                    <button onClick={() => setSidebarDensity(sidebarDensity === "compact" ? "comfortable" : "compact")} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>
                      Density: {sidebarDensity}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isOwner && (
          <motion.div key="admin-settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="settings-section" style={{ marginBottom: "24px" }}>
            <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "16px" }}>🏆 Membership Manager</h3>
              <input
                type="text"
                placeholder="Search user by email..."
                value={giftUserSearch}
                onChange={async (e) => {
                  const val = e.target.value.trim().toLowerCase();
                  setGiftUserSearch(val);
                  if (val.length < 2) { setGiftUserResults([]); return; }
                  const snap = await getDocs(collection(db, "users"));
                  const res: any[] = [];
                  snap.forEach(d => {
                    const data = d.data();
                    if ((data.email || "").toLowerCase().includes(val)) {
                      res.push({ id: d.id, email: data.email, membership: data.membership || "" });
                    }
                  });
                  setGiftUserResults(res);
                }}
                style={{ width: "100%", marginBottom: "12px" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {giftUserResults.map((u: any) => (
                  <div key={u.id} className="card" style={{ padding: "12px", border: "1px solid var(--border)" }}>
                    <p style={{ fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>{u.email}</p>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {["", "PAJJIPLUS", "PAJJIPRO", "PAJJIULTRA"].map(tier => (
                        <button
                          key={tier}
                          onClick={async () => {
                            const expiry = tier === "" ? "" : defaultExpiry();
                            await setDoc(doc(db, "users", u.id), { membership: tier, membershipExpiry: expiry }, { merge: true });
                            setSaveStatus(`✅ Updated ${u.email}`);
                            setGiftUserResults(giftUserResults.map(r => r.id === u.id ? { ...r, membership: tier } : r));
                          }}
                          className={`btn ${u.membership === tier ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          {tier || "None"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "16px" }}>💬 User Feedback</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {allFeedback.length === 0 && <p style={{ textAlign: "center", color: "var(--muted)" }}>No feedback received yet.</p>}
                {allFeedback.map((fb) => (
                  <div key={fb.id} className="card" style={{ padding: "16px", background: "var(--input-bg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--accent)" }}>{fb.userEmail || "Anonymous"}</span>
                      <button onClick={async () => { await deleteDoc(doc(db, "feedback", fb.id)); fetchFeedback(); }} style={{ color: "var(--coral)", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={14} /></button>
                    </div>
                    <p style={{ fontSize: "14px", lineHeight: "1.5" }}>{fb.text}</p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>{fb.timestamp?.toDate ? fb.timestamp.toDate().toLocaleString() : "Recently"}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button onClick={() => setView("credits")} className="btn-link" style={{ fontSize: "12px" }}>App Credits & Contributors</button>
      </div>
    </motion.div>
  );
};
