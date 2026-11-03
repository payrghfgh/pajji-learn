"use client";

import React from "react";

type AppNavigationProps = {
  view: string;
  sidebarStyle?: string;
  setView: (view: string) => void;
  fetchLeaderboard: () => void;
  onFocusFlight: () => void;
  onSignOut: () => void;
  userXP?: number;
  userLevel?: number;
};

export const AppNavigation = ({
  view,
  setView,
  fetchLeaderboard,
  onFocusFlight,
  onSignOut,
  userXP = 0,
  userLevel = 1,
}: AppNavigationProps) => {
  const currentLvlXP = userXP % 1000;
  const xpNeeded = Math.max(0, 1000 - currentLvlXP);
  const lvlProgressPct = Math.min(100, Math.round((currentLvlXP / 1000) * 100));

  return (
    <aside className="sa-side">
      {/* Brand Logo */}
      <div className="sa-logo" onClick={() => setView("dashboard")}>
        <div className="sa-mark">P</div>
        <div className="sa-nm">
          PAJJI <span>LEARN</span>
        </div>
      </div>

      {/* Group: Study */}
      <div className="sa-nav-l">Study</div>

      <button
        type="button"
        className={`sa-nav ${view === "dashboard" ? "on" : ""}`}
        onClick={() => setView("dashboard")}
      >
        <span className="sa-gi">▦</span>
        Dashboard
      </button>

      <button
        type="button"
        className={`sa-nav ${view === "library" || view === "chapters" ? "on" : ""}`}
        onClick={() => setView("library")}
      >
        <span className="sa-gi">▤</span>
        Library
      </button>

      <button
        type="button"
        className={`sa-nav ${view === "study" ? "on" : ""}`}
        onClick={() => setView("study")}
      >
        <span className="sa-gi">✦</span>
        Flashcards
      </button>

      <button
        type="button"
        className="sa-nav"
        onClick={onFocusFlight}
      >
        <span className="sa-gi">✈</span>
        Focus Flight
        <span className="sa-tag">new</span>
      </button>

      {/* Group: Community */}
      <div className="sa-nav-l">Community</div>

      <button
        type="button"
        className={`sa-nav ${view === "leaderboard" ? "on" : ""}`}
        onClick={() => {
          setView("leaderboard");
          fetchLeaderboard();
        }}
      >
        <span className="sa-gi">▲</span>
        Leaderboard
      </button>

      <button
        type="button"
        className={`sa-nav ${view === "membership" ? "on" : ""}`}
        onClick={() => setView("membership")}
      >
        <span className="sa-gi">◆</span>
        Membership
      </button>

      {/* Rail Foot: Level card, Settings & Logout */}
      <div className="sa-side-foot">
        <div className="sa-lvlbox">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
            <span className="sa-badge sa-b-amber">
              ★ Level {userLevel}
            </span>
            <span className="sa-sub" style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--faint)" }}>
              {userXP.toLocaleString()} XP
            </span>
          </div>
          <div className="sa-bar">
            <i style={{ width: `${lvlProgressPct}%` }} />
          </div>
          <div className="sa-sub" style={{ fontFamily: "var(--mono)", fontSize: "11px", marginTop: "8px", color: "var(--faint)" }}>
            {xpNeeded} XP to Level {userLevel + 1}
          </div>
        </div>

        <button
          type="button"
          className={`sa-nav ${view === "settings" ? "on" : ""}`}
          onClick={() => setView("settings")}
          style={{ marginTop: "4px" }}
        >
          <span className="sa-gi">⚙</span>
          Settings
        </button>

        <button
          type="button"
          className="sa-nav"
          onClick={onSignOut}
          style={{ color: "var(--coral)" }}
        >
          <span className="sa-gi">⏻</span>
          Log out
        </button>
      </div>
    </aside>
  );
};

