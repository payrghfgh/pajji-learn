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
    <div className="bg-[#121214] border-4 border-[#1e1e21] rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-[#0a0a0b] px-6 py-3 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-[#facc15] font-black tracking-widest text-xs uppercase">Departures Board</h3>
        <div className="flex gap-4">
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      
      <div className="p-4 space-y-1">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
          <div className="col-span-1">Flight</div>
          <div className="col-span-4">Destination</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-2">Gate</div>
          <div className="col-span-3 text-right">Status</div>
        </div>
        
        {items.map((item, i) => (
          <BoardRow key={i} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}

function BoardRow({ item, index }: { item: any; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#1a1a1c] rounded-md border border-white/5 group hover:bg-[#202022] transition-colors cursor-pointer"
    >
      <div className="col-span-1 text-[#facc15] font-mono font-bold tracking-tighter">PA{100 + index}</div>
      <div className="col-span-4 flex items-center gap-2">
        <span className="text-white font-bold tracking-tight uppercase">{item.destination}</span>
        <span className="text-white/20 font-mono text-[10px]">{item.code}</span>
      </div>
      <div className="col-span-2 text-white/60 font-mono font-bold">{item.duration}</div>
      <div className="col-span-2 text-white/60 font-mono font-bold">{item.gate}</div>
      <div className="col-span-3 text-right">
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
          item.status === 'Boarding' ? 'bg-[#facc15] text-black animate-pulse' :
          item.status === 'On Time' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {item.status}
        </span>
      </div>
    </motion.div>
  );
}
