'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Volume2, VolumeX, X, AlertTriangle, Cloud, Wind, Zap, Navigation, Globe } from 'lucide-react';
import { FlightSession, setActiveFlight, elapsedFocusMs } from '@/lib/focus-flight';

interface CruiseProps {
  session: FlightSession;
  progress: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function CruisePhase({ session, progress, isPaused, onTogglePause, onComplete, onCancel }: CruiseProps) {
  const { route } = session;
  
  const [isMuted, setIsMuted] = useState(true);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // ROUTE INTERPOLATION (LAT/LNG) - Now just for HUD display
  const currentPos = useMemo(() => {
    const lat = route.from.coords.lat + (route.to.coords.lat - route.from.coords.lat) * progress;
    const lng = route.from.coords.lng + (route.to.coords.lng - route.from.coords.lng) * progress;
    return { lat, lng };
  }, [progress, route]);

  // Audio Logic
  useEffect(() => {
    audioRef.current = new Audio('https://www.soundjay.com/transportation/airplane-cabin-white-noise-01.mp3');
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (!isMuted && !isPaused) {
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, isPaused]);

  // Persistence update
  useEffect(() => {
    setActiveFlight({
      ...session,
      lastActive: Date.now()
    });
  }, [session]);

  // Tab detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isPaused) {
        setIsInterrupted(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPaused]);

  // HUD values
  // Focus time, not wall time: paused spans are subtracted so the countdown
  // holds while paused and resumes where it stopped.
  const timeLeftMs = Math.max((route.duration * 60 * 1000) - elapsedFocusMs(session), 0);
  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);

  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-transparent overflow-hidden">
      {/* CLOUD ATMOSPHERE (Optional Overlay) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-40">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[color-mix(in_oklab,var(--text)_10%,transparent)]"
            initial={{ x: '110%', y: `${15 + i * 15}%` }}
            animate={{ x: '-20%' }}
            transition={{ duration: 40 + i * 20, repeat: Infinity, ease: "linear", delay: i * 4 }}
          >
            <Cloud size={120 + i * 40} />
          </motion.div>
        ))}
      </div>

      {/* ROUTE HUD (TOP) */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-12 px-12 py-5 bg-[color-mix(in_oklab,var(--ink-1)_60%,transparent)] border border-[var(--line-2)] rounded-3xl backdrop-blur-2xl z-40">
        <div className="text-right space-y-0.5">
          <p className="text-[11px] font-black text-[var(--faint)] uppercase tracking-widest">Origin Hub</p>
          <p className="font-black text-xl text-[var(--text)] uppercase italic">{route.from.name} <span className="text-[var(--jade)] text-xs ml-1">{route.from.code}</span></p>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-1.5 bg-[var(--jade-soft)] border border-[var(--line-2)] rounded-full flex items-center gap-2">
            <Globe size={10} className="text-[var(--jade)] animate-spin-slow" />
            <p className="text-[11px] font-black text-[var(--jade)] uppercase tracking-[0.3em]">En Route</p>
          </div>
          <div className="w-32 h-1 bg-[var(--ink-4)] rounded-full overflow-hidden">
            <motion.div className="h-full bg-[var(--jade)]" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <div className="text-left space-y-0.5">
          <p className="text-[11px] font-black text-[var(--faint)] uppercase tracking-widest">Destination</p>
          <p className="font-black text-xl text-[var(--text)] uppercase italic">{route.to.name} <span className="text-[var(--jade)] text-xs ml-1">{route.to.code}</span></p>
        </div>
      </div>

      {/* MISSION CONTROL CORE */}
      <div className="relative z-10 flex flex-col items-center gap-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-6 py-2 bg-[var(--jade-soft)] border border-[var(--line-2)] rounded-xl"
            >
              <p className="text-[var(--jade)] font-black uppercase tracking-[0.5em] text-xs">{session.task}</p>
            </motion.div>
            <h2 className="text-[15rem] font-black tracking-tighter tabular-nums leading-none select-none text-[var(--text)] drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              {minutes.toString().padStart(2, '0')}
              <span className="text-[var(--jade-soft)] mx-[-0.05em] animate-pulse">:</span>
              {seconds.toString().padStart(2, '0')}
            </h2>
          </div>

          {/* TELEMETRY STATS */}
          <div className="flex items-center justify-center gap-16 text-[var(--dim)]">
            <div className="flex flex-col items-center gap-2">
              <Navigation size={20} className="text-[var(--jade-soft)]" />
              <div className="text-center">
                <span className="block text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Altitude</span>
                <span className="font-bold text-xs uppercase">{Math.round(34000 + progress * 4000)} FT</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Wind size={20} className="text-[var(--jade-soft)]" />
              <div className="text-center">
                <span className="block text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Airspeed</span>
                <span className="font-bold text-xs uppercase">875 KM/H</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Globe size={20} className="text-[var(--jade-soft)]" />
              <div className="text-center">
                <span className="block text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Coordinates</span>
                <span className="font-bold text-xs uppercase tracking-tighter">{currentPos.lat.toFixed(3)}°N, {currentPos.lng.toFixed(3)}°E</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-16 left-0 right-0 px-16 flex justify-between items-center z-50">
        <div className="flex gap-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-16 h-16 rounded-[24px] bg-[var(--ink-2)] border border-[var(--line-2)] flex items-center justify-center text-[var(--dim)] hover:bg-[var(--jade)] hover:text-[var(--ink-on-accent)] shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <button
            onClick={onTogglePause}
            className={`px-10 h-16 rounded-[24px] border flex items-center gap-4 font-black italic tracking-tighter backdrop-blur-xl ${
              isPaused 
                ? 'bg-[var(--amber)] text-[var(--ink-on-accent)] border-[var(--amber)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]' 
                : 'bg-[var(--ink-2)] text-[var(--dim)] border-[var(--line-2)] hover:bg-[var(--ink-3)] hover:text-[var(--text)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
            }`}
          >
            <Zap size={20} className={isPaused ? 'animate-pulse' : ''} />
            {isPaused ? 'RESUME MISSION' : 'HOLD PATTERN'}
          </button>
        </div>

        <button
          onClick={onCancel}
          className="flex items-center gap-4 px-10 h-16 rounded-[24px] bg-[var(--coral-soft)] border border-[var(--coral-soft)] text-[var(--coral)] font-black italic tracking-tighter hover:bg-[var(--coral)] hover:text-[var(--ink-on-accent)] group shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-xl"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" /> ABORT MISSION
        </button>
      </div>

      {/* DEVIATION OVERLAY */}
      <AnimatePresence>
        {isInterrupted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-[color-mix(in_oklab,var(--ink-0)_98%,transparent)] backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-32 h-32 bg-[color-mix(in_oklab,var(--amber)_10%,transparent)] rounded-full flex items-center justify-center mb-10 border border-[color-mix(in_oklab,var(--amber)_20%,transparent)] animate-pulse">
              <AlertTriangle size={64} className="text-[var(--amber)]" />
            </div>
            <h3 className="text-6xl font-black italic tracking-tighter mb-6 text-[var(--text)] uppercase">Critical Deviation</h3>
            <p className="text-[var(--dim)] max-w-xl mb-14 text-xl leading-relaxed">
              Flight PA2026 has deviated from its assigned route. Immediate re-entry required to complete the journey to {route.to.name}.
            </p>
            <button
              onClick={() => setIsInterrupted(false)}
              className="px-20 py-8 bg-[var(--jade)] rounded-[32px] font-black italic tracking-tighter text-2xl text-[var(--ink-on-accent)] hover:bg-[var(--jade-light)] shadow-[0_2px_8px_rgba(0,0,0,0.3)] uppercase"
            >
              Re-Engage Cockpit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
