'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, ChevronRight, X, User, MapPin, Clock } from 'lucide-react';
import { FlightSession, Route } from '@/lib/focus-flight';

interface BoardingPassProps {
  route: Route;
  onBoard: (session: FlightSession) => void;
  onCancel: () => void;
}

export default function BoardingPass({ route, onBoard, onCancel }: BoardingPassProps) {
  const [task, setTask] = useState('');
  const [seatClass, setSeatClass] = useState('Business');
  
  const gate = `G-${Math.floor(Math.random() * 20) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;

  const handleBoard = () => {
    if (!task.trim()) return;

    const session: FlightSession = {
      id: Math.random().toString(36).substring(7),
      task,
      startTime: Date.now(),
      route,
      status: 'active',
      interruptionCount: 0,
      lastActive: Date.now(),
      gate,
      seatClass,
    };
    onBoard(session);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] gap-16 py-12">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-black tracking-tighter text-[var(--text)] uppercase">Pre-Flight Check</h2>
        <p className="text-[var(--faint)] uppercase tracking-[0.3em] text-xs font-bold">Validating Route: {route.from.name} to {route.to.name}</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        className="w-full bg-[var(--ink-2)] text-[var(--text)] rounded-[40px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex flex-col md:flex-row"
      >
        <div className="flex-1 p-12 space-y-12">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Carrier</p>
              <h3 className="text-2xl font-black tracking-tighter text-[var(--jade)] uppercase">Pajji Air</h3>
            </div>
            <div className="px-6 py-2 bg-[var(--jade)] text-[var(--ink-on-accent)] rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              Active Mission
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-12 gap-x-12">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Passenger</p>
              <p className="font-bold text-xl uppercase tracking-tight">LEARNER / PILOT</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Route ID</p>
              <p className="font-bold text-xl uppercase">{route.id}</p>
            </div>
            <div className="col-span-2 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Mission Parameters (Task)</p>
              <input 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                autoFocus
                className="w-full bg-[var(--input-bg)] border-none rounded-2xl px-6 py-4 font-bold text-2xl text-[var(--jade)] focus:ring-2 focus:ring-[var(--jade-soft)] placeholder:text-[var(--faint)]"
                placeholder="What are you achieving?"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Origin</p>
              <p className="font-bold text-xl uppercase tracking-tighter text-[var(--dim)]">{route.from.name} ({route.from.code})</p>
            </div>
            <div className="space-y-1 text-right md:text-left">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Destination</p>
              <p className="font-bold text-2xl text-[var(--jade)] uppercase tracking-tighter">{route.to.name} ({route.to.code})</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 bg-[var(--ink-3)] p-12 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[var(--line-2)] flex flex-col justify-between relative">
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--ink-0)] rounded-full hidden md:block" />
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-[var(--ink-0)] rounded-full hidden md:block" />

          <div className="space-y-10">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Gate</p>
              <p className="font-black text-4xl text-[var(--text)] tracking-tighter">{gate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Flight Time</p>
              <p className="font-black text-3xl text-[var(--jade)] tracking-tighter uppercase">{route.duration} MINS</p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--faint)]">Cabin Class</p>
              <div className="flex gap-2">
                {['Economy', 'Business'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSeatClass(c)}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase transition-colors ${
                      seatClass === c ? 'bg-[var(--jade)] text-[var(--ink-on-accent)]' : 'bg-[var(--ink-4)] text-[var(--dim)]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-10 flex flex-col items-center">
            <div className="w-full h-16 bg-[var(--ink-4)] rounded-xl flex items-center justify-center p-3 opacity-60">
              <div className="w-full h-full bg-[var(--ink-0)] flex gap-1.5 items-center justify-center px-4">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className={`h-full bg-[var(--text)] ${i % 4 === 0 ? 'w-[3px]' : 'w-[1px]'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-8 items-center">
        <button
          onClick={onCancel}
          className="text-[var(--faint)] font-bold hover:text-[var(--text)] uppercase tracking-widest text-[11px]"
        >
          Cancel Boarding
        </button>
        <button
          onClick={handleBoard}
          disabled={!task.trim()}
          className="px-16 py-6 bg-[var(--jade)] text-[var(--ink-on-accent)] rounded-[24px] font-black tracking-tighter text-xl flex items-center gap-4 hover:bg-[var(--jade-light)] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(0,0,0,0.3)] group"
        >
          START JOURNEY <Plane size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
