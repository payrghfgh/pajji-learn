"use client";

import React from "react";
import { MotionConfig } from "framer-motion";

/**
 * Root motion configuration. Lives in a client component because app/layout.tsx
 * is a Server Component and framer-motion's entry point carries no "use client"
 * boundary, so importing MotionConfig there directly fails at build time.
 *
 * reducedMotion="user" makes framer-motion honour prefers-reduced-motion:
 * transform and layout animations are skipped, opacity still animates. The CSS
 * rule in globals.css cannot reach framer-motion, which drives its own
 * animation loop. At the root this also covers the loading splash and
 * PremiumBackground, which both render outside AppShell.
 */
export const MotionProvider = ({ children }: { children: React.ReactNode }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
