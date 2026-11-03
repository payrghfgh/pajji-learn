"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const CursorTrail = () => {
  const mouse = { x: useMotionValue(0), y: useMotionValue(0) };
  useEffect(() => {
    const move = (event: MouseEvent) => { mouse.x.set(event.clientX); mouse.y.set(event.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <motion.div style={{ position: "fixed", top: -20, left: -20, width: 40, height: 40, borderRadius: "50%", background: "var(--accent)", opacity: 0.15, filter: "blur(20px)", pointerEvents: "none", zIndex: 9999, x: useSpring(mouse.x, { damping: 20, stiffness: 200 }), y: useSpring(mouse.y, { damping: 20, stiffness: 200 }) }} />;
};

export const FocusGarden = ({ gardenPlants, memTier }: { gardenPlants: number; memTier: string }) => (
  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", padding: "20px" }}>
    {[...Array(gardenPlants)].map((_, index) => {
      const isUltra = memTier === "ultra";
      return <motion.div key={index} className={`leaf-grow ${isUltra ? "ultra-glow" : ""}`} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} whileHover={{ opacity: 0.8 }} style={{ width: "24px", height: "40px", color: isUltra ? "#FFD700" : "var(--accent)", filter: isUltra ? "drop-shadow(0 0 8px rgba(255,215,0,0.5))" : "none" }}><svg viewBox="0 0 100 100"><path d="M 50 100 C 20 70 20 30 50 0 C 80 30 80 70 50 100" fill="currentColor" /></svg></motion.div>;
    })}
    {gardenPlants === 0 && <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: "700" }}>Start focusing to grow your garden...</div>}
  </div>
);

export const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    let timer: number;
    const step = () => {
      const diff = end - start;
      if (Math.abs(diff) < 1) { setDisplayValue(end); return; }
      start += diff * 0.1;
      setDisplayValue(Math.round(start));
      timer = requestAnimationFrame(step);
    };
    timer = requestAnimationFrame(step);
    return () => cancelAnimationFrame(timer);
  }, [value]);
  return <span>{displayValue}</span>;
};

export const FloatingParticles = () => {
  const particles = useMemo(() => [...Array(8)], []);
  return <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    {particles.map((_, index) => <motion.div key={index} initial={{ x: Math.random() * 100 + "%", y: Math.random() * 100 + "%", opacity: 0.1 }} animate={{ y: [null, "-20%", "120%"], x: [null, `${Math.random() * 100}%`], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 25 + Math.random() * 25, repeat: Infinity, ease: "linear", delay: index * -8 }} style={{ position: "absolute", width: Math.random() * 200 + 100 + "px", height: Math.random() * 200 + 100 + "px", background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)", willChange: "transform, opacity", transform: "translateZ(0)" }} />)}
  </div>;
};
