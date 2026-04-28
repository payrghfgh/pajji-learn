'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, MessageSquare, ChevronRight, Trophy } from 'lucide-react';
import { FlightSession } from '@/lib/focus-flight';
import confetti from 'canvas-confetti';

interface LandingProps {
  session: FlightSession;
  onFinish: (rating: number, reflection: string, status: 'completed' | 'interrupted') => void;
}

export default function LandingPhase({ session, onFinish }: LandingProps) {
  const [rating, setRating] = useState(0);
  const [reflection, setReflection] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#ffffff']
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      onFinish(rating, reflection, 'completed');
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"
        >
          <Trophy className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <h2 className="text-4xl font-black italic">MISSION ACCOMPLISHED</h2>
        <p className="text-slate-400">Flight PA-2026 has landed safely. Review your performance to log the mission.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-sm space-y-10">
        {/* Rating */}
        <div className="space-y-6 text-center">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <Star className="w-4 h-4" /> Rate Your Focus
          </label>
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                  rating >= s 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' 
                    : 'bg-white/5 text-slate-600 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Reflection */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Flight Debrief
          </label>
          <textarea
            placeholder="What did you achieve? Any struggles?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-h-[120px] focus:outline-none focus:border-blue-500 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || isSubmitted}
          className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            rating === 0 || isSubmitted
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
          }`}
        >
          {isSubmitted ? 'LOGGING MISSION...' : 'COMPLETE LANDING'} <ChevronRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
