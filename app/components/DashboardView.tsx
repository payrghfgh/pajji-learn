"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, BookOpen, Flame, Zap, ChevronRight, Clock, CheckCircle2, Sparkles, Send, Brain, Heart, Volume2, Info, Moon, Sun, LayoutDashboard, LogOut, User, MessageSquare } from "lucide-react";

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
  userXP, userLevel, streakCount, completedLessons,
  dailyGoal, dailyCompleted, goalProgressPct,
  heatmapData, resumeLesson, smartRecommendation,
  recentPinnedPoints, achievementProgressList, allUnlockedAchievementIds,
  achievementCatalog, nextAchievement, bestQuizScore,
  weakLessonIds, recentQuizAttempts, allNotesEntries,
  availableNoteTags, notesSearch, setNotesSearch,
  notesTagFilter, setNotesTagFilter, openLesson,
  removePinnedKeyPoint, exportAllNotesMarkdown,
  getLessonById, getUnmastered, getUserName,
  greeting, quote, user, memTier, AnimatedCounter, FocusGarden,
  setView, setCurBook, setCurChapter
}) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="page-shell"
    >
      <header style={{ marginBottom: "40px", textAlign: "left" }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title syne-heading" style={{ marginBottom: "8px", fontSize: "min(36px, 8vw)", lineHeight: "1", color: "var(--text)" }}>
            {greeting.text},<br />{getUserName(user).split(' ')[0]}! <span style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" }}>{greeting.emoji}</span>
          </h1>
          <p style={{ color: "var(--accent)", fontWeight: "700", fontSize: "14px", opacity: 0.8, maxWidth: "400px" }}>{quote}</p>
        </motion.div>
      </header>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: 0.08 } }
        }}
        className="bento-grid"
        style={{ marginBottom: "40px" }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5 }}
          className="card mesh-glow"
          style={{ gridColumn: "span 4", gridRow: "span 2", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", top: "-10%", right: "-10%", opacity: 0.1 }}><Star size={120} fill="var(--accent)" color="var(--accent)" /></div>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Level {userLevel}</p>
          <h3 className="stat-value" style={{ marginTop: "12px", fontSize: "48px" }}>
            <AnimatedCounter value={userXP} />
          </h3>
          <div style={{ height: "8px", background: "var(--border)", borderRadius: "10px", overflow: "hidden", marginTop: "16px", marginBottom: "8px" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(userXP % 1000) / 10}%` }}
              transition={{ duration: 1.5, type: "spring" }}
              style={{ height: "100%", background: "var(--accent-grad)", position: "relative" }}
            >
              <div className="shimmer" style={{ position: "absolute", inset: 0 }} />
            </motion.div>
          </div>
          <p style={{ fontSize: "12px", opacity: 0.5, fontWeight: "800" }}>{Math.max(0, 1000 - (userXP % 1000))} XP to Level {userLevel + 1}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5 }}
          className="card"
          style={{ gridColumn: "span 4", display: "flex", alignItems: "center", gap: "20px" }}
        >
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(59, 130, 246, 0.1)", display: "grid", placeItems: "center", color: "#3b82f6" }}><BookOpen size={28} /></div>
          <div><h3 className="stat-value" style={{ fontSize: "28px" }}>{completedLessons.length}</h3><p style={{ fontSize: "13px", opacity: 0.5 }}>Mastered</p></div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5 }}
          className="card"
          style={{ gridColumn: "span 4", display: "flex", alignItems: "center", gap: "20px" }}
        >
          <motion.div
            animate={streakCount > 0 ? { scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(245, 158, 11, 0.1)", display: "grid", placeItems: "center", color: "#f59e0b" }}
          >
            <Flame size={28} />
          </motion.div>
          <div><h3 className="stat-value" style={{ fontSize: "28px" }}>{streakCount}</h3><p style={{ fontSize: "13px", opacity: 0.5 }}>Streak {streakCount > 0 ? "🔥" : ""}</p></div>
        </motion.div>

        {smartRecommendation && (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -5 }}
            className="card ultra-shine"
            onClick={() => { setCurBook(smartRecommendation.book); setCurChapter(smartRecommendation.chapter); setView("study"); }}
            style={{ gridColumn: "span 8", display: "flex", flexDirection: "row", alignItems: "center", gap: "24px", cursor: "pointer", background: "var(--accent-grad)", color: "white", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: "10px", right: "10px", opacity: 0.3 }}><Zap size={32} fill="white" /></div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", opacity: 0.9, letterSpacing: "1px" }}>Smart Review</p>
              <h3 style={{ fontSize: "16px", fontWeight: "800", marginTop: "4px", lineHeight: "1.2" }}>{smartRecommendation.chapter.title}</h3>
              <p style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>Resume in {smartRecommendation.book.title}</p>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5 }}
          className="card"
          style={{ gridColumn: "span 8", display: "flex", alignItems: "center", gap: "32px", padding: "32px" }}
        >
          <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
            <svg style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
              <circle cx="40" cy="40" r="34" stroke="var(--input-bg)" strokeWidth="8" fill="transparent" />
              <motion.circle
                cx="40" cy="40" r="34" stroke="var(--accent)" strokeWidth="8" fill="transparent"
                strokeDasharray="213.6"
                initial={{ strokeDashoffset: 213.6 }}
                animate={{ strokeDashoffset: 213.6 * (1 - Math.min(1, goalProgressPct / 100)) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: "14px", fontWeight: "900", color: "var(--accent)" }}>
              {Math.round(goalProgressPct)}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "20px", fontWeight: "900", marginBottom: "8px" }}>Daily Goal</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", fontWeight: "500" }}>
              You&apos;ve completed {dailyCompleted} of {dailyGoal} lessons today. {goalProgressPct >= 100 ? "Goal smashed! 🏆" : "Keep pushing!"}
            </p>
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="card" style={{ gridColumn: "span 12" }}>
          <h3 className="syne-heading" style={{ fontSize: "14px", fontWeight: "800", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent)" }}>
            Consistency Grind <span style={{ color: "var(--muted)", fontSize: "11px", fontWeight: "500", textTransform: "none", letterSpacing: "0" }}>Study activity over the last year</span>
          </h3>
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "8px" }}>
            {heatmapData.map((week, weekIdx) => (
              <div key={weekIdx} style={{ display: "grid", gridTemplateRows: "repeat(7, 1fr)", gap: "4px" }}>
                {week.map((count, dayIdx) => (
                  <div
                    key={dayIdx}
                    style={{
                      width: "12px", height: "12px", borderRadius: "3.5px",
                      background: count >= 4 ? "var(--accent)" : count >= 3 ? `rgba(var(--accent-rgb), 0.6)` : count >= 2 ? `rgba(var(--accent-rgb), 0.4)` : count >= 1 ? `rgba(var(--accent-rgb), 0.25)` : "var(--border)",
                      transition: "all 0.3s ease",
                      boxShadow: count >= 4 ? "0 0 10px rgba(var(--accent-rgb), 0.3)" : "none"
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {resumeLesson && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.01 }}
          className="card"
          style={{ marginBottom: "32px", borderLeft: "4px solid var(--accent)", background: "rgba(var(--accent-rgb), 0.05)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "900", color: "var(--accent)", textTransform: "uppercase", marginBottom: "4px" }}>Resume Journey</p>
              <h3 style={{ fontSize: "22px", fontWeight: "800" }}>{resumeLesson.chapter.title}</h3>
            </div>
            <button onClick={() => openLesson(resumeLesson.book, resumeLesson.chapter)} style={{ background: "var(--accent-grad)", border: "none", borderRadius: "12px", color: "white", padding: "12px 24px", fontWeight: "800", cursor: "pointer" }}>
              Continue
            </button>
          </div>
        </motion.div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h2 className="section-title syne-heading" style={{ fontSize: "22px", fontWeight: "800" }}>Challenges 🚀</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {recentPinnedPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="card" style={{ border: "1px dashed var(--accent)", background: "var(--accent-soft)", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <p style={{ fontSize: "11px", fontWeight: "900", color: "var(--accent)", textTransform: "uppercase" }}>Memory Recall Pulse 🧠</p>
            <p style={{ fontSize: "14px", fontWeight: "700", lineHeight: "1.4" }}>&quot;{recentPinnedPoints[0].text.slice(0, 100)}...&quot;</p>
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>Do you remember the core concepts of this? Try to explain it out loud.</p>
          </motion.div>
        )}
        {getUnmastered().slice(0, 4).map((ch, idx) => {
          const isMastered = completedLessons.includes(ch.id);
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5, z: 10 }}
              className={`card tilt-card ${isMastered ? "holographic-shine" : ""} ${idx === 0 ? "power-up-card" : ""}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {idx === 0 && (
                <div style={{ position: "absolute", top: "10px", right: "10px", background: "var(--accent-grad)", fontSize: "9px", fontWeight: "900", padding: "2px 6px", borderRadius: "4px", color: "white", zIndex: 10 }}>2X XP</div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>{ch.bookTitle || "NEW LESSON"}</p>
                <h3 style={{ fontSize: "17px", fontWeight: "800" }}>{ch.title}</h3>
              </div>
              <button
                onClick={() => openLesson(ch.parentBook, ch)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: isMastered ? "var(--accent-grad)" : "var(--input-bg)",
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  color: isMastered ? "white" : "var(--text)"
                }}
              >
                <ChevronRight size={24} />
              </button>
            </motion.div>
          );
        })}
      </div>

      <h2 style={{ fontSize: "20px", marginTop: "28px", marginBottom: "14px", fontWeight: "800" }}>Achievements 🏅</h2>
      <div className="card" style={{ padding: "20px" }}>
        <p style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)", marginBottom: "14px" }}>{allUnlockedAchievementIds.length}/{achievementCatalog.length} unlocked</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
          {achievementProgressList.map(a => (
            <div key={a.id} className={a.unlocked ? `${a.rarity}-glow` : ""} style={{ padding: "12px", borderRadius: "14px", background: a.unlocked ? "var(--accent-soft)" : "var(--input-bg)", border: a.unlocked ? "1px solid rgba(var(--accent-rgb), 0.3)" : "1px solid var(--border)", opacity: a.unlocked ? 1 : 0.88 }}>
              <p style={{ fontWeight: "800", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {a.rarity === "diamond" ? "💎" : a.rarity === "epic" ? "🔮" : "🏅"} {a.title}
                </span>
                <span style={{ fontSize: "10px", color: a.unlocked ? "var(--accent)" : "var(--muted)" }}>{a.unlocked ? "Unlocked" : "Locked"}</span>
              </p>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{a.description}</p>
            </div>
          ))}
        </div>
      </div>

      {allNotesEntries.length > 0 && (
        <>
          <h2 style={{ fontSize: "20px", marginTop: "28px", marginBottom: "14px", fontWeight: "800" }}>Recent Notes 📝</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {allNotesEntries.slice(0, 3).map((item) => (
              <div key={item.lessonId} className="card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ fontWeight: "800", fontSize: "14px" }}>{item.lessonTitle}</h4>
                  <button onClick={() => openLesson(item.lesson.book, item.lesson.chapter)} className="btn-link" style={{ fontSize: "12px" }}>Open</button>
                </div>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.5" }}>{item.note.slice(0, 150)}...</p>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};
