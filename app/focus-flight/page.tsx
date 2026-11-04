'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, BarChart3, Globe, Navigation } from 'lucide-react';
import { getActiveFlight, setActiveFlight, saveFlightSession, getFlightHistory, FlightSession, FlightHistory, Route } from '@/lib/focus-flight';
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

  // PROGRESS TRACKER
  useEffect(() => {
    if (!activeFlight || (phase !== 'cruise' && phase !== 'landing') || isPaused) {
      if (!activeFlight || (phase !== 'cruise' && phase !== 'landing')) setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const elapsedMs = Date.now() - activeFlight.startTime;
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
        // Calculate if flight is technically over
        const elapsedMs = Date.now() - savedActive.startTime;
        const totalMs = savedActive.route.duration * 60 * 1000;
        
        if (elapsedMs >= totalMs) {
          setActiveFlightState(savedActive);
          setPhase('landing');
        } else {
          setActiveFlightState(savedActive);
          setPhase('cruise');
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

  return (
    <div className="min-h-screen bg-[var(--ink-0)] text-[var(--text)] overflow-hidden relative selection:bg-[var(--jade-soft)]">
      {/* MAP BACKGROUND ENGINE */}
      <div className="absolute inset-0 z-0">
        <FlightMap 
          origin={activeFlight?.route.from.coords || { lat: 20, lng: 77 }}
          destination={activeFlight?.route.to.coords || { lat: 20, lng: 77 }}
          progress={progress}
          isActive={!!activeFlight}
        />
      </div>

      {/* TOP NAVIGATION */}
      <nav className="relative z-[150] px-10 py-8 flex justify-between items-center border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--ink-1)_40%,transparent)] backdrop-blur-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[var(--jade)] rounded-[22px] flex items-center justify-center shadow-[0_12px_34px_rgba(0,0,0,0.5)] border border-[var(--jade-soft)]">
            <Plane className="w-8 h-8 text-[var(--ink-on-accent)] -rotate-12" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black tracking-tighter italic leading-none uppercase">Focus Flight</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--jade)] animate-pulse" />
              <p className="text-[11px] text-[var(--faint)] font-black uppercase tracking-[0.4em]">Route Network: Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button 
            onClick={() => setPhase('stats')}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest ${phase === 'stats' ? 'bg-[var(--jade)] text-[var(--ink-on-accent)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]' : 'text-[var(--faint)] hover:text-[var(--text)] hover:bg-[var(--ink-2)]'}`}
          >
            <BarChart3 size={18} /> Pilot Log
          </button>
          <button 
            onClick={() => setPhase('hub')}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest ${phase === 'hub' ? 'bg-[var(--jade)] text-[var(--ink-on-accent)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]' : 'text-[var(--faint)] hover:text-[var(--text)] hover:bg-[var(--ink-2)]'}`}
          >
            <Globe size={18} /> Terminal
          </button>
        </div>
      </nav>

      {/* VIEWPORT CONTROLLER */}
      <main className="relative z-10 container mx-auto px-10 py-12 h-[calc(100vh-120px)] bg-transparent overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'hub' && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1"
            >
              <AirportHub history={history} onSelectRoute={initiateBoarding} />
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
              className="fixed inset-0 z-[200] bg-transparent"
            >
              <CruisePhase 
                session={activeFlight} 
                progress={progress}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
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
