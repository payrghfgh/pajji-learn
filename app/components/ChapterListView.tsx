"use client";

import React from "react";

type ChapterListViewProps = {
  book: any;
  completedLessons: string[];
  isOwner: boolean;
  onBack: () => void;
  onAddLesson: () => void;
  onStudy: (chapter: any) => void;
  onEdit: (chapter: any) => void;
};

export const ChapterListView: React.FC<ChapterListViewProps> = ({ book, completedLessons, isOwner, onBack, onAddLesson, onStudy, onEdit }) => (
  <div className="page-shell" style={{ maxWidth: "880px" }}>
    <button
      onClick={onBack}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        marginBottom: "20px",
        background: "var(--ink-2)",
        border: "1px solid var(--line)",
        borderRadius: "999px",
        color: "var(--dim)",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
      }}
    >
      ← Library
    </button>

    <div className="page-header">
      <h1 className="page-title" style={{ fontWeight: "700" }}>{book.title}</h1>
      {isOwner && <button onClick={onAddLesson} className="btn btn-primary">+ Add Lesson</button>}
    </div>

    <div style={{ display: "flex", flexDirection: "column" }}>
      {(book.chapters || []).map((chapter: any) => {
        const mastered = completedLessons.includes(chapter.id);
        return (
          <div
            key={chapter.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px 24px",
              marginBottom: "12px",
              background: "var(--ink-2)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-m)",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "var(--text)",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {chapter.title}
            </span>
            {mastered && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--jade)",
                  background: "var(--jade-soft)",
                  border: "1px solid var(--jade-soft)",
                  borderRadius: "999px",
                  padding: "3px 9px",
                  whiteSpace: "nowrap",
                }}
              >
                ✓ Mastered
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => onStudy(chapter)}
              className="btn btn-primary"
              style={{ flexShrink: 0, padding: "9px 22px", fontSize: "14px" }}
            >
              Study
            </button>
            {isOwner && (
              <button
                onClick={() => onEdit(chapter)}
                title="Edit chapter"
                aria-label="Edit chapter"
                style={{
                  flexShrink: 0,
                  padding: "9px 14px",
                  background: "transparent",
                  border: "none",
                  color: "var(--faint)",
                  cursor: "pointer",
                  borderRadius: "var(--r-s)",
                  fontSize: "15px",
                  lineHeight: 1,
                }}
              >
                ↗
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
