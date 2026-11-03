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
    <button onClick={onBack} className="btn-link" style={{ marginBottom: "16px" }}>← Library 📚</button>
    <div className="page-header">
      <h1 className="page-title">{book.title}</h1>
      {isOwner && <button onClick={onAddLesson} className="btn btn-primary">+ Add Lesson</button>}
    </div>
    {(book.chapters || []).map((chapter: any) => (
      <div key={chapter.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "18px 24px" }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "17px", fontWeight: "700" }}>{chapter.title}</span>
          {completedLessons.includes(chapter.id) && <span style={{ marginLeft: "12px", fontSize: "11px", color: "var(--accent)", fontWeight: "900", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: "10px" }}>✓ MASTERED</span>}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => onStudy(chapter)} className="btn btn-primary" style={{ padding: "8px 20px" }}>Study</button>
          {isOwner && <button onClick={() => onEdit(chapter)} className="btn btn-secondary" style={{ padding: "8px 12px" }}>✎</button>}
        </div>
      </div>
    ))}
  </div>
);
