'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, ChevronRight, X, User, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { DESTINATIONS, FlightSession, Destination } from '@/lib/focus-flight';

interface BoardingPassProps {
  initialTask: string;
  initialDuration: number;
  onBoard: (session: FlightSession) => void;
  onCancel: () => void;
}

export default function BoardingPass({ initialTask, initialDuration, onBoard, onCancel }: BoardingPassProps) {
  const [task, setTask] = useState(initialTask);
  const [duration, setDuration] = useState(initialDuration);
  const [seatClass, setSeatClass] = useState('Economy');
  
  // Find suitable destination based on duration
  const destination = DESTINATIONS.find(d => duration >= d.minDuration) || DESTINATIONS[0];
  const gate = `G-${Math.floor(Math.random() * 20) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;

  const handleBoard = () => {
    const session: FlightSession = {
      id: Math.random().toString(36).substring(7),
      task,
      duration,
      startTime: Date.now(),
      status: 'active',
      interruptionCount: 0,
      lastActive: Date.now(),
      elapsedSeconds: 0,
      gate,
      seatClass,
      destination,
    };
    onBoard(session);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] gap-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black italic tracking-tighter">CHECK-IN</h2>
        <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">Review your boarding pass to proceed to the gate</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        className="w-full bg-[#f3f4f6] text-slate-900 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row"
      >
        {/* Main Section */}
        <div className="flex-1 p-10 space-y-10">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Air Carrier</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-emerald-600">PAJJI AIRWAYS</h3>
            </div>
            <div className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              Boarding Pass
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-10 gap-x-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passenger</p>
              <p className="font-bold text-lg">STUDENT / PILOT</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flight No.</p>
              <p className="font-bold text-lg">PA-2026</p>
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Objective (Task)</p>
              <input 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl px-0 py-1 font-bold text-xl text-emerald-600 focus:ring-0 placeholder:text-slate-300"
                placeholder="Enter your task..."
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origin</p>
              <p className="font-bold text-lg text-slate-400">HUB-STATION</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</p>
              <p className="font-bold text-xl text-emerald-600 uppercase">{destination.city} ({destination.code})</p>
            </div>
          </div>
        </div>

        {/* Stub Section */}
        <div className="w-full md:w-72 bg-slate-200 p-10 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-slate-300 flex flex-col justify-between relative">
          {/* Perforation Circles */}
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a0a0b] rounded-full hidden md:block" />
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-[#0a0a0b] rounded-full hidden md:block" />

          <div className="space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gate</p>
              <p className="font-black text-3xl text-slate-900">{gate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Boarding Time</p>
              <div className="flex items-center gap-4">
                <select 
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="bg-transparent border-none p-0 font-black text-2xl text-emerald-600 focus:ring-0"
                >
                  {[15, 25, 45, 60, 90].map(m => (
                    <option key={m} value={m}>{m}m</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class</p>
              <div className="flex gap-2 pt-1">
                {['Economy', 'Business'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSeatClass(c)}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all ${
                      seatClass === c ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8">
            <div className="w-full h-12 bg-white rounded-lg flex items-center justify-center p-2 opacity-50">
              <div className="w-full h-full bg-slate-900 flex gap-1 items-center justify-center px-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`h-full bg-white ${i % 3 === 0 ? 'w-[2px]' : 'w-[1px]'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-6">
        <button
          onClick={onCancel}
          className="px-8 py-4 text-slate-500 font-bold hover:text-white transition-all"
        >
          CANCEL CHECK-IN
        </button>
        <button
          onClick={handleBoard}
          className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black italic tracking-tighter flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/30 group"
        >
          BOARD FLIGHT <Plane size={20} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>

    </div>
  );
}
