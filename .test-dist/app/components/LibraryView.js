"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const firestore_1 = require("firebase/firestore");
const getSubjectStyle = (title, iconOverride) => {
    const lower = title.toLowerCase();
    if (lower.includes("physic")) {
        return {
            icon: iconOverride || "⚛",
            gradient: "linear-gradient(150deg, #123A5C, #0B2136)",
            color: "var(--azure)",
            badgeBg: "var(--azure)",
            badgeColor: "#04121F",
            rotation: "6deg",
            barColor: "default",
        };
    }
    if (lower.includes("chem")) {
        return {
            icon: iconOverride || "⚗",
            gradient: "linear-gradient(150deg, #0F3D2E, #0A2A20)",
            color: "var(--jade)",
            badgeBg: "var(--jade)",
            badgeColor: "#04150D",
            rotation: "-5deg",
            barColor: "default",
        };
    }
    if (lower.includes("math")) {
        return {
            icon: iconOverride || "∑",
            gradient: "linear-gradient(150deg, #4A3410, #2A1E08)",
            color: "var(--amber)",
            badgeBg: "var(--amber)",
            badgeColor: "#22160A",
            rotation: "4deg",
            barColor: "amber",
        };
    }
    if (lower.includes("english") || lower.includes("lit") || lower.includes("lang")) {
        return {
            icon: iconOverride || "✎",
            gradient: "linear-gradient(150deg, #4A1D22, #2A1013)",
            color: "var(--coral)",
            badgeBg: "var(--coral)",
            badgeColor: "#2A0C0C",
            rotation: "-7deg",
            barColor: "default",
        };
    }
    if (lower.includes("bio")) {
        return {
            icon: iconOverride || "🌿",
            gradient: "linear-gradient(150deg, #0F3D2E, #071F17)",
            color: "var(--jade)",
            badgeBg: "var(--jade)",
            badgeColor: "#04150D",
            rotation: "5deg",
            barColor: "default",
        };
    }
    if (lower.includes("geo") || lower.includes("earth")) {
        return {
            icon: iconOverride || "🌍",
            gradient: "linear-gradient(150deg, #153D42, #0A2024)",
            color: "var(--azure)",
            badgeBg: "var(--azure)",
            badgeColor: "#04121F",
            rotation: "-4deg",
            barColor: "default",
        };
    }
    if (lower.includes("hist") || lower.includes("civic")) {
        return {
            icon: iconOverride || "🏛",
            gradient: "linear-gradient(150deg, #3D2818, #22140A)",
            color: "var(--amber)",
            badgeBg: "var(--amber)",
            badgeColor: "#22160A",
            rotation: "6deg",
            barColor: "amber",
        };
    }
    if (lower.includes("comp")) {
        return {
            icon: iconOverride || "💻",
            gradient: "linear-gradient(150deg, #1B294B, #0E172C)",
            color: "var(--azure)",
            badgeBg: "var(--azure)",
            badgeColor: "#04121F",
            rotation: "-6deg",
            barColor: "default",
        };
    }
    return {
        icon: iconOverride || "📖",
        gradient: "linear-gradient(150deg, #1A1F27, #0D0F13)",
        color: "var(--text)",
        badgeBg: "var(--ink-4)",
        badgeColor: "var(--text)",
        rotation: "-5deg",
        barColor: "default",
    };
};
const LibraryView = ({ isOwner, books, db, libraryQuery, setLibraryQuery, sortedFilteredBooks, setCurBook, setView, libraryFilter = "all", setLibraryFilter, completedLessons = [], openLesson, resumeLesson, }) => {
    // Aggregate stats across library books
    const { totalSubjects, totalChapters, completedCount } = (0, react_1.useMemo)(() => {
        let chaptersCount = 0;
        const completedSet = new Set(completedLessons);
        (books || []).forEach((b) => {
            (b.chapters || []).forEach((ch) => {
                chaptersCount++;
            });
        });
        return {
            totalSubjects: books?.length || 0,
            totalChapters: chaptersCount,
            completedCount: completedSet.size,
        };
    }, [books, completedLessons]);
    // Jump back in candidates: start with resumeLesson, then uncompleted chapters from books
    const jumpBackInItems = (0, react_1.useMemo)(() => {
        const list = [];
        const completedSet = new Set(completedLessons);
        if (resumeLesson && resumeLesson.book && resumeLesson.chapter) {
            const style = getSubjectStyle(resumeLesson.book.title, resumeLesson.book.icon);
            let badgeClass = "sa-b-azure";
            if (style.color === "var(--jade)")
                badgeClass = "sa-b-jade";
            else if (style.color === "var(--amber)")
                badgeClass = "sa-b-amber";
            else if (style.color === "var(--coral)")
                badgeClass = "sa-b-coral";
            list.push({
                book: resumeLesson.book,
                chapter: resumeLesson.chapter,
                minutesLeft: 14,
                icon: style.icon,
                badgeClass,
            });
        }
        // Add up to 3 jump back in rows from books
        for (const b of books || []) {
            if (list.length >= 3)
                break;
            for (const ch of b.chapters || []) {
                if (list.length >= 3)
                    break;
                if (list.some((item) => item.chapter.id === ch.id))
                    continue;
                if (!completedSet.has(ch.id)) {
                    const style = getSubjectStyle(b.title, b.icon);
                    let badgeClass = "sa-b-azure";
                    if (style.color === "var(--jade)")
                        badgeClass = "sa-b-jade";
                    else if (style.color === "var(--amber)")
                        badgeClass = "sa-b-amber";
                    else if (style.color === "var(--coral)")
                        badgeClass = "sa-b-coral";
                    list.push({
                        book: b,
                        chapter: ch,
                        minutesLeft: Math.max(8, ((ch.title?.length || 10) % 20) + 6),
                        icon: style.icon,
                        badgeClass,
                    });
                }
            }
        }
        return list;
    }, [books, completedLessons, resumeLesson]);
    return ((0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 20, scale: 0.99 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -20, scale: 0.96 }, transition: { type: "spring", stiffness: 300, damping: 30 }, className: "page-shell sa-dash-wrap", children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    gap: "16px",
                    flexWrap: "wrap",
                }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [(0, jsx_runtime_1.jsx)("h1", { className: "sa-h1", children: "The Vault" }), isOwner && ((0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                            const t = prompt("Book Name?");
                                            if (t) {
                                                const nl = [...books, { id: Date.now().toString(), title: t, chapters: [] }];
                                                (0, firestore_1.setDoc)((0, firestore_1.doc)(db, "data", "pajji_database"), { books: nl });
                                            }
                                        }, className: "sa-btn sa-btn-p sa-btn-sm", style: { padding: "6px 12px", fontSize: "12px" }, children: "+ New Book" }))] }), (0, jsx_runtime_1.jsxs)("p", { className: "sa-sub", style: { marginTop: "6px" }, children: [totalSubjects, " subjects \u00B7 ", totalChapters, " chapters", completedCount > 0 ? ` · ${completedCount} completed` : " · 12 saved for later"] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setLibraryFilter && setLibraryFilter("all"), className: `sa-badge ${libraryFilter === "all" ? "sa-b-jade" : "sa-b-line"}`, style: { cursor: "pointer", border: "none" }, children: "All" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setLibraryFilter && setLibraryFilter("inProgress"), className: `sa-badge ${libraryFilter === "inProgress" ? "sa-b-jade" : "sa-b-line"}`, style: { cursor: "pointer", border: "none" }, children: "In progress" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setLibraryFilter && setLibraryFilter("notStarted"), className: `sa-badge ${libraryFilter === "notStarted" ? "sa-b-jade" : "sa-b-line"}`, style: { cursor: "pointer", border: "none" }, children: "Saved" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setLibraryFilter && setLibraryFilter("mastered"), className: `sa-badge ${libraryFilter === "mastered" ? "sa-b-jade" : "sa-b-line"}`, style: { cursor: "pointer", border: "none" }, children: "Completed" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-card", style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    marginBottom: "24px",
                }, children: [(0, jsx_runtime_1.jsx)("span", { style: { color: "var(--dim)", fontSize: "16px" }, children: "\u2315" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search the vault\u2026", value: libraryQuery, onChange: (e) => setLibraryQuery(e.target.value), style: {
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            color: "var(--text)",
                            fontFamily: "var(--body)",
                            fontSize: "13.5px",
                        } }), libraryQuery && ((0, jsx_runtime_1.jsx)("button", { onClick: () => setLibraryQuery(""), style: {
                            background: "none",
                            border: "none",
                            color: "var(--faint)",
                            cursor: "pointer",
                            fontSize: "14px",
                        }, children: "\u00D7" }))] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-lib-grid", children: sortedFilteredBooks.map((b) => {
                    const chapters = b.chapters || [];
                    const totalLessons = chapters.length;
                    const completedSet = new Set(completedLessons);
                    const doneLessons = chapters.filter((ch) => completedSet.has(ch.id)).length;
                    const pct = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);
                    const style = getSubjectStyle(b.title, b.icon);
                    return ((0, jsx_runtime_1.jsxs)("div", { onClick: () => {
                            setCurBook(b);
                            setView("chapters");
                        }, className: "sa-card sa-lib-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sa-lib-cover", style: { background: style.gradient }, children: [(0, jsx_runtime_1.jsx)("span", { children: style.icon }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-sticker sa-lib-sticker", style: {
                                            top: "10px",
                                            right: "10px",
                                            background: style.badgeBg,
                                            color: style.badgeColor,
                                            transform: `rotate(${style.rotation})`,
                                        }, children: [pct, "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "sa-lib-card-title", style: {
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    lineHeight: "1.25",
                                    color: "var(--text)",
                                }, children: b.title }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-sub sa-lib-meta-desktop", style: {
                                    fontFamily: "var(--mono)",
                                    fontSize: "11px",
                                    margin: "5px 0 12px",
                                }, children: [totalLessons, " chapters \u00B7 ", doneLessons, " done"] }), (0, jsx_runtime_1.jsx)("div", { className: `sa-bar ${style.barColor === "amber" ? "amber" : ""}`, style: { marginTop: "7px" }, children: (0, jsx_runtime_1.jsx)("i", { style: { width: `${pct}%` } }) })] }, b.id));
                }) }), jumpBackInItems.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { style: { marginTop: "26px" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "sa-h2", style: { marginBottom: "14px" }, children: "Jump back in" }), (0, jsx_runtime_1.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: jumpBackInItems.map((item, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "sa-rank-row", children: [(0, jsx_runtime_1.jsx)("span", { className: `sa-badge ${item.badgeClass}`, children: item.icon }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                                fontWeight: 600,
                                                fontSize: "14px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }, children: item.chapter.title }), (0, jsx_runtime_1.jsxs)("div", { className: "sa-sub", style: {
                                                fontFamily: "var(--mono)",
                                                fontSize: "11px",
                                                marginTop: "2px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }, children: [item.book.title, " \u00B7 ", item.minutesLeft, " min left"] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                        if (openLesson) {
                                            openLesson(item.book, item.chapter);
                                        }
                                        else {
                                            setCurBook(item.book);
                                            setView("study");
                                        }
                                    }, className: `sa-btn ${idx === 0 ? "sa-btn-p" : "sa-btn-g"} sa-btn-sm`, children: "Resume" })] }, item.chapter.id || idx))) })] }))] }, "library"));
};
exports.LibraryView = LibraryView;
