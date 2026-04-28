'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, BarChart3, Play } from 'lucide-react';
import { getActiveFlight, setActiveFlight, saveFlightSession, getFlightHistory, FlightSession, FlightHistory } from '@/lib/focus-flight';
import AirportHub from './components/AirportHub';
import BoardingPass from './components/BoardingPass';
import CruisePhase from './components/Cruise';
import LandingPhase from './components/Landing';
import StatsPhase from './components/Stats';

export type FlightPhase = 'hub' | 'boarding' | 'cruise' | 'landing' | 'stats';

export default function FocusFlightPage() {
  const [phase, setPhase] = useState<FlightPhase>('hub');
  const [activeFlight, setActiveFlightState] = useState<FlightSession | null>(null);
  const [history, setHistory] = useState<FlightHistory>({ sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] });
  const [selectedTask, setSelectedTask] = useState({ task: '', duration: 25 });

  useEffect(() => {
    // Load history and active flight
    setHistory(getFlightHistory());
    const savedActive = getActiveFlight();
    if (savedActive) {
      setActiveFlightState(savedActive);
      setPhase('cruise');
    }
  }, []);

  const initiateBoarding = (task: string, duration: number) => {
    setSelectedTask({ task, duration });
    setPhase('boarding');
  };

  const startFlight = (session: FlightSession) => {
    setActiveFlightState(session);
    setActiveFlight(session);
    setPhase('cruise');
  };

  const completeFlight = (rating: number, reflection: string, status: 'completed' | 'interrupted') => {
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
  };

  const cancelFlight = () => {
    if (window.confirm('Abort flight? This will be marked as an interrupted mission.')) {
      completeFlight(0, 'Aborted by user', 'interrupted');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-50 px-8 py-6 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-900/40">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic">FOCUS FLIGHT</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Operational Terminal v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setPhase('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${phase === 'stats' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <BarChart3 className="w-5 h-5" /> LOGBOOK
          </button>
          <button 
            onClick={() => setPhase('hub')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${phase === 'hub' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Play className="w-5 h-5" /> TERMINAL
          </button>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-8 py-12 h-[calc(100vh-100px)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'hub' && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1"
            >
              <AirportHub history={history} onSelectFlight={initiateBoarding} />
            </motion.div>
          )}

          {phase === 'boarding' && (
            <motion.div
              key="boarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1"
            >
              <BoardingPass 
                initialTask={selectedTask.task}
                initialDuration={selectedTask.duration}
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
              className="fixed inset-0 z-[100] bg-[#0a0a0b]"
            >
              <CruisePhase 
                session={activeFlight} 
                onComplete={() => setPhase('landing')}
                onCancel={cancelFlight}
              />
            </motion.div>
          )}

          {phase === 'landing' && activeFlight && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
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
