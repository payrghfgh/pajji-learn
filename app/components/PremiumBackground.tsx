"use client";

import React from "react";

/**
 * The shell background.
 *
 * This used to render two animated mesh gradients (jade at 14%, accent at 20%),
 * a noise texture loaded from a third-party URL, and a grid overlay -- all fixed
 * behind every screen. The plan draws none of it: every app screen sits on flat
 * --ink-0, and the only deliberate atmosphere in the design is Focus Flight's
 * .sky, which that screen renders for itself.
 *
 * The wash was also why Settings read green rather than near-black: a 22%-alpha
 * jade radial covering the viewport tints the whole page, and no amount of
 * tokenising the cards fixes a background that is not the background.
 *
 * Kept as a component so layout.tsx does not change, and so the flat surface has
 * one owner.
 */
export const PremiumBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-[var(--bg,#08090C)] transition-colors duration-500" />
  );
};
