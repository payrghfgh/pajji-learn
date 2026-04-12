"use client";

import React from "react";
import { motion } from "framer-motion";

export const PremiumBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--bg,#0a0a0c)] transition-colors duration-500">
      {/* Animated Mesh Gradients */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-[var(--accent-soft,rgba(147,51,234,0.2))] blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-[color-mix(in_oklab,var(--accent,#0891b2)_20%,transparent)] blur-[120px]"
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    </div>
  );
};
