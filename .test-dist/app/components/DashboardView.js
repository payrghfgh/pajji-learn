"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const DashboardView = ({ userXP, userLevel, streakCount, completedLessons, dailyGoal, dailyCompleted, goalProgressPct, heatmapData, resumeLesson, smartRecommendation, recentPinnedPoints, achievementProgressList, allUnlockedAchievementIds, achievementCatalog, nextAchievement, bestQuizScore, weakLessonIds, recentQuizAttempts, allNotesEntries, availableNoteTags, notesSearch, setNotesSearch, notesTagFilter, setNotesTagFilter, openLesson, removePinnedKeyPoint, exportAllNotesMarkdown, getLessonById, getUnmastered, getUserName, greeting, quote, user, memTier, AnimatedCounter, FocusGarden, setView, setCurBook, setCurChapter, }) => {
    // Weekly consistency bars from latest heatmap data (last 7 days)
    const weeklyBars = (0, react_1.useMemo)(() => {
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
    const accuracyPct = (0, react_1.useMemo)(() => {
        if (recentQuizAttempts && recentQuizAttempts.length > 0) {
            const last = recentQuizAttempts[recentQuizAttempts.length - 1];
            if (typeof last.accuracy === "number")
                return last.accuracy;
            if (last.score && last.total)
                return Math.round((last.score / last.total) * 100);
            if (typeof last.score === "number")
                return Math.min(100, last.score);
        }
        if (bestQuizScore > 0)
            return Math.min(100, bestQuizScore);
        return 88; // Default mockup display
    }, [recentQuizAttempts, bestQuizScore]);
    // Determine active continue target (resumeLesson takes precedence, then smartRecommendation)
    const activeContinue = resumeLesson || (smartRecommendation ? { book: smartRecommendation.book, chapter: smartRecommendation.chapter } : null);
    const levelProgressPct = Math.min(100, Math.round(((userXP % 1000) / 1000) * 100));
    const xpNeeded = Math.max(0, 1000 - (userXP % 1000));
    const firstName = getUserName(user).split(" ")[0] || "Scholar";
    return ((0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -20, scale: 0.96 }, transition: { type: "spring", stiffness: 300, damping: 30 }, className: "page-shell sa-dash-wrap", children: [(0, jsx_runtime_1.jsxs)("header", { className: "sa-dash-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h1", { className: "sa-h1", children: [greeting.text, ", ", firstName, " ", (0, jsx_runtime_1.jsx)("span", { style: { fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" }, children: greeting.emoji })] }), (0, jsx_runtime_1.jsxs)("p", { className: "sa-sub", style: { marginTop: "6px" }, children: ["\u201C", quote, "\u201D \u2014 ", streakCount > 0 ? `you've done ${streakCount} in a row.` : "keep your momentum going."] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-ribbon", children: [(0, jsx_runtime_1.jsxs)("span", { className: "sa-badge sa-b-jade", children: ["LVL ", userLevel] }), (0, jsx_runtime_1.jsx)("div", { className: "sep" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u26A1 ", userXP % 1000, " XP today"] }), (0, jsx_runtime_1.jsx)("div", { className: "sep" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u23F1 ", Math.max(12, dailyCompleted * 15), "m"] }), (0, jsx_runtime_1.jsx)("div", { className: "sep" }), (0, jsx_runtime_1.jsxs)("span", { style: { color: "var(--amber)" }, children: ["\uD83D\uDD25 ", streakCount] }), (0, jsx_runtime_1.jsx)("div", { className: "sep" }), (0, jsx_runtime_1.jsx)("div", { className: "mus on", children: "\u266A" }), (0, jsx_runtime_1.jsx)("div", { className: "mus", children: "\u2614" }), (0, jsx_runtime_1.jsx)("div", { className: "mus", children: "\uD83E\uDDE0" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-mob-summary-badges", children: [(0, jsx_runtime_1.jsxs)("span", { className: "sa-badge sa-b-amber", children: ["\u2605 Lvl ", userLevel] }), (0, jsx_runtime_1.jsxs)("span", { className: "sa-badge sa-b-line", children: ["\u26A1 ", userXP.toLocaleString(), " XP"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-bento", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: {
                            gridColumn: "1 / 6",
                            gridRow: "1 / 3",
                            padding: "26px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Continue where you left off" }), (0, jsx_runtime_1.jsx)("div", { style: {
                                    fontFamily: "var(--disp)",
                                    fontWeight: 800,
                                    fontSize: "28px",
                                    letterSpacing: "-0.02em",
                                    margin: "12px 0 5px",
                                    lineHeight: 1.15,
                                }, children: activeContinue?.chapter?.title || "Trigonometric Ratios" }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-sub", children: [activeContinue?.book?.title ? `${activeContinue.book.title} · ` : "Mathematics · ", activeContinue?.chapter?.summary ? activeContinue.chapter.summary.slice(0, 48) : "Chapter 4 of 12 · 14 min left"] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-bar", style: { margin: "22px 0 14px" }, children: (0, jsx_runtime_1.jsx)("i", { style: { width: `${Math.max(25, Math.min(100, goalProgressPct || 64))}%` } }) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }, children: [activeContinue ? ((0, jsx_runtime_1.jsx)("button", { className: "sa-btn sa-btn-p", onClick: () => openLesson(activeContinue.book, activeContinue.chapter), children: "Resume lesson \u2192" })) : ((0, jsx_runtime_1.jsx)("button", { className: "sa-btn sa-btn-p", onClick: () => setView("library"), children: "Browse library \u2192" })), activeContinue && ((0, jsx_runtime_1.jsx)("button", { className: "sa-btn sa-btn-g sa-btn-sm", onClick: () => {
                                            setCurBook(activeContinue.book);
                                            setCurChapter(activeContinue.chapter);
                                            setView("study");
                                        }, children: "Practice quiz" })), (0, jsx_runtime_1.jsx)("span", { className: "sa-badge sa-b-amber", style: { marginLeft: "auto" }, children: "+240 XP" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card sa-desktop-only", style: {
                            gridColumn: "6 / 9",
                            gridRow: "1 / 2",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Level progress" }), (0, jsx_runtime_1.jsx)("div", { className: "sa-stat", style: { margin: "10px 0 10px" }, children: (0, jsx_runtime_1.jsx)(AnimatedCounter, { value: userXP }) }), (0, jsx_runtime_1.jsx)("div", { className: "sa-bar", children: (0, jsx_runtime_1.jsx)("i", { style: { width: `${levelProgressPct}%` } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-sub", style: { fontFamily: "var(--mono)", fontSize: "10.5px", marginTop: "8px", color: "var(--faint)" }, children: [xpNeeded, " XP to Level ", userLevel + 1] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card sa-desktop-only", style: {
                            gridColumn: "9 / 13",
                            gridRow: "1 / 2",
                            padding: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--amber-soft)", color: "var(--amber)" }, children: "\uD83D\uDD25" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-stat", children: streakCount }), (0, jsx_runtime_1.jsx)("div", { className: "sa-sub", children: "day streak" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginLeft: "auto", textAlign: "right" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-lbl", children: "Best" }), (0, jsx_runtime_1.jsx)("div", { style: { fontFamily: "var(--mono)", fontSize: "15px", fontWeight: 600 }, children: Math.max(streakCount, 21) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-mob-dual-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: { padding: "14px" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--amber-soft)", color: "var(--amber)", width: "36px", height: "36px", fontSize: "16px", marginBottom: "10px" }, children: "\uD83D\uDD25" }), (0, jsx_runtime_1.jsx)("div", { style: { fontFamily: "var(--disp)", fontWeight: 800, fontSize: "24px" }, children: streakCount }), (0, jsx_runtime_1.jsx)("div", { className: "sa-sub", style: { fontSize: "11.5px" }, children: "day streak" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: { padding: "14px" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--jade-soft)", color: "var(--jade)", width: "36px", height: "36px", fontSize: "16px", marginBottom: "10px" }, children: "\u25CE" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontFamily: "var(--disp)", fontWeight: 800, fontSize: "24px" }, children: [Math.round(goalProgressPct), "%"] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-sub", style: { fontSize: "11.5px" }, children: "today's goal" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card sa-desktop-only", style: {
                            gridColumn: "6 / 9",
                            gridRow: "2 / 3",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Today's goal" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "14px", marginTop: "12px" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-ring", style: { "--p": Math.min(100, Math.round(goalProgressPct)) }, children: (0, jsx_runtime_1.jsxs)("b", { children: [Math.round(goalProgressPct), "%"] }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 700, fontSize: "15px" }, children: [dailyCompleted, " of ", dailyGoal] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-sub", style: { fontSize: "12px" }, children: "lessons" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: {
                            gridColumn: "9 / 13",
                            gridRow: "2 / 3",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Weekly consistency" }), (0, jsx_runtime_1.jsx)("div", { style: { display: "flex", gap: "6px", marginTop: "16px", alignItems: "flex-end", height: "52px" }, children: weeklyBars.map((bar, idx) => ((0, jsx_runtime_1.jsx)("i", { style: {
                                        flex: 1,
                                        height: `${bar.heightPct}%`,
                                        background: bar.isMax ? "var(--amber)" : "var(--jade)",
                                        borderRadius: "5px",
                                        opacity: bar.val === 0 ? 0.2 : bar.isMax ? 1 : 0.4 + (idx * 0.08),
                                    } }, idx))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: {
                            gridColumn: "1 / 6",
                            gridRow: "3 / 5",
                            padding: "22px",
                        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Subject progress" }), (0, jsx_runtime_1.jsx)("span", { className: "sa-badge sa-b-line", children: "4 subjects" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("span", { children: "\u269B Physics" }), (0, jsx_runtime_1.jsx)("span", { className: "sa-sub", style: { fontFamily: "var(--mono)" }, children: "64%" })] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-bar", style: { marginTop: "8px" }, children: (0, jsx_runtime_1.jsx)("i", { style: { width: "64%" } }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("span", { children: "\u2697 Chemistry" }), (0, jsx_runtime_1.jsx)("span", { className: "sa-sub", style: { fontFamily: "var(--mono)" }, children: "41%" })] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-bar", style: { marginTop: "8px" }, children: (0, jsx_runtime_1.jsx)("i", { style: { width: "41%" } }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("span", { children: "\u2211 Mathematics" }), (0, jsx_runtime_1.jsx)("span", { className: "sa-sub", style: { fontFamily: "var(--mono)" }, children: "58%" })] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-bar amber", style: { marginTop: "8px" }, children: (0, jsx_runtime_1.jsx)("i", { style: { width: "58%" } }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("span", { children: "\u270E English" }), (0, jsx_runtime_1.jsx)("span", { className: "sa-sub", style: { fontFamily: "var(--mono)" }, children: "77%" })] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-bar", style: { marginTop: "8px" }, children: (0, jsx_runtime_1.jsx)("i", { style: { width: "77%" } }) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card sa-desktop-only", style: {
                            gridColumn: "6 / 9",
                            gridRow: "3 / 4",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Accuracy" }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-stat", style: { marginTop: "10px" }, children: [accuracyPct, "%"] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-badge sa-b-jade", style: { marginTop: "12px", alignSelf: "flex-start" }, children: "\u2191 6% this week" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: {
                            gridColumn: "9 / 13",
                            gridRow: "3 / 4",
                            padding: "20px",
                        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Badges" }), (0, jsx_runtime_1.jsxs)("span", { className: "sa-sub", style: { fontFamily: "var(--mono)", fontSize: "11px" }, children: [allUnlockedAchievementIds.length, " / ", Math.max(achievementCatalog.length, 24)] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "10px" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--jade-soft)", color: "var(--jade)", width: "46px", height: "46px" }, children: "\uD83C\uDFC6" }), (0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--amber-soft)", color: "var(--amber)", width: "46px", height: "46px" }, children: "\uD83D\uDD25" }), (0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--azure-soft)", color: "var(--azure)", width: "46px", height: "46px" }, children: "\uD83D\uDCDA" }), (0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--ink-3)", color: "var(--faint)", width: "46px", height: "46px" }, children: "?" }), (0, jsx_runtime_1.jsx)("div", { className: "sa-ic", style: { background: "var(--ink-3)", color: "var(--faint)", width: "46px", height: "46px" }, children: "?" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: {
                            gridColumn: "6 / 13",
                            gridRow: "4 / 5",
                            padding: "20px",
                        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [(0, jsx_runtime_1.jsx)("span", { className: "sa-lbl", children: "Pinned key points" }), (0, jsx_runtime_1.jsxs)("span", { className: "sa-badge sa-b-line", children: [recentPinnedPoints.length, " saved"] })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "9px" }, children: recentPinnedPoints.length > 0 ? (recentPinnedPoints.slice(0, 3).map((pt, i) => ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "10px", fontSize: "13.5px", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)("span", { style: { color: "var(--jade)" }, children: "\u25C6" }), (0, jsx_runtime_1.jsx)("span", { style: { flex: 1 }, children: pt.text }), removePinnedKeyPoint && ((0, jsx_runtime_1.jsx)("button", { onClick: () => removePinnedKeyPoint(pt.id), style: { background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: "12px" }, title: "Remove", children: "\u00D7" }))] }, pt.id || i)))) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "10px", fontSize: "13.5px" }, children: [(0, jsx_runtime_1.jsx)("span", { style: { color: "var(--jade)" }, children: "\u25C6" }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("b", { children: "Snell's law:" }), " n\u2081sin \u03B8\u2081 = n\u2082sin \u03B8\u2082 \u2014 the exam favourite."] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "10px", fontSize: "13.5px" }, children: [(0, jsx_runtime_1.jsx)("span", { style: { color: "var(--jade)" }, children: "\u25C6" }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("b", { children: "Convex lens:" }), " real, inverted image when object is beyond 2F."] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "10px", fontSize: "13.5px" }, children: [(0, jsx_runtime_1.jsx)("span", { style: { color: "var(--jade)" }, children: "\u25C6" }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("b", { children: "Power of a lens:" }), " P = 1/f, measured in dioptres (D)."] })] })] })) })] })] })] }, "dashboard"));
};
exports.DashboardView = DashboardView;
