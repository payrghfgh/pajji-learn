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
        <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Pre-Flight Check</h2>
        <p className="text-slate-500 uppercase tracking-[0.3em] text-xs font-bold">Validating Route: {route.from.name} to {route.to.name}</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        className="w-full bg-[#f8fafc] text-slate-900 rounded-[40px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex flex-col md:flex-row"
      >
        <div className="flex-1 p-12 space-y-12">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carrier</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-emerald-600 uppercase">Pajji Air</h3>
            </div>
            <div className="px-6 py-2 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">
              Active Mission
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-12 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passenger</p>
              <p className="font-bold text-xl uppercase tracking-tight">LEARNER / PILOT</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Route ID</p>
              <p className="font-bold text-xl uppercase">{route.id}</p>
            </div>
            <div className="col-span-2 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Parameters (Task)</p>
              <input 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                autoFocus
                className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 font-bold text-2xl text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300"
                placeholder="What are you achieving?"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origin</p>
              <p className="font-bold text-xl uppercase tracking-tighter text-slate-400">{route.from.name} ({route.from.code})</p>
            </div>
            <div className="space-y-1 text-right md:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</p>
              <p className="font-bold text-2xl text-emerald-600 uppercase tracking-tighter">{route.to.name} ({route.to.code})</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 bg-slate-100 p-12 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-slate-300 flex flex-col justify-between relative">
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#0a0a0b] rounded-full hidden md:block" />
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-[#0a0a0b] rounded-full hidden md:block" />

          <div className="space-y-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gate</p>
              <p className="font-black text-4xl text-slate-900 tracking-tighter">{gate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flight Time</p>
              <p className="font-black text-3xl text-emerald-600 tracking-tighter uppercase">{route.duration} MINS</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cabin Class</p>
              <div className="flex gap-2">
                {['Economy', 'Business'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSeatClass(c)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                      seatClass === c ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-10 flex flex-col items-center">
            <div className="w-full h-16 bg-white rounded-xl flex items-center justify-center p-3 opacity-60">
              <div className="w-full h-full bg-slate-900 flex gap-1.5 items-center justify-center px-4">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className={`h-full bg-white ${i % 4 === 0 ? 'w-[3px]' : 'w-[1px]'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-8 items-center">
        <button
          onClick={onCancel}
          className="text-slate-500 font-bold hover:text-white transition-all uppercase tracking-widest text-[10px]"
        >
          Cancel Boarding
        </button>
        <button
          onClick={handleBoard}
          className="px-16 py-6 bg-emerald-600 text-white rounded-[24px] font-black italic tracking-tighter text-xl flex items-center gap-4 hover:bg-emerald-500 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)] group"
        >
          START JOURNEY <Plane size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
