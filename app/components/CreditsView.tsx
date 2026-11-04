"use client";

import React from "react";
import { ChevronLeft, Heart } from "lucide-react";
import { motion } from "framer-motion";

export const CreditsView = ({ onBack }: { onBack: () => void }) => (
  <motion.div
    key="credits"
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96, y: -20 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className="page-shell" style={{ maxWidth: "600px" }}
  >
    <button onClick={onBack} className="btn-link" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
      <ChevronLeft size={18} /> Back to Settings
    </button>
    <h1 className="page-title" style={{ marginBottom: "32px" }}>Credits 🏆</h1>
    <div className="card" style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
      <div style={{ padding: "20px", borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", width: "80px", height: "80px", display: "grid", placeItems: "center" }}><Heart size={40} fill="currentColor" /></div>
      <div><h2 style={{ fontSize: "24px", fontWeight: "900", fontFamily: "var(--disp)" }}>PAJJI LEARN</h2><p style={{ color: "var(--muted)", maxWidth: "300px", margin: "12px auto" }}>Built with passion for modern students.</p></div>
      <div style={{ height: "1px", width: "60%", background: "var(--border)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div><p style={{ fontSize: "11px", fontWeight: "800", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Lead Developer</p><p style={{ fontSize: "20px", fontWeight: "700" }}>Rushan</p></div>
        <div><p style={{ fontSize: "11px", fontWeight: "800", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Main Tester</p><p style={{ fontSize: "20px", fontWeight: "700" }}>Arjun</p></div>
      </div>
      <div style={{ height: "1px", width: "60%", background: "var(--border)" }} />
      <p style={{ fontSize: "14px", fontWeight: "700", opacity: 0.8 }} />
    </div>
  </motion.div>
);
