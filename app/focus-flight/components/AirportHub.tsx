'use client';

import React from 'react';
import { ArrowRight, Map, Award, Navigation } from 'lucide-react';
import { FlightHistory, ROUTES, Route } from '@/lib/focus-flight';
import DeparturesBoard from './DeparturesBoard';

interface AirportHubProps {
  history: FlightHistory;
  onSelectRoute: (route: Route) => void;
}

/**
 * The departures board and route planning, as a column panel.
 *
 * This used to be a whole page: a max-w-6xl wrapper, a "Terminal HUD" with
 * credentials and three stats, a dead TERMINAL / LOGBOOK / GATES tab bar, and its
 * own 12-column grid. Nested inside the terminal's .95fr column that overflowed
 * the viewport and clipped the quick-select buttons at the right edge.
 *
 * The page chrome is gone. The nav above already carries the destinations, so the
 * second tab bar was two navs for the same thing. The credentials and stat strip
 * are not in the plan's terminal frame either.
 */
export default function AirportHub({ history, onSelectRoute }: AirportHubProps) {
  const boardItems = ROUTES.map((r, i) => ({
    flight: `PA-${100 + i}`,
    origin: r.from.name,
    destination: r.to.name,
    duration: `${r.duration}M`,
    gate: `A${10 + i}`,
    status: history.unlockedDestinations.includes(r.to.code) ? 'ARRIVED' : 'ON TIME',
    code: r.to.code,
  }));

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-2 h-2 rounded-full bg-[var(--jade)] animate-pulse" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text)]">
            Active Route Network
          </h3>
        </div>
        {/* No live clock here. Rendering new Date() during SSR emits one string on
            the server and another on the client, and the mismatch re-renders the
            whole subtree. It was decorative and carried nothing the board does not. */}
        <DeparturesBoard items={boardItems} />
      </div>

      <div className="relative overflow-hidden group p-6 bg-gradient-to-br from-[var(--jade-soft)] to-transparent border border-[var(--line-2)] rounded-[var(--r-m)]">
        <div className="relative z-10 space-y-4">
          <div className="space-y-1.5">
            <h4 className="text-lg font-black tracking-tight uppercase text-[var(--text)]">Route Planning</h4>
            <p className="text-[var(--dim)] text-[13px] leading-relaxed">
              Select a mission from the board, or take the quick flight.
            </p>
          </div>
          <button
            onClick={() => onSelectRoute(ROUTES[0])}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--jade)] text-[var(--ink-on-accent)] rounded-[var(--r-s)] font-black tracking-tight text-[13px] uppercase"
          >
            START QUICK FLIGHT <ArrowRight size={16} />
          </button>
        </div>
        <Map
          className="absolute -right-8 -bottom-8 w-40 h-40 text-[var(--jade-soft)] -rotate-12 group-hover:rotate-0 transition-transform duration-500"
          aria-hidden="true"
        />
      </div>

      <div className="bg-[var(--ink-2)] border border-[var(--line-2)] p-5 rounded-[var(--r-m)] space-y-4">
        <div className="space-y-0.5">
          <h3 className="font-black uppercase tracking-[0.25em] text-[11px] text-[var(--jade)]">Quick Boarding</h3>
          <p className="text-[var(--faint)] text-[11px] font-medium">Instant route deployment</p>
        </div>
        <div className="space-y-2">
          {ROUTES.slice(0, 3).map((route, i) => (
            <button
              key={i}
              onClick={() => onSelectRoute(route)}
              className="w-full flex justify-between items-center p-3.5 bg-[var(--ink-3)] border border-[var(--line)] rounded-[var(--r-s)] group/route"
            >
              <div className="text-left space-y-0.5 min-w-0">
                <p className="font-bold text-[var(--text)] text-[13px] uppercase truncate">{route.to.name}</p>
                <p className="text-[11px] text-[var(--faint)] font-black uppercase tracking-widest">
                  {route.duration} MINS
                </p>
              </div>
              <div className="w-9 h-9 shrink-0 rounded-[10px] bg-[var(--ink-4)] flex items-center justify-center">
                <Navigation size={16} className="text-[var(--dim)]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 bg-[var(--ink-2)] border border-[var(--line)] rounded-[var(--r-m)] space-y-3 text-center">
        <div className="w-12 h-12 rounded-[14px] bg-[var(--jade-soft)] flex items-center justify-center mx-auto border border-[var(--line-2)]">
          <Award className="text-[var(--jade)]" size={24} />
        </div>
        <div className="space-y-1">
          <p className="font-black text-[var(--text)] uppercase tracking-widest text-[12px]">Global Status</p>
          <p className="text-[11px] text-[var(--faint)] leading-relaxed">
            Complete long-haul routes to unlock intercontinental destinations.
          </p>
        </div>
      </div>
    </div>
  );
}
