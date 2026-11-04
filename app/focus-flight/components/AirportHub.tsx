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
            <div className="w-16 h-16 rounded-[24px] bg-[var(--jade)] flex items-center justify-center shadow-[0_12px_34px_rgba(0,0,0,0.5)] border border-[var(--jade-soft)]">
              <User className="text-[var(--ink-on-accent)]" size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-[var(--jade)] font-black uppercase tracking-[0.4em]">Flight Credentials</p>
              <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text)]">{passengerName}</h2>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[11px] text-[var(--faint)] font-black uppercase tracking-widest">Total Airtime</span>
              <span className="text-xl font-bold text-[var(--text)]">{history.totalDistance} <span className="text-[var(--dim)] text-sm font-medium">Minutes</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[var(--faint)] font-black uppercase tracking-widest">Unlocked</span>
              <span className="text-xl font-bold text-[var(--text)]">{history.unlockedDestinations.length} <span className="text-[var(--dim)] text-sm font-medium">Cities</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[var(--faint)] font-black uppercase tracking-widest">Current Streak</span>
              <span className="text-xl font-bold text-[var(--jade)]">{history.streak} <span className="text-[var(--dim)] text-sm font-medium">Days</span></span>
            </div>
          </div>
        </div>

        {/* Not a working tab bar: none of the three has a handler. TERMINAL is a
            label for the screen you are on, so it keeps its accent; LOGBOOK and
            GATES are destinations that do not exist, so they are dimmed to read
            as unavailable. All three aria-disabled. Not wired, not removed --
            removing the bar is structural and belongs to a rebuild. */}
        <div className="flex gap-4 p-2 bg-[var(--ink-2)] border border-[var(--line-2)] rounded-[20px] backdrop-blur-xl">
          <button aria-disabled="true" title="Not built yet — this is the screen you are already on" className="px-8 py-3 rounded-xl bg-[var(--jade)] text-[var(--ink-on-accent)] font-black text-xs uppercase tracking-widest shadow-[0_2px_8px_rgba(0,0,0,0.3)]">TERMINAL</button>
          <button aria-disabled="true" title="Not built yet — the Logbook destination does not exist" className="px-8 py-3 rounded-xl text-[var(--faint)] opacity-60 font-black text-xs uppercase tracking-widest cursor-not-allowed">LOGBOOK</button>
          <button aria-disabled="true" title="Not built yet — the Gates destination does not exist" className="px-8 py-3 rounded-xl text-[var(--faint)] opacity-60 font-black text-xs uppercase tracking-widest cursor-not-allowed">GATES</button>
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Departures Monitor */}
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--jade)] animate-pulse" />
                <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-[0.2em]">Active Route Network</h3>
              </div>
              <span className="text-[11px] text-[var(--faint)] font-mono uppercase">Update: {new Date().toLocaleTimeString()}</span>
            </div>
            <DeparturesBoard items={boardItems} />
          </div>

          <div className="p-10 bg-gradient-to-br from-[var(--jade-soft)] to-transparent border border-[var(--line-2)] rounded-[32px] relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h4 className="text-2xl font-black tracking-tight text-[var(--text)] uppercase">Route Planning</h4>
                <p className="text-[var(--dim)] text-sm max-w-lg leading-relaxed">Select a mission from the departures board or use quick-boarding to initiate a real-time journey between global hubs.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => onSelectRoute(ROUTES[0])}
                  className="px-8 py-4 bg-[var(--jade)] text-[var(--ink-on-accent)] rounded-2xl font-black tracking-tighter text-lg flex items-center gap-3 hover:bg-[var(--jade-light)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                >
                  START QUICK FLIGHT <ArrowRight size={20} />
                </button>
              </div>
            </div>
            <Map className="absolute right-[-40px] bottom-[-40px] w-80 h-80 text-[var(--jade-soft)] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>
        </div>

        {/* Quick Access Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[var(--ink-2)] border border-[var(--line-2)] p-10 rounded-[32px] space-y-10 backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="font-black uppercase tracking-[0.3em] text-[11px] text-[var(--jade)]">Quick Boarding</h3>
              <p className="text-[var(--faint)] text-xs font-medium">Instant route deployment</p>
            </div>
            <div className="space-y-4">
              {ROUTES.slice(0, 3).map((route, i) => (
                <button
                  key={i}
                  onClick={() => onSelectRoute(route)}
                  className="w-full flex justify-between items-center p-6 bg-[var(--ink-3)] border border-[var(--line)] rounded-2xl hover:border-[var(--jade)] hover:bg-[var(--ink-4)] transition-colors group"
                >
                  <div className="text-left space-y-1">
                    <p className="font-bold text-[var(--text)] text-lg group-hover:text-[var(--jade)] transition-colors uppercase">{route.from.code} → {route.to.code}</p>
                    <p className="text-[11px] text-[var(--faint)] font-black uppercase tracking-widest">{route.duration} MINS | {route.difficulty}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--ink-4)] flex items-center justify-center group-hover:bg-[var(--jade)] transition-colors">
                    <Navigation size={20} className="text-[var(--dim)] group-hover:text-[var(--ink-on-accent)]" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-10 bg-[var(--ink-2)] border border-[var(--line)] rounded-[32px] space-y-6 text-center">
            <div className="w-20 h-20 rounded-[24px] bg-[var(--jade-soft)] flex items-center justify-center mx-auto border border-[var(--line-2)]">
              <Award className="text-[var(--jade)]" size={40} />
            </div>
            <div className="space-y-2">
              <p className="font-black text-[var(--text)] uppercase tracking-widest">Global Status</p>
              <p className="text-xs text-[var(--faint)] leading-relaxed">Complete long-haul routes to unlock intercontinental achievements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
