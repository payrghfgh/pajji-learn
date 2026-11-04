'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, BarChart3, Globe, Navigation } from 'lucide-react';
import { getActiveFlight, setActiveFlight, saveFlightSession, getFlightHistory, elapsedFocusMs, pausedTotal, FlightSession, FlightHistory, Route } from '@/lib/focus-flight';
import AirportHub from './components/AirportHub';
import BoardingPass from './components/BoardingPass';
import CruisePhase from './components/Cruise';
import LandingPhase from './components/Landing';
import StatsPhase from './components/Stats';
import FlightMap from './components/FlightMap';

export type FlightPhase = 'hub' | 'boarding' | 'cruise' | 'landing' | 'stats';

export default function FocusFlightPage() {
  const [phase, setPhase] = useState<FlightPhase>('hub');
  const [activeFlight, setActiveFlightState] = useState<FlightSession | null>(null);
  const [history, setHistory] = useState<FlightHistory>({ sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] });
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cruiseRef = useRef<HTMLDivElement>(null);

  // PROGRESS TRACKER
  useEffect(() => {
    if (!activeFlight || (phase !== 'cruise' && phase !== 'landing') || isPaused) {
      if (!activeFlight || (phase !== 'cruise' && phase !== 'landing')) setProgress(0);
      return;
    }

    const calculateProgress = () => {
      // Focus time, not wall time: elapsedFocusMs subtracts every paused span,
      // including one still running.
      const elapsedMs = elapsedFocusMs(activeFlight);
      const totalMs = activeFlight.route.duration * 60 * 1000;
      return Math.min(Math.max(elapsedMs / totalMs, 0), 1);
    };

    setProgress(calculateProgress());

    const interval = setInterval(() => {
      const p = calculateProgress();
      setProgress(p);
      if (p >= 1 && phase === 'cruise') {
        setPhase('landing');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeFlight, phase, isPaused]);

  // SESSION RESTORATION ENGINE
  useEffect(() => {
    const init = () => {
      const savedHistory = getFlightHistory();
      setHistory(savedHistory);
      
      const savedActive = getActiveFlight();
      if (savedActive) {
        // Calculate if flight is technically over, excluding paused spans --
        // pausedAt survives in localStorage, so a reload mid-pause resumes with
        // the clock where it stopped rather than where wall time reached.
        const elapsedMs = elapsedFocusMs(savedActive);
        const totalMs = savedActive.route.duration * 60 * 1000;
        
        if (elapsedMs >= totalMs) {
          setActiveFlightState(savedActive);
          setPhase('landing');
        } else {
          setActiveFlightState(savedActive);
          setPhase('cruise');
          if (savedActive.pausedAt) setIsPaused(true);
        }
      }
    };
    init();
  }, []);

  const initiateBoarding = useCallback((route: Route) => {
    setSelectedRoute(route);
    setPhase('boarding');
  }, []);

  const startFlight = useCallback((session: FlightSession) => {
    setActiveFlightState(session);
    setActiveFlight(session);
    setPhase('cruise');
  }, []);

  const completeFlight = useCallback((rating: number, reflection: string, status: 'completed' | 'interrupted') => {
    if (!activeFlight) return;

    const finishedSession: FlightSession = {
      ...activeFlight,
      status,
      focusRating: rating,
      reflection,
    };

    saveFlightSession(finishedSession);
    setActiveFlightState(null);
    setActiveFlight(null);
    setHistory(getFlightHistory());
    setPhase('stats');
  }, [activeFlight]);

  const cancelFlight = useCallback(() => {
    if (window.confirm('ABORT MISSION? Critical deviation will be logged in your profile.')) {
      completeFlight(0, 'Mission aborted by pilot manually.', 'interrupted');
    }
  }, [completeFlight]);

  // Pause stamps pausedAt; resume folds the span into pausedMs and clears it.
  // Both are persisted, so a reload mid-pause still knows how long it has been
  // stopped and subtracts that span on resume.
  const togglePause = useCallback(() => {
    if (!activeFlight) return;
    const next = !isPaused;
    const updated: FlightSession = next
      ? { ...activeFlight, pausedAt: Date.now() }
      : { ...activeFlight, pausedMs: pausedTotal(activeFlight), pausedAt: null };
    setIsPaused(next);
    setActiveFlightState(updated);
    setActiveFlight(updated);
  }, [activeFlight, isPaused]);

  // Move focus into the full-screen flight view on mount, so it is announced and
  // the first Tab lands inside it rather than on the inert background.
  useEffect(() => {
    if (phase === 'cruise') cruiseRef.current?.focus();
  }, [phase]);

  return (
    <div className="min-h-screen bg-[var(--ink-0)] text-[var(--text)] overflow-hidden relative selection:bg-[var(--jade-soft)]">
      {/* MAP BACKGROUND ENGINE */}
      <div inert={phase === 'cruise'} className="absolute inset-0 z-0">
        <FlightMap 
          origin={activeFlight?.route.from.coords || { lat: 20, lng: 77 }}
          destination={activeFlight?.route.to.coords || { lat: 20, lng: 77 }}
          progress={progress}
          isActive={!!activeFlight}
        />
      </div>

      {/* TOP NAVIGATION */}
      <nav inert={phase === 'cruise'} className="relative z-[150] flex items-center gap-[30px] h-[74px] px-[54px] border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--ink-1)_40%,transparent)] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--jade)] rounded-[13px] flex items-center justify-center shadow-[0_12px_34px_rgba(0,0,0,0.5)] border border-[var(--jade-soft)]">
            <Plane className="w-5 h-5 text-[var(--ink-on-accent)] -rotate-12" />
          </div>
          <h1 className="text-[15px] font-black tracking-tighter leading-none uppercase">Focus Flight</h1>
        </div>

        {/* Plan draws three plain spans with no current marker. Keeping the app's
            active state rather than removing a working affordance to match a
            drawing -- a nav with no current marker is a defect, not a style. */}
        <div className="flex items-center gap-[26px] text-[14px] font-semibold">
          <button
            onClick={() => setPhase('hub')}
            className={phase === 'hub' ? 'text-[var(--jade)]' : 'text-[var(--dim)] hover:text-[var(--text)]'}
          >
            Departures
          </button>
          <button
            aria-disabled="true"
            title="No My flights screen yet"
            className="text-[var(--faint)] cursor-not-allowed opacity-60"
          >
            My flights
          </button>
          <button
            onClick={() => setPhase('stats')}
            className={phase === 'stats' ? 'text-[var(--jade)]' : 'text-[var(--dim)] hover:text-[var(--text)]'}
          >
            Stats
          </button>
        </div>
      </nav>

      {/* VIEWPORT CONTROLLER */}
      <main className={`relative z-10 container mx-auto h-[calc(100vh-120px)] bg-transparent overflow-y-auto ${phase === 'hub' ? 'px-0 py-0' : 'px-10 py-12'}`}>
        <AnimatePresence mode="wait">
          {phase === 'hub' && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: "36px", padding: "38px 54px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                <span style={{ alignSelf: "flex-start", marginBottom: "16px", fontSize: "12px", fontWeight: "500", color: "var(--azure)", background: "var(--azure-soft)", border: "1px solid var(--azure-soft)", borderRadius: "999px", padding: "5px 10px", letterSpacing: "0.02em" }}>
                  ◈ Departing now
                </span>
                <div style={{ fontFamily: "var(--disp)", fontWeight: 800, fontSize: "58px", lineHeight: 0.98, letterSpacing: "-.035em", color: "var(--text)" }}>
                  Boarding<br />to <span style={{ color: "var(--jade)" }}>Deep Focus</span>
                </div>
                <p style={{ color: "var(--dim)", margin: "18px 0 26px", maxWidth: "430px", fontSize: "15px" }}>
                  Phones down, notifications off, one subject. Land in 25 minutes with a chapter done.
                </p>
                <div style={{ display: "flex", gap: "12px", marginTop: "22px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--jade)", background: "var(--jade-soft)", border: "1px solid var(--jade-soft)", borderRadius: "999px", padding: "5px 10px" }}>✓ No phone</span>
                  <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--azure)", background: "var(--azure-soft)", border: "1px solid var(--azure-soft)", borderRadius: "999px", padding: "5px 10px" }}>♪ Cabin sounds</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                <AirportHub history={history} onSelectRoute={initiateBoarding} />
              </div>
            </motion.div>
          )}

          {phase === 'boarding' && selectedRoute && (
            <motion.div
              key="boarding"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1"
            >
              <BoardingPass 
                route={selectedRoute}
                onBoard={startFlight}
                onCancel={() => setPhase('hub')}
              />
            </motion.div>
          )}

          {phase === 'cruise' && activeFlight && (
            <motion.div
              key="cruise"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={cruiseRef}
              role="dialog"
              aria-modal="true"
              aria-label="Focus flight in progress"
              tabIndex={-1}
              className="fixed inset-0 z-[200] bg-transparent outline-none"
            >
              <CruisePhase 
                session={activeFlight} 
                progress={progress}
                isPaused={isPaused}
                onTogglePause={togglePause}
                onComplete={() => setPhase('landing')}
                onCancel={cancelFlight}
              />
            </motion.div>
          )}

          {phase === 'landing' && activeFlight && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex-1"
            >
              <LandingPhase 
                session={activeFlight} 
                onFinish={completeFlight}
              />
            </motion.div>
          )}

          {phase === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <StatsPhase history={history} onNewFlight={() => setPhase('hub')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
