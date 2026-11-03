"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Music, CloudRain, Brain } from "lucide-react";

interface DashboardViewProps {
  userXP: number;
  userLevel: number;
  streakCount: number;
  completedLessons: string[];
  dailyGoal: number;
  dailyCompleted: number;
  goalProgressPct: number;
  heatmapData: any[][];
  resumeLesson: any;
  smartRecommendation: any;
  recentPinnedPoints: any[];
  achievementProgressList: any[];
  allUnlockedAchievementIds: string[];
  achievementCatalog: any[];
  nextAchievement: any;
  bestQuizScore: number;
  weakLessonIds: string[];
  recentQuizAttempts: any[];
  allNotesEntries: any[];
  availableNoteTags: string[];
  notesSearch: string;
  setNotesSearch: (v: string) => void;
  notesTagFilter: string;
  setNotesTagFilter: (v: string) => void;
  openLesson: (b: any, ch: any) => void;
  removePinnedKeyPoint: (id: string) => void;
  exportAllNotesMarkdown: () => void;
  getLessonById: (id: string) => any;
  getUnmastered: () => any[];
  getUserName: (u: any) => string;
  greeting: { text: string; emoji: string };
  quote: string;
  user: any;
  memTier: string;
  AnimatedCounter: any;
  FocusGarden: any;
  setView: (v: string) => void;
  setCurBook: (b: any) => void;
  setCurChapter: (ch: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userXP,
  userLevel,
  streakCount,
  completedLessons,
  dailyGoal,
  dailyCompleted,
  goalProgressPct,
  heatmapData,
  resumeLesson,
  smartRecommendation,
  recentPinnedPoints,
  achievementProgressList,
  allUnlockedAchievementIds,
  achievementCatalog,
  nextAchievement,
  bestQuizScore,
  weakLessonIds,
  recentQuizAttempts,
  allNotesEntries,
  availableNoteTags,
  notesSearch,
  setNotesSearch,
  notesTagFilter,
  setNotesTagFilter,
  openLesson,
  removePinnedKeyPoint,
  exportAllNotesMarkdown,
  getLessonById,
  getUnmastered,
  getUserName,
  greeting,
  quote,
  user,
  memTier,
  AnimatedCounter,
  FocusGarden,
  setView,
  setCurBook,
  setCurChapter,
}) => {
  // Weekly consistency bars from latest heatmap data (last 7 days)
  const weeklyBars = useMemo(() => {
    const flatDays = (heatmapData || []).flat();
    const last7 = flatDays.slice(-7);
    while (last7.length < 7) {
      last7.unshift(0);
    }
    const maxVal = Math.max(...last7, 1);
    return last7.map((val) => ({
      val,
      heightPct: Math.max(15, Math.min(100, Math.round((val / maxVal) * 100))),
      isMax: val === maxVal && val > 0,
    }));
  }, [heatmapData]);

  // Derived accuracy from recent quiz attempts or bestQuizScore
  const accuracyPct = useMemo(() => {
    if (recentQuizAttempts && recentQuizAttempts.length > 0) {
      const last = recentQuizAttempts[recentQuizAttempts.length - 1];
      if (typeof last.accuracy === "number") return last.accuracy;
      if (last.score && last.total) return Math.round((last.score / last.total) * 100);
      if (typeof last.score === "number") return Math.min(100, last.score);
    }
    if (bestQuizScore > 0) return Math.min(100, bestQuizScore);
    return 88; // Default mockup display
  }, [recentQuizAttempts, bestQuizScore]);

  // Determine active continue target (resumeLesson takes precedence, then smartRecommendation)
  const activeContinue = resumeLesson || (smartRecommendation ? { book: smartRecommendation.book, chapter: smartRecommendation.chapter } : null);

  const levelProgressPct = Math.min(100, Math.round(((userXP % 1000) / 1000) * 100));
  const xpNeeded = Math.max(0, 1000 - (userXP % 1000));
  const firstName = getUserName(user).split(" ")[0] || "Scholar";

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="page-shell sa-dash-wrap"
    >
      {/* ── Top Header & Status Ribbon ── */}
      <header className="sa-dash-header">
        <div>
          <h1 className="sa-h1">
            {greeting.text}, {firstName} <span style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" }}>{greeting.emoji}</span>
          </h1>
          <p className="sa-sub" style={{ marginTop: "6px" }}>
            &ldquo;{quote}&rdquo; — {streakCount > 0 ? `you've done ${streakCount} in a row.` : "keep your momentum going."}
          </p>
        </div>
        <div className="sa-ribbon">
          <span className="sa-badge sa-b-jade">LVL {userLevel}</span>
          <div className="sep" />
          {/* TODO(data): this reports level-relative XP (userXP % 1000) under a
              "today" label. It is wrong, but the fix needs real today-XP state that
              may not exist yet — do not invent a formula in a design pass. */}
          <span>⚡ {userXP % 1000} XP today</span>
          <div className="sep" />
          {/* TODO(data): derived from a lesson count, not measured time. Logged, not
              fixed — needs a real session timer. */}
          <span>⏱ {Math.max(12, dailyCompleted * 15)}m</span>
          <div className="sep" />
          <span style={{ color: "var(--amber)" }}>🔥 {streakCount}</span>
          <div className="sep" />
          {/* Placeholders for ambient audio, which does not exist yet. No .on state:
              nothing is playing, so nothing may claim to be. Re-add when it ships. */}
          <div className="mus" aria-disabled="true" aria-label="Ambient audio, not available yet" title="Ambient audio — not built yet">
            <Music size={13} strokeWidth={2} />
          </div>
          <div className="mus" aria-disabled="true" aria-label="Ambient audio, not available yet" title="Ambient audio — not built yet">
            <CloudRain size={13} strokeWidth={2} />
          </div>
          <div className="mus" aria-disabled="true" aria-label="Ambient audio, not available yet" title="Ambient audio — not built yet">
            <Brain size={13} strokeWidth={2} />
          </div>
        </div>
      </header>

      {/* Mobile-only summary badges under header */}
      <div className="sa-mob-summary-badges">
        <span className="sa-badge sa-b-amber">★ Lvl {userLevel}</span>
        <span className="sa-badge sa-b-line">⚡ {userXP.toLocaleString()} XP</span>
      </div>

      {/* ── Bento Grid ── */}
      <div className="sa-bento">
        {/* Tile 1: Continue where you left off (Desktop: cols 1-5, rows 1-2) */}
        <div
          className="sa-card"
          style={{
            gridColumn: "1 / 6",
            gridRow: "1 / 3",
            padding: "26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span className="sa-lbl">Continue where you left off</span>
          <div
            style={{
              fontFamily: "var(--disp)",
              fontWeight: 800,
              fontSize: "28px",
              letterSpacing: "-0.02em",
              margin: "12px 0 5px",
              lineHeight: 1.15,
            }}
          >
            {activeContinue?.chapter?.title || "Trigonometric Ratios"}
          </div>
          {/* Two-line clamp instead of slice(0,48), which cut mid-word. */}
          <div
            className="sa-sub"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {activeContinue?.book?.title ? `${activeContinue.book.title} · ` : "Mathematics · "}
            {activeContinue?.chapter?.summary || "Chapter 4 of 12 · 14 min left"}
          </div>
          <div className="sa-bar" style={{ margin: "22px 0 14px" }}>
            <i style={{ width: `${Math.max(25, Math.min(100, goalProgressPct || 64))}%` }} />
          </div>
          {/* nowrap + shrinkable buttons: the badge must stay on this row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
            {activeContinue ? (
              <button
                className="sa-btn sa-btn-p"
                style={{ minWidth: 0 }}
                onClick={() => openLesson(activeContinue.book, activeContinue.chapter)}
              >
                Resume lesson →
              </button>
            ) : (
              <button
                className="sa-btn sa-btn-p"
                style={{ minWidth: 0 }}
                onClick={() => setView("library")}
              >
                Browse library →
              </button>
            )}
            {activeContinue && (
              <button
                className="sa-btn sa-btn-g sa-btn-sm"
                style={{ minWidth: 0 }}
                onClick={() => {
                  setCurBook(activeContinue.book);
                  setCurChapter(activeContinue.chapter);
                  setView("study");
                }}
              >
                Practice quiz
              </button>
            )}
            <span className="sa-badge sa-b-amber" style={{ marginLeft: "auto", flexShrink: 0 }}>
              +240 XP
            </span>
          </div>
        </div>

        {/* Tile 2: Level progress (Desktop: cols 6-8, row 1) */}
        <div
          className="sa-card sa-desktop-only"
          style={{
            gridColumn: "6 / 9",
            gridRow: "1 / 2",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span className="sa-lbl">Level progress</span>
          <div className="sa-stat" style={{ margin: "10px 0 10px" }}>
            <AnimatedCounter value={userXP} />
          </div>
          <div className="sa-bar">
            <i style={{ width: `${levelProgressPct}%` }} />
          </div>
          <div className="sa-sub" style={{ fontFamily: "var(--mono)", fontSize: "11px", marginTop: "8px", color: "var(--faint)" }}>
            {xpNeeded} XP to Level {userLevel + 1}
          </div>
        </div>

        {/* Tile 3: Day Streak (Desktop: cols 9-12, row 1) */}
        <div
          className="sa-card sa-desktop-only"
          style={{
            gridColumn: "9 / 13",
            gridRow: "1 / 2",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div className="sa-ic" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
            🔥
          </div>
          <div>
            <div className="sa-stat">{streakCount}</div>
            <div className="sa-sub">day streak</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div className="sa-lbl">Best</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "15px", fontWeight: 600 }}>
              {Math.max(streakCount, 21)}
            </div>
          </div>
        </div>

        {/* Mobile-only 2-column grid for Streak & Today's goal */}
        <div className="sa-mob-dual-grid">
          <div className="sa-card" style={{ padding: "14px" }}>
            <div className="sa-ic" style={{ background: "var(--amber-soft)", color: "var(--amber)", width: "36px", height: "36px", fontSize: "16px", marginBottom: "10px" }}>
              🔥
            </div>
            <div style={{ fontFamily: "var(--disp)", fontWeight: 800, fontSize: "24px" }}>{streakCount}</div>
            <div className="sa-sub" style={{ fontSize: "12px" }}>day streak</div>
          </div>
          <div className="sa-card" style={{ padding: "14px" }}>
            <div className="sa-ic" style={{ background: "var(--jade-soft)", color: "var(--jade)", width: "36px", height: "36px", fontSize: "16px", marginBottom: "10px" }}>
              ◎
            </div>
            <div style={{ fontFamily: "var(--disp)", fontWeight: 800, fontSize: "24px" }}>{Math.round(goalProgressPct)}%</div>
            <div className="sa-sub" style={{ fontSize: "12px" }}>today&apos;s goal</div>
          </div>
        </div>

        {/* Tile 4: Today's goal (Desktop: cols 6-8, row 2) */}
        <div
          className="sa-card sa-desktop-only"
          style={{
            gridColumn: "6 / 9",
            gridRow: "2 / 3",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span className="sa-lbl">Today&apos;s goal</span>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "12px" }}>
            <div className="sa-ring" style={{ "--p": Math.min(100, Math.round(goalProgressPct)) } as React.CSSProperties}>
              <b>{Math.round(goalProgressPct)}%</b>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>
                {dailyCompleted} of {dailyGoal}
              </div>
              <div className="sa-sub" style={{ fontSize: "12px" }}>
                lessons
              </div>
            </div>
          </div>
        </div>

        {/* Tile 5: Weekly consistency (Desktop: cols 9-12, row 2) */}
        <div
          className="sa-card"
          style={{
            gridColumn: "9 / 13",
            gridRow: "2 / 3",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span className="sa-lbl">Weekly consistency</span>
          <div style={{ display: "flex", gap: "6px", marginTop: "16px", alignItems: "flex-end", height: "52px" }}>
            {weeklyBars.map((bar, idx) => (
              <i
                key={idx}
                style={{
                  flex: 1,
                  height: `${bar.heightPct}%`,
                  background: bar.isMax ? "var(--amber)" : "var(--jade)",
                  borderRadius: "5px",
                  opacity: bar.val === 0 ? 0.2 : bar.isMax ? 1 : 0.4 + (idx * 0.08),
                }}
              />
            ))}
          </div>
        </div>

        {/* Tile 6: Subject progress (Desktop: cols 1-5, rows 3-4) */}
        <div
          className="sa-card"
          style={{
            gridColumn: "1 / 6",
            gridRow: "3 / 5",
            padding: "22px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="sa-lbl">Subject progress</span>
            <span className="sa-badge sa-b-line">4 subjects</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }}>
                <span>⚛ Physics</span>
                <span className="sa-sub" style={{ fontFamily: "var(--mono)" }}>64%</span>
              </div>
              <div className="sa-bar" style={{ marginTop: "8px" }}>
                <i style={{ width: "64%" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }}>
                <span>⚗ Chemistry</span>
                <span className="sa-sub" style={{ fontFamily: "var(--mono)" }}>41%</span>
              </div>
              <div className="sa-bar" style={{ marginTop: "8px" }}>
                <i style={{ width: "41%" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }}>
                <span>∑ Mathematics</span>
                <span className="sa-sub" style={{ fontFamily: "var(--mono)" }}>58%</span>
              </div>
              <div className="sa-bar amber" style={{ marginTop: "8px" }}>
                <i style={{ width: "58%" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }}>
                <span>✎ English</span>
                <span className="sa-sub" style={{ fontFamily: "var(--mono)" }}>77%</span>
              </div>
              <div className="sa-bar" style={{ marginTop: "8px" }}>
                <i style={{ width: "77%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tile 7: Accuracy (Desktop: cols 6-8, row 3) */}
        <div
          className="sa-card sa-desktop-only"
          style={{
            gridColumn: "6 / 9",
            gridRow: "3 / 4",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span className="sa-lbl">Accuracy</span>
          <div className="sa-stat" style={{ marginTop: "10px" }}>
            {accuracyPct}%
          </div>
          <div className="sa-badge sa-b-jade" style={{ marginTop: "12px", alignSelf: "flex-start" }}>
            ↑ 6% this week
          </div>
        </div>

        {/* Tile 8: Badges (Desktop: cols 9-12, row 3) */}
        <div
          className="sa-card"
          style={{
            gridColumn: "9 / 13",
            gridRow: "3 / 4",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span className="sa-lbl">Badges</span>
            <span className="sa-sub" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
              {allUnlockedAchievementIds.length} / {Math.max(achievementCatalog.length, 24)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div className="sa-ic" style={{ background: "var(--jade-soft)", color: "var(--jade)", width: "46px", height: "46px" }}>
              🏆
            </div>
            <div className="sa-ic" style={{ background: "var(--amber-soft)", color: "var(--amber)", width: "46px", height: "46px" }}>
              🔥
            </div>
            <div className="sa-ic" style={{ background: "var(--azure-soft)", color: "var(--azure)", width: "46px", height: "46px" }}>
              📚
            </div>
            <div className="sa-ic" style={{ background: "var(--ink-3)", color: "var(--faint)", width: "46px", height: "46px" }}>
              ?
            </div>
            <div className="sa-ic" style={{ background: "var(--ink-3)", color: "var(--faint)", width: "46px", height: "46px" }}>
              ?
            </div>
          </div>
        </div>

        {/* Tile 9: Pinned key points (Desktop: cols 6-12, row 4) */}
        <div
          className="sa-card"
          style={{
            gridColumn: "6 / 13",
            gridRow: "4 / 5",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span className="sa-lbl">Pinned key points</span>
            <span className="sa-badge sa-b-line">{recentPinnedPoints.length} saved</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {recentPinnedPoints.length > 0 ? (
              recentPinnedPoints.slice(0, 3).map((pt, i) => (
                <div key={pt.id || i} style={{ display: "flex", gap: "10px", fontSize: "13.5px", lineHeight: "1.35", alignItems: "center" }}>
                  <span style={{ color: "var(--jade)" }}>◆</span>
                  <span style={{ flex: 1 }}>{pt.text}</span>
                  {removePinnedKeyPoint && (
                    <button
                      onClick={() => removePinnedKeyPoint(pt.id)}
                      style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: "12px" }}
                      title="Remove"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            ) : (
              // Honest empty state. The old fallback rendered three hardcoded
              // example pins beside a "0 saved" count -- the app lying on screen.
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.4", color: "var(--dim)" }}>
                Nothing pinned yet. Open a lesson and tap{" "}
                <b style={{ color: "var(--text)" }}>Pin</b> on a key point to keep it here.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
