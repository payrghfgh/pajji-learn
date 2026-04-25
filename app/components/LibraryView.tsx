"use client";
import React from "react";
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
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  isOwner,
  books,
  db,
  libraryQuery,
  setLibraryQuery,
  sortedFilteredBooks,
  setCurBook,
  setView
}) => {
  return (
    <motion.div
      key="library"
      initial={{ opacity: 0, x: 30, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="page-shell"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1 className="page-title">The Vault 📚</h1>
        {isOwner && (
          <button 
            onClick={() => { 
              const t = prompt("Book Name?"); 
              if (t) { 
                const nl = [...books, { id: Date.now().toString(), title: t, chapters: [] }]; 
                setDoc(doc(db, "data", "pajji_database"), { books: nl }); 
              } 
            }} 
            className="btn btn-primary"
          >
            + New Book
          </button>
        )}
      </div>

      <div className="card" style={{ display: "flex", gap: "16px", padding: "16px", marginBottom: "32px" }}>
        <input 
          type="text" 
          placeholder="Search the library..." 
          value={libraryQuery} 
          onChange={(e) => setLibraryQuery(e.target.value)} 
          style={{ flex: 1, padding: "12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)" }} 
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
        {sortedFilteredBooks.map(b => (
          <motion.div
            key={b.id}
            whileHover={{ y: -5, borderColor: "var(--accent)" }}
            onClick={() => { setCurBook(b); setView("chapters"); }}
            className="card" style={{ cursor: "pointer", textAlign: "center", transition: "all 0.3s ease" }}
          >
            <div style={{ height: "120px", background: "var(--input-bg)", borderRadius: "16px", marginBottom: "16px", display: "grid", placeItems: "center", fontSize: "40px" }}>📖</div>
            <h3 style={{ fontWeight: "800" }}>{b.title}</h3>
            <p style={{ fontSize: "12px", opacity: 0.5 }}>{b.chapters?.length || 0} Lessons</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
