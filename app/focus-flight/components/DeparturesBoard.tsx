'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeparturesBoardProps {
  items: Array<{
    destination: string;
    duration: string;
    gate: string;
    status: string;
    code: string;
  }>;
}

export default function DeparturesBoard({ items }: DeparturesBoardProps) {
  return (
    <div className="bg-[var(--ink-2)] border-4 border-[var(--line-2)] rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-[var(--ink-0)] px-6 py-3 border-b border-[var(--line)] flex justify-between items-center">
        {/* LED amber. --amber is the nearest token and reads correctly, but it is
            warmer and less acid than the original #facc15. Three uses, one
            purpose: if the board's acid character matters, that is --led-amber
            as a token, not a whitelist entry. Logged, not added mid-pass. */}
        <h3 className="text-[var(--amber)] font-black tracking-widest text-xs uppercase">Departures Board</h3>
        <div className="flex gap-4">
          <span className="text-[11px] text-[var(--faint)] font-bold uppercase tracking-tighter">Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      
      <div className="p-4 space-y-1">
        <div className="grid gap-3 px-4 py-2 text-[11px] font-black text-[var(--faint)] uppercase tracking-widest" style={{ gridTemplateColumns: "64px 1fr 56px 56px 84px" }}>
          <div>Flight</div>
          <div>Destination</div>
          <div>Time</div>
          <div>Gate</div>
          <div className="text-right">Status</div>
        </div>
        
        {items.map((item, i) => (
          <BoardRow key={i} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}

// TODO(product): rows are not clickable. They previously carried cursor-pointer
// and a hover highlight, which promised selection that did not exist. Wiring
// them is a decision, not a fix: should a row select the route, start boarding,
// or open details? onSelectRoute already exists, which makes wiring tempting and
// is exactly why it should be decided deliberately rather than by convenience.
function BoardRow({ item, index }: { item: any; index: number }) {
  const status = String(item.status ?? '').toLowerCase();
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="grid gap-3 px-4 py-3 bg-[var(--ink-3)] rounded-md border border-[var(--line)]"
      style={{ gridTemplateColumns: "64px 1fr 56px 56px 84px" }}
    >
      <div className="text-[var(--amber)] font-mono font-bold tracking-tighter">PA{100 + index}</div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[var(--text)] font-bold tracking-tight uppercase truncate min-w-0">{item.destination}</span>
        <span className="text-[var(--faint)] font-mono text-[11px] shrink-0">{item.code}</span>
      </div>
      <div className="text-[var(--dim)] font-mono font-bold">{item.duration}</div>
      <div className="text-[var(--dim)] font-mono font-bold">{item.gate}</div>
      <div className="text-right">
        {/* Compared case-insensitively so it works whichever casing the
            producer uses -- the previous exact match never fired against
            AirportHub's 'ON TIME'.
            TODO(feature): 'boarding' is still unreachable. AirportHub emits
            only 'ARRIVED' and 'ON TIME', so no boarding state exists to
            display. Building it is a feature, not a casing fix. */}
        <span className={`text-[11px] font-black uppercase px-2 py-1 rounded ${
          status === 'boarding' ? 'bg-[var(--amber)] text-[var(--ink-on-accent)] animate-pulse' :
          status === 'on time' ? 'bg-[var(--jade-soft)] text-[var(--jade)] border border-[var(--jade-soft)]' :
          'bg-[var(--jade-soft)] text-[var(--jade)] border border-[var(--jade-soft)]'
        }`}>
          {item.status}
        </span>
      </div>
    </motion.div>
  );
}
