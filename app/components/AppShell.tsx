"use client";

import React from "react";

type AppShellProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const AppShell = ({ className = "", style, children }: AppShellProps) => (
  <div className={`sa-shell-screen ${className}`} style={style}>
    {children}
  </div>
);
