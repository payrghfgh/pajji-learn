'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, LogOut, Settings, Clock, User, Award, ArrowRight } from 'lucide-react';
import { FlightHistory, DESTINATIONS } from '@/lib/focus-flight';
import DeparturesBoard from './DeparturesBoard';

interface AirportHubProps {
  history: FlightHistory;
  onSelectFlight: (task: string, duration: number) => void;
}

export default function AirportHub({ history, onSelectFlight }: AirportHubProps) {
  const passengerName = "STUDENT-PILOT"; // Could be dynamic
  
  // Create mock flight data for the board
  const boardItems = DESTINATIONS.slice(0, 6).map((d, i) => ({
    destination: d.city,
    duration: `${d.minDuration}M`,
    gate: `A${10 + i}`,
    status: history.unlockedDestinations.includes(d.code) ? 'Completed' : 'On Time',
    code: d.code
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Terminal Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <User className="text-white" size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Passenger Name</p>
              <h2 className="text-2xl font-black tracking-tighter uppercase">{passengerName}</h2>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-emerald-500" />
              <span className="text-sm font-bold">{history.totalDistance} <span className="text-slate-500 font-medium">Flight Hours</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={16} className="text-emerald-500" />
              <span className="text-sm font-bold">{history.streak} <span className="text-slate-500 font-medium">Day Streak</span></span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="p-1.5 bg-white/5 border border-white/10 rounded-2xl flex">
            <button className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all">TERMINAL</button>
            <button className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:text-white transition-all">LOGBOOK</button>
            <button className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:text-white transition-all">GATES</button>
          </div>
        </div>
      </div>

      {/* Main Experience Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Departures Board */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Active Departures</h3>
            <DeparturesBoard items={boardItems} />
          </div>

          <div className="p-8 bg-emerald-600/10 border border-emerald-500/20 rounded-3xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <h4 className="text-xl font-bold">Need a Custom Mission?</h4>
              <p className="text-slate-400 text-sm max-w-md">Configure a specific task and duration to reach custom coordinates across the globe.</p>
              <button 
                onClick={() => onSelectFlight("General Study", 25)}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all"
              >
                REQUEST CUSTOM FLIGHT <ArrowRight size={16} />
              </button>
            </div>
            <Plane className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-emerald-500/10 -rotate-45 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700" />
          </div>
        </div>

        {/* Start Mission Side Panel */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-8">
            <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500">Quick Boarding</h3>
            <div className="space-y-4">
              {[
                { label: 'Pomodoro Hop', time: 25, dest: 'Paris' },
                { label: 'Power Mission', time: 45, dest: 'New York' },
                { label: 'Deep Dive', time: 90, dest: 'Tokyo' },
              ].map((flight, i) => (
                <button
                  key={i}
                  onClick={() => onSelectFlight(flight.label, flight.time)}
                  className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-500/50 hover:bg-white/[0.08] transition-all group"
                >
                  <div className="text-left">
                    <p className="font-bold text-lg">{flight.label}</p>
                    <p className="text-xs text-slate-500 font-medium">{flight.time} MINS → {flight.dest}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-600 transition-all">
                    <Plane size={18} className="group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>


          <div className="p-8 bg-gradient-to-br from-[#121214] to-[#0a0a0b] border border-white/10 rounded-3xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Award className="text-emerald-500" size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg">Next Destination</p>
              <p className="text-xs text-slate-500">Reach 500 total hours to unlock "Interplanetary Flights"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
