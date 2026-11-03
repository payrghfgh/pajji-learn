"use client";

import React from "react";
import { MotionConfig } from "framer-motion";

type AppShellProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const AppShell = ({ className = "", style, children }: AppShellProps) => (
  // reducedMotion="user" makes framer-motion honour prefers-reduced-motion:
  // transform and layout animations are skipped, opacity still animates. The
  // CSS rule in globals.css cannot reach framer-motion, which drives its own
  // animation loop, so without this the brief's "kill transforms, keep
  // opacity" was false for every motion.* element in the shell.
  <MotionConfig reducedMotion="user">
    <div className={`sa-shell-screen ${className}`} style={style}>
      {children}
    </div>
  </MotionConfig>
);
