"use client";
import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Crown, CheckCircle2, Star, Zap, Sparkles, Clock, Flame, Heart, Brain, Send } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";

interface MembershipViewProps {
  memTier: string;
  setView: (v: string) => void;
  handleCardMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCardMouseLeave: () => void;
  rotateX: any;
  rotateY: any;
  shineBackground: any;
  user: any;
  getUserName: (u: any) => string;
  profilePic: string;
  membershipExpiry: string;
  getDayDiff: (from: string, to: string) => number;
  getLocalDateKey: () => string;
  userData: any;
  db: any;
  setSaveStatus: (v: string) => void;
}

export const MembershipView: React.FC<MembershipViewProps> = ({
  memTier, setView, handleCardMouseMove, handleCardMouseLeave,
  rotateX, rotateY, shineBackground, user, getUserName, profilePic,
  membershipExpiry, getDayDiff, getLocalDateKey, userData, db, setSaveStatus
}) => {
  return (
    <motion.div
      key="membership"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="page-shell" style={{ maxWidth: "600px" }}
    >
      <button onClick={() => setView("settings")} className="btn-link" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
        <ChevronLeft size={18} /> Back to Settings
      </button>

      <h1 className="page-title" style={{ marginBottom: "32px" }}>Membership 🏅</h1>

      <div className="card" style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
        {memTier !== "free" && memTier !== "" ? (
          <>
            <motion.div 
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{ 
                width: "100%", 
                maxWidth: "380px", 
                aspectRatio: "1.586", 
                background: memTier === "ultra" ? "linear-gradient(135deg, #FFD700, #F59E0B)" : memTier === "pro" ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "linear-gradient(135deg, #8B5CF6, #6D28D9)", 
                borderRadius: "20px", 
                padding: "24px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                boxShadow: memTier === "ultra" ? "0 20px 40px rgba(245, 158, 11, 0.3)" : "0 20px 40px rgba(59, 130, 246, 0.3)", 
                position: "relative", 
                overflow: "hidden", 
                color: memTier === "ultra" ? "#000" : "#FFF",
                margin: "0 auto 8px auto",
                perspective: "1000px",
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)", pointerEvents: "none" }} />
              
              {memTier === "ultra" && (
                <motion.div 
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.05) 55%, transparent 100%)",
                    backgroundSize: "200% 200%",
                    zIndex: 2,
                    pointerEvents: "none",
                    mixBlendMode: "overlay"
                  }}
                  animate={{ backgroundPosition: ["0% 0%", "200% 200%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              )}

              <motion.div style={{ position: "absolute", inset: 0, background: shineBackground, zIndex: 3, pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", transform: "translateZ(20px)" }}>
                <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: "800", fontSize: "16px", margin: 0, letterSpacing: "0.5px" }}>PAJJI SERVICES</h3>
                <div style={{ opacity: 0.8 }}>
                  {memTier === "ultra" ? (
                    <Crown size={20} />
                  ) : memTier === "pro" ? (
                    <Zap size={20} />
                  ) : (
                    <Star size={20} />
                  )}
                </div>
              </div>
              
              <div style={{ position: "relative", zIndex: 1, textAlign: "center", transform: "translateZ(40px)" }}>
                <h2 style={{ fontFamily: "var(--font-syne)", fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "1px", textTransform: "uppercase" }}>
                  {memTier === "ultra" ? "Pajji Ultra" : memTier === "pro" ? "Pajji Pro" : "Pajji Plus"}
                </h2>
              </div>

              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end", transform: "translateZ(20px)" }}>
                <div>
                  <p style={{ fontSize: "10px", fontWeight: "700", opacity: 0.7, textTransform: "uppercase", marginBottom: "2px" }}>Valid Thru</p>
                  <p style={{ fontSize: "14px", fontWeight: "800", fontFamily: "monospace", letterSpacing: "1px" }}>
                    {membershipExpiry ? new Date(membershipExpiry).toLocaleDateString("en-IN", { month: "2-digit", year: "2-digit" }) : "LIFETIME"}
                  </p>
                  {membershipExpiry && (
                    (() => {
                      const expired = new Date(membershipExpiry) < new Date();
                      return !expired && (
                        <div style={{ 
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "rgba(0,0,0,0.25)",
                          padding: "4px 8px",
                          borderRadius: "8px",
                          marginTop: "8px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          backdropFilter: "blur(4px)"
                        }}>
                          <Clock size={10} color="white" />
                          <p style={{ fontSize: "10px", fontWeight: "800", color: "white", letterSpacing: "0.3px", margin: 0 }}>
                            Expires in {Math.max(0, getDayDiff(getLocalDateKey(), membershipExpiry.split('T')[0]))} days
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>{getUserName(user)}</p>
                  <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                    {memTier === "ultra" && <Sparkles size={12} color="#FFD700" />}
                    <CheckCircle2 size={12} color="rgba(255,255,255,0.5)" />
                  </div>
                </div>
              </div>
            </motion.div>

            <div style={{ width: "100%", background: "var(--input-bg)", borderRadius: "16px", padding: "20px", textAlign: "left", border: "1px solid var(--border)", marginTop: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: "900", color: "var(--accent)", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "1px" }}>Benefits Included</p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600" }}><div style={{ color: "var(--accent)" }}>✓</div> 2× XP Multiplier (Level up twice as fast)</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600" }}><div style={{ color: "var(--accent)" }}>✓</div> Unlimited Free Quiz Skips</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600" }}><div style={{ color: "var(--accent)" }}>✓</div> Full Access to All Premium Themes</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600" }}><div style={{ color: "var(--accent)" }}>✓</div> Unified Premium Badge Appearance</li>
              </ul>
            </div>

            <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "700", marginTop: "16px", fontStyle: "italic", opacity: 0.8, textAlign: "center" }}>
              Please contact Rushan either on WhatsApp or face to face if applied
            </p>
          </>
        ) : (
          <>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--input-bg)", display: "grid", placeItems: "center", border: "1px dashed var(--border)" }}>
              <Star size={32} color="var(--muted)" />
            </div>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", marginBottom: "8px" }}>No Active Membership</h2>
              <p style={{ fontSize: "14px", color: "var(--accent)", fontWeight: "700", lineHeight: "1.6", maxWidth: "300px", margin: "12px auto 0", fontStyle: "italic" }}>
                Please contact Rushan either on WhatsApp or face to face if applied
              </p>
            </div>
            <button
              onClick={() => window.open('https://pajji-services.netlify.app/#memberships', '_blank')}
              className="btn btn-primary"
              style={{ width: "100%", padding: "16px", borderRadius: "16px", fontSize: "16px", fontWeight: "800", marginTop: "12px", boxShadow: "0 10px 25px -5px rgba(var(--accent-rgb), 0.4)" }}
            >
              Explore Memberships
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};
