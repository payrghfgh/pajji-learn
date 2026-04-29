'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, User, Award, ArrowRight, Map, Globe, Navigation } from 'lucide-react';
import { FlightHistory, ROUTES, Route } from '@/lib/focus-flight';
import DeparturesBoard from './DeparturesBoard';

interface AirportHubProps {
  history: FlightHistory;
  onSelectRoute: (route: Route) => void;
}

export default function AirportHub({ history, onSelectRoute }: AirportHubProps) {
  const passengerName = "LEARNER / 01";
  
  const boardItems = ROUTES.map((r, i) => ({
    flight: `PA-${100 + i}`,
    origin: r.from.name,
    destination: r.to.name,
    duration: `${r.duration}M`,
    gate: `A${10 + i}`,
    status: history.unlockedDestinations.includes(r.to.code) ? 'ARRIVED' : 'ON TIME',
    code: r.to.code
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-20">
      {/* Terminal HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[24px] bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-900/40 border border-emerald-400/20">
              <User className="text-white" size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-[0.4em]">Flight Credentials</p>
              <h2 className="text-3xl font-black tracking-tighter uppercase text-white">{passengerName}</h2>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Airtime</span>
              <span className="text-xl font-bold text-white">{history.totalDistance} <span className="text-slate-600 text-sm font-medium">Minutes</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Unlocked</span>
              <span className="text-xl font-bold text-white">{history.unlockedDestinations.length} <span className="text-slate-600 text-sm font-medium">Cities</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Current Streak</span>
              <span className="text-xl font-bold text-emerald-500">{history.streak} <span className="text-emerald-900 text-sm font-medium">Days</span></span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-[20px] backdrop-blur-xl">
          <button className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/30 transition-all">TERMINAL</button>
          <button className="px-8 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">LOGBOOK</button>
          <button className="px-8 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">GATES</button>
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Departures Monitor */}
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Active Route Network</h3>
              </div>
              <span className="text-[10px] text-slate-600 font-mono uppercase">Update: {new Date().toLocaleTimeString()}</span>
            </div>
            <DeparturesBoard items={boardItems} />
          </div>

          <div className="p-10 bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20 rounded-[32px] relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h4 className="text-2xl font-black tracking-tight text-white uppercase italic">Route Planning</h4>
                <p className="text-slate-400 text-sm max-w-lg leading-relaxed">Select a mission from the departures board or use quick-boarding to initiate a real-time journey between global hubs.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => onSelectRoute(ROUTES[0])}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black italic tracking-tighter text-lg flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20"
                >
                  START QUICK FLIGHT <ArrowRight size={20} />
                </button>
              </div>
            </div>
            <Map className="absolute right-[-40px] bottom-[-40px] w-80 h-80 text-emerald-500/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>
        </div>

        {/* Quick Access Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white/5 border border-white/10 p-10 rounded-[32px] space-y-10 backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-emerald-500">Quick Boarding</h3>
              <p className="text-slate-500 text-xs font-medium">Instant route deployment</p>
            </div>
            <div className="space-y-4">
              {ROUTES.slice(0, 3).map((route, i) => (
                <button
                  key={i}
                  onClick={() => onSelectRoute(route)}
                  className="w-full flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-600/5 transition-all group"
                >
                  <div className="text-left space-y-1">
                    <p className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors uppercase italic">{route.from.code} → {route.to.code}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{route.duration} MINS | {route.difficulty}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-600 transition-all">
                    <Navigation size={20} className="text-slate-600 group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-10 bg-emerald-600/5 border border-emerald-500/10 rounded-[32px] space-y-6 text-center">
            <div className="w-20 h-20 rounded-[24px] bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Award className="text-emerald-500" size={40} />
            </div>
            <div className="space-y-2">
              <p className="font-black text-white uppercase tracking-widest">Global Status</p>
              <p className="text-xs text-slate-500 leading-relaxed">Complete long-haul routes to unlock intercontinental achievements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
