'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Map as MapIcon, History, Plane, AlertCircle, Award } from 'lucide-react';
import { FlightHistory } from '@/lib/focus-flight';

interface StatsProps {
  history: FlightHistory;
  onNewFlight: () => void;
}

export default function StatsPhase({ history, onNewFlight }: StatsProps) {
  const completedSessions = history.sessions.filter(s => s.status === 'completed');
  const interruptedSessions = history.sessions.filter(s => s.status === 'interrupted');
  
  const avgFocus = completedSessions.length > 0 
    ? (completedSessions.reduce((acc, s) => acc + (s.focusRating || 0), 0) / completedSessions.length).toFixed(1)
    : 0;

  // Weak subject detection
  const subjectStats = history.sessions.reduce((acc, s) => {
    const sub = s.task || 'General';
    if (!acc[sub]) acc[sub] = { total: 0, completed: 0, ratings: [] as number[] };
    acc[sub].total += 1;
    if (s.status === 'completed') {
      acc[sub].completed += 1;
      if (s.focusRating) acc[sub].ratings.push(s.focusRating);
    }
    return acc;
  }, {} as Record<string, { total: number, completed: number, ratings: number[] }>);

  const weakSubjects = Object.entries(subjectStats)
    .map(([name, stats]) => ({
      name,
      completionRate: (stats.completed / stats.total) * 100,
      avgRating: stats.ratings.length > 0 ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length : 0
    }))
    .filter(s => s.completionRate < 70 || (s.avgRating > 0 && s.avgRating < 3))
    .sort((a, b) => a.completionRate - b.completionRate);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter">PILOT ANALYTICS</h2>
          <p className="text-[var(--dim)]">Review your flight history and performance trends.</p>
        </div>
        <button
          onClick={onNewFlight}
          className="px-8 py-4 bg-[var(--jade)] rounded-2xl font-bold flex items-center gap-2 text-[var(--ink-on-accent)] hover:bg-[var(--jade-light)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        >
          NEW FLIGHT <Plane size={20} />
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Airtime', value: `${history.totalDistance}m`, icon: <Calendar className="text-[var(--jade)]" /> },
          { label: 'Avg Focus', value: `${avgFocus}/5`, icon: <TrendingUp className="text-[var(--jade)]" /> },
          { label: 'Current Streak', value: `${history.streak} ${history.streak === 1 ? 'Day' : 'Days'}`, icon: <TrendingUp className="text-[var(--amber)]" /> },
          { label: 'Total Missions', value: history.sessions.length, icon: <BarChart3 className="text-[var(--azure)]" /> },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[var(--ink-2)] border border-[var(--line-2)] p-6 rounded-3xl backdrop-blur-sm space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--ink-3)] flex items-center justify-center mb-2">
              {stat.icon}
            </div>
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="text-[11px] text-[var(--faint)] uppercase font-bold tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Flights Table */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[var(--jade)]" />
              <h3 className="font-bold uppercase tracking-widest text-sm">Mission History</h3>
            </div>
            
            <div className="space-y-4">
              {history.sessions.slice().reverse().map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-6 p-5 bg-[var(--ink-2)] border border-[var(--line-2)] rounded-2xl"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    s.status === 'completed' ? 'bg-[var(--jade-soft)] text-[var(--jade)]' : 'bg-[var(--coral-soft)] text-[var(--coral)]'
                  }`}>
                    {s.focusRating || '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <p className="font-bold text-[var(--text)] uppercase tracking-tighter">{s.route.from.code} → {s.route.to.code}</p>
                      <div className="flex gap-2 text-[11px] text-[var(--faint)] font-black uppercase tracking-widest">
                        <span className="uppercase">{s.task || 'General'}</span>
                        <span>•</span>
                        <span>{s.route.duration} MINS</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--faint)] font-medium mt-1">
                      <span>{new Date(s.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${
                    s.status === 'completed' ? 'bg-[var(--jade)] text-[var(--ink-on-accent)]' : 'bg-[var(--coral)] text-[var(--ink-on-accent)]'
                  }`}>
                    {s.status}
                  </div>
                </motion.div>
              ))}
              {history.sessions.length === 0 && (
                <div className="text-center py-20 bg-[var(--ink-2)] border border-dashed border-[var(--line-2)] rounded-3xl">
                  <Plane className="w-12 h-12 text-[var(--ink-4)] mx-auto mb-4" />
                  <p className="text-[var(--faint)] font-medium">No flight logs found. Time to take your first mission!</p>
                </div>
              )}
            </div>
          </section>

          {/* Weak Subjects Detection */}
          {weakSubjects.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--amber)]" />
                <h3 className="font-bold uppercase tracking-widest text-sm text-[var(--amber)]">Turbulence Zones (Weak Subjects)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weakSubjects.map((s, i) => (
                  <div key={i} className="p-6 bg-[var(--ink-2)] border border-[var(--line-2)] rounded-3xl space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-[var(--amber)] uppercase tracking-wide">{s.name}</h4>
                      <div className="w-8 h-8 rounded-lg bg-[var(--ink-3)] flex items-center justify-center">
                        <AlertCircle size={16} className="text-[var(--amber)]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-[var(--faint)] font-black uppercase tracking-tighter">Completion Rate</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[var(--ink-4)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--amber)]" style={{ width: `${s.completionRate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[var(--amber)]">{Math.round(s.completionRate)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Focus Map / Distribution */}
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <MapIcon className="w-5 h-5 text-[var(--jade)]" />
              <h3 className="font-bold uppercase tracking-widest text-sm">Focus Distribution</h3>
            </div>
            
            <div className="bg-[var(--ink-2)] border border-[var(--line-2)] p-8 rounded-3xl backdrop-blur-sm space-y-8">
              <div className="space-y-6">
                {Object.entries(subjectStats).map(([subject, stats]) => {
                  const subTime = stats.completed * 25; // Estimate if not stored, but we should use real time
                  // Actually let's just use the count of completed sessions for the bar
                  const maxCount = Math.max(...Object.values(subjectStats).map(s => s.completed), 1);
                  const percent = (stats.completed / maxCount) * 100;

                  return (
                    <div key={subject} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-[var(--dim)]">{subject}</span>
                        <span>{stats.completed} Flights</span>
                      </div>
                      <div className="h-2 bg-[var(--ink-4)] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-[var(--jade)] rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-[var(--line)]">
                <p className="text-xs text-[var(--faint)]">
                  "The distance you travel depends on the consistency of your engine."
                </p>
              </div>
            </div>
          </section>

          <section className="p-8 bg-gradient-to-br from-[var(--jade-soft)] to-transparent border border-[var(--line-2)] rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--ink-3)] flex items-center justify-center">
              <Award className="text-[var(--jade)]" size={24} />
            </div>
            <h3 className="text-xl font-bold">Pilot Status</h3>
            <p className="text-sm text-[var(--dim)] leading-relaxed">
              {history.totalDistance > 1000 ? "Elite Commander: You've mastered the art of deep focus." : 
               history.totalDistance > 500 ? "Senior Captain: Your consistency is inspiring." :
               history.totalDistance > 100 ? "Flight Lieutenant: You're building solid momentum." :
               "Cadet: Welcome to the squadron. Start your first mission to level up."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
