'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plane, Volume2, VolumeX, X, AlertTriangle, Cloud, Wind, Zap, MapPin, Navigation } from 'lucide-react';
import { FlightSession, setActiveFlight } from '@/lib/focus-flight';

interface CruiseProps {
  session: FlightSession;
  onComplete: () => void;
  onCancel: () => void;
}

export default function CruisePhase({ session, onComplete, onCancel }: CruiseProps) {
  const [timeLeft, setTimeLeft] = useState((session.duration * 60) - (session.elapsedSeconds || 0));
  const [isMuted, setIsMuted] = useState(true);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

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
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, onComplete]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      const currentElapsed = (session.duration * 60) - timeLeftRef.current;
      setActiveFlight({
        ...session,
        elapsedSeconds: currentElapsed,
        lastActive: Date.now()
      });
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [session]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isPaused) {
        setIsInterrupted(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPaused]);

  useEffect(() => {
    if (audioRef.current) {
      if (!isMuted && !isPaused) {
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, isPaused]);

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
    } else if (pauseCount > 0) {
      setIsPaused(true);
      setPauseCount(prev => prev - 1);
    }
  };

  const progress = 1 - (timeLeft / (session.duration * 60));
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-[#0a0a0b]">
      {/* Flight Path / World Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 300C250 200 400 400 500 300C600 200 750 400 900 300" stroke="white" strokeWidth="2" strokeDasharray="10 10" strokeOpacity="0.2" />
          <motion.circle
            cx="100" cy="300" r="4" fill="#10b981"
            animate={{ cx: 100 + (progress * 800) }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
      </div>

      {/* Floating Clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/10"
            initial={{ x: '120%', y: `${10 + i * 12}%` }}
            animate={{ x: '-20%' }}
            transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear", delay: i * 2 }}
          >
            <Cloud size={60 + i * 20} />
          </motion.div>
        ))}
      </div>

      {/* Top Route Info */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md z-20">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Origin</span>
          <span className="font-bold text-sm uppercase">HUB</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <div className="w-20 h-[1px] bg-white/10 relative">
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 left-0 h-[1px] bg-emerald-500 shadow-[0_0_8px_#10b981]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <Plane size={14} className="text-emerald-500 rotate-90" />
          </div>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Destination</span>
          <span className="font-bold text-sm uppercase">{session.destination.city} ({session.destination.code})</span>
        </div>
      </div>

      {/* Main Experience */}
      <div className="relative z-10 flex flex-col items-center gap-16">
        <div className="text-center space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em]">{session.task}</p>
            <h2 className="text-[12rem] font-black tracking-tighter tabular-nums leading-none flex items-center justify-center">
              {minutes.toString().padStart(2, '0')}
              <span className="text-emerald-500 mx-[-0.05em] animate-pulse">:</span>
              {seconds.toString().padStart(2, '0')}
            </h2>
          </div>

          <div className="flex items-center justify-center gap-8 text-slate-500">
            <div className="flex items-center gap-2">
              <Navigation size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Altitude: {Math.round(35000 + (progress * 5000))} FT</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Speed: 850 KM/H</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>

        <button
          onClick={togglePause}
          className={`px-8 h-16 rounded-2xl border flex items-center gap-4 font-black italic tracking-tighter transition-all ${
            isPaused 
              ? 'bg-amber-500 text-white border-amber-400 shadow-xl shadow-amber-500/20' 
              : pauseCount > 0 
                ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' 
                : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed opacity-50'
          }`}
        >
          <Zap size={24} className={isPaused ? 'animate-pulse' : ''} />
          {isPaused ? 'RESUME MISSION' : `HOLD PATTERN (${pauseCount} LEFT)`}
        </button>

        <button
          onClick={onCancel}
          className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Interruption Overlay */}
      {isInterrupted && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 bg-[#0a0a0b]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mb-8 border border-amber-500/30">
            <AlertTriangle size={48} className="text-amber-500" />
          </div>
          <h3 className="text-4xl font-black italic tracking-tighter mb-4 uppercase">Flight Interrupted</h3>
          <p className="text-slate-400 max-w-md mb-10 text-lg">
            A deviation from the flight path was detected. Return to the cockpit immediately to avoid mission failure.
          </p>
          <button
            onClick={() => setIsInterrupted(false)}
            className="px-12 py-5 bg-emerald-600 rounded-2xl font-black italic tracking-tighter text-white hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20"
          >
            RESUME FLIGHT
          </button>
        </motion.div>
      )}

    </div>
  );
}
