"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { setDoc, doc } from "firebase/firestore";

interface LibraryViewProps {
  isOwner: boolean;
  books: any[];
  db: any;
  libraryQuery: string;
  setLibraryQuery: (v: string) => void;
  sortedFilteredBooks: any[];
  setCurBook: (b: any) => void;
  setView: (v: string) => void;
  libraryFilter?: "all" | "notStarted" | "inProgress" | "mastered";
  setLibraryFilter?: (v: "all" | "notStarted" | "inProgress" | "mastered") => void;
  completedLessons?: string[];
  openLesson?: (book: any, chapter: any) => void;
  resumeLesson?: { book: any; chapter: any } | null;
}

// Subject styling metadata based on the redesign spec and mockup
interface SubjectStyle {
  icon: string;
  gradient: string;
  color: string;
  badgeBg: string;
  badgeColor: string;
  rotation: string;
  barColor?: "amber" | "default";
}

const getSubjectStyle = (title: string, iconOverride?: string): SubjectStyle => {
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
      badgeColor: "var(--ink-on-accent)",
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
      badgeColor: "var(--ink-on-accent)",
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

export const LibraryView: React.FC<LibraryViewProps> = ({
  isOwner,
  books,
  db,
  libraryQuery,
  setLibraryQuery,
  sortedFilteredBooks,
  setCurBook,
  setView,
  libraryFilter = "all",
  setLibraryFilter,
  completedLessons = [],
  openLesson,
  resumeLesson,
}) => {
  // Aggregate stats across library books
  const { totalSubjects, totalChapters, completedCount } = useMemo(() => {
    let chaptersCount = 0;
    const completedSet = new Set(completedLessons);
    (books || []).forEach((b) => {
      (b.chapters || []).forEach((ch: any) => {
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
  const jumpBackInItems = useMemo(() => {
    const list: Array<{ book: any; chapter: any; minutesLeft: number; icon: string; badgeClass: string }> = [];
    const completedSet = new Set(completedLessons);

    if (resumeLesson && resumeLesson.book && resumeLesson.chapter) {
      const style = getSubjectStyle(resumeLesson.book.title, resumeLesson.book.icon);
      let badgeClass = "sa-b-azure";
      if (style.color === "var(--jade)") badgeClass = "sa-b-jade";
      else if (style.color === "var(--amber)") badgeClass = "sa-b-amber";
      else if (style.color === "var(--coral)") badgeClass = "sa-b-coral";

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
      if (list.length >= 3) break;
      for (const ch of b.chapters || []) {
        if (list.length >= 3) break;
        if (list.some((item) => item.chapter.id === ch.id)) continue;
        if (!completedSet.has(ch.id)) {
          const style = getSubjectStyle(b.title, b.icon);
          let badgeClass = "sa-b-azure";
          if (style.color === "var(--jade)") badgeClass = "sa-b-jade";
          else if (style.color === "var(--amber)") badgeClass = "sa-b-amber";
          else if (style.color === "var(--coral)") badgeClass = "sa-b-coral";

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

  return (
    <motion.div
      key="library"
      initial={{ opacity: 0, y: 20, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="page-shell sa-dash-wrap"
    >
      {/* ── Header Row: Title, Subtitle, Filter Chips & Add Button ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "20px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 className="sa-h1">The Vault</h1>
            {isOwner && (
              <button
                onClick={() => {
                  const t = prompt("Book Name?");
                  if (t) {
                    const nl = [...books, { id: Date.now().toString(), title: t, chapters: [] }];
                    setDoc(doc(db, "data", "pajji_database"), { books: nl });
                  }
                }}
                className="sa-btn sa-btn-p sa-btn-sm"
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                + New Book
              </button>
            )}
          </div>
          <p className="sa-sub" style={{ marginTop: "6px" }}>
            {totalSubjects} subjects · {totalChapters} chapters
            {completedCount > 0 ? ` · ${completedCount} completed` : " · 12 saved for later"}
          </p>
        </div>

        {/* Filter Chips matching mockup: All, In progress, Saved, Completed */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => setLibraryFilter && setLibraryFilter("all")}
            className={`sa-badge ${libraryFilter === "all" ? "sa-b-jade" : "sa-b-line"}`}
            style={{ cursor: "pointer", border: "none" }}
          >
            All
          </button>
          <button
            onClick={() => setLibraryFilter && setLibraryFilter("inProgress")}
            className={`sa-badge ${libraryFilter === "inProgress" ? "sa-b-jade" : "sa-b-line"}`}
            style={{ cursor: "pointer", border: "none" }}
          >
            In progress
          </button>
          <button
            onClick={() => setLibraryFilter && setLibraryFilter("notStarted")}
            className={`sa-badge ${libraryFilter === "notStarted" ? "sa-b-jade" : "sa-b-line"}`}
            style={{ cursor: "pointer", border: "none" }}
          >
            Saved
          </button>
          <button
            onClick={() => setLibraryFilter && setLibraryFilter("mastered")}
            className={`sa-badge ${libraryFilter === "mastered" ? "sa-b-jade" : "sa-b-line"}`}
            style={{ cursor: "pointer", border: "none" }}
          >
            Completed
          </button>
        </div>
      </div>

      {/* ── Search Bar Input ── */}
      <div
        className="sa-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          marginBottom: "24px",
        }}
      >
        <span style={{ color: "var(--dim)", fontSize: "16px" }}>⌕</span>
        <input
          type="text"
          placeholder="Search the vault…"
          value={libraryQuery}
          onChange={(e) => setLibraryQuery(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontFamily: "var(--body)",
            fontSize: "13.5px",
          }}
        />
        {libraryQuery && (
          <button
            onClick={() => setLibraryQuery("")}
            style={{
              background: "none",
              border: "none",
              color: "var(--faint)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* ── Subject Grid (Desktop: 4 columns; Mobile: 2 columns) ── */}
      <div className="sa-lib-grid">
        {sortedFilteredBooks.map((b) => {
          const chapters = b.chapters || [];
          const totalLessons = chapters.length;
          const completedSet = new Set(completedLessons);
          const doneLessons = chapters.filter((ch: any) => completedSet.has(ch.id)).length;
          const pct = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

          const style = getSubjectStyle(b.title, b.icon);

          return (
            <div
              key={b.id}
              onClick={() => {
                setCurBook(b);
                setView("chapters");
              }}
              className="sa-card sa-lib-card"
            >
              <div className="sa-lib-cover" style={{ background: style.gradient }}>
                <span>{style.icon}</span>
                <div
                  className="sa-sticker sa-lib-sticker"
                  style={{
                    top: "10px",
                    right: "10px",
                    background: style.badgeBg,
                    color: style.badgeColor,
                    transform: `rotate(${style.rotation})`,
                  }}
                >
                  {pct}%
                </div>
              </div>

              <div
                className="sa-lib-card-title"
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  lineHeight: "1.25",
                  color: "var(--text)",
                }}
              >
                {b.title}
              </div>

              <div
                className="sa-sub sa-lib-meta-desktop"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  margin: "5px 0 12px",
                }}
              >
                {totalLessons} chapters · {doneLessons} done
              </div>

              <div className={`sa-bar ${style.barColor === "amber" ? "amber" : ""}`} style={{ marginTop: "7px" }}>
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Jump Back In Section ── */}
      {jumpBackInItems.length > 0 && (
        <div style={{ marginTop: "26px" }}>
          <div className="sa-h2" style={{ marginBottom: "14px" }}>
            Jump back in
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {jumpBackInItems.map((item, idx) => (
              <div key={item.chapter.id || idx} className="sa-rank-row">
                <span className={`sa-badge ${item.badgeClass}`}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.chapter.title}
                  </div>
                  <div
                    className="sa-sub"
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.book.title} · {item.minutesLeft} min left
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (openLesson) {
                      openLesson(item.book, item.chapter);
                    } else {
                      setCurBook(item.book);
                      setView("study");
                    }
                  }}
                  className={`sa-btn ${idx === 0 ? "sa-btn-p" : "sa-btn-g"} sa-btn-sm`}
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
