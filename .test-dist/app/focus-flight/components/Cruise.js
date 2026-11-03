'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CruisePhase;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const focus_flight_1 = require("@/lib/focus-flight");
function CruisePhase({ session, progress, isPaused, setIsPaused, onComplete, onCancel }) {
    const { route } = session;
    const [isMuted, setIsMuted] = (0, react_1.useState)(true);
    const [isInterrupted, setIsInterrupted] = (0, react_1.useState)(false);
    const audioRef = (0, react_1.useRef)(null);
    // ROUTE INTERPOLATION (LAT/LNG) - Now just for HUD display
    const currentPos = (0, react_1.useMemo)(() => {
        const lat = route.from.coords.lat + (route.to.coords.lat - route.from.coords.lat) * progress;
        const lng = route.from.coords.lng + (route.to.coords.lng - route.from.coords.lng) * progress;
        return { lat, lng };
    }, [progress, route]);
    // Audio Logic
    (0, react_1.useEffect)(() => {
        audioRef.current = new Audio('https://www.soundjay.com/transportation/airplane-cabin-white-noise-01.mp3');
        audioRef.current.loop = true;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (audioRef.current) {
            if (!isMuted && !isPaused) {
                audioRef.current.play().catch(e => console.log('Audio play failed', e));
            }
            else {
                audioRef.current.pause();
            }
        }
    }, [isMuted, isPaused]);
    // Persistence update
    (0, react_1.useEffect)(() => {
        (0, focus_flight_1.setActiveFlight)({
            ...session,
            lastActive: Date.now()
        });
    }, [session]);
    // Tab detection
    (0, react_1.useEffect)(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !isPaused) {
                setIsInterrupted(true);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPaused]);
    // HUD values
    const timeLeftMs = Math.max((route.duration * 60 * 1000) - (Date.now() - session.startTime), 0);
    const minutes = Math.floor(timeLeftMs / 60000);
    const seconds = Math.floor((timeLeftMs % 60000) / 1000);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "h-full flex flex-col items-center justify-center relative bg-transparent overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-40", children: [...Array(6)].map((_, i) => ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { className: "absolute text-white/10", initial: { x: '110%', y: `${15 + i * 15}%` }, animate: { x: '-20%' }, transition: { duration: 40 + i * 20, repeat: Infinity, ease: "linear", delay: i * 4 }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Cloud, { size: 120 + i * 40 }) }, i))) }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-12 px-12 py-5 bg-black/60 border border-white/10 rounded-3xl backdrop-blur-2xl z-40", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-right space-y-0.5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest", children: "Origin Hub" }), (0, jsx_runtime_1.jsxs)("p", { className: "font-black text-xl text-white uppercase italic", children: [route.from.name, " ", (0, jsx_runtime_1.jsx)("span", { className: "text-emerald-500 text-xs ml-1", children: route.from.code })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { size: 10, className: "text-emerald-500 animate-spin-slow" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]", children: "En Route" })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-32 h-1 bg-white/5 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { className: "h-full bg-emerald-500 shadow-[0_0_10px_#10b981]", style: { width: `${progress * 100}%` } }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-left space-y-0.5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest", children: "Destination" }), (0, jsx_runtime_1.jsxs)("p", { className: "font-black text-xl text-white uppercase italic", children: [route.to.name, " ", (0, jsx_runtime_1.jsx)("span", { className: "text-emerald-500 text-xs ml-1", children: route.to.code })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "relative z-10 flex flex-col items-center gap-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "inline-block px-6 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-xl", children: (0, jsx_runtime_1.jsx)("p", { className: "text-emerald-500 font-black uppercase tracking-[0.5em] text-xs", children: session.task }) }), (0, jsx_runtime_1.jsxs)("h2", { className: "text-[15rem] font-black tracking-tighter tabular-nums leading-none select-none text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]", children: [minutes.toString().padStart(2, '0'), (0, jsx_runtime_1.jsx)("span", { className: "text-emerald-500/30 mx-[-0.05em] animate-pulse", children: ":" }), seconds.toString().padStart(2, '0')] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center gap-16 text-slate-400", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Navigation, { size: 20, className: "text-emerald-500/50" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("span", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-600", children: "Altitude" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-bold text-xs uppercase", children: [Math.round(34000 + progress * 4000), " FT"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Wind, { size: 20, className: "text-emerald-500/50" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("span", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-600", children: "Airspeed" }), (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-xs uppercase", children: "875 KM/H" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { size: 20, className: "text-emerald-500/50" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("span", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-600", children: "Coordinates" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-bold text-xs uppercase tracking-tighter", children: [currentPos.lat.toFixed(3), "\u00B0N, ", currentPos.lng.toFixed(3), "\u00B0E"] })] })] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute bottom-16 left-0 right-0 px-16 flex justify-between items-center z-50", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-6", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setIsMuted(!isMuted), className: "w-16 h-16 rounded-[24px] bg-black/40 border border-white/10 flex items-center justify-center text-slate-500 hover:bg-emerald-600 hover:text-white transition-all shadow-xl backdrop-blur-xl", children: isMuted ? (0, jsx_runtime_1.jsx)(lucide_react_1.VolumeX, { size: 24 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Volume2, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsPaused(!isPaused), className: `px-10 h-16 rounded-[24px] border flex items-center gap-4 font-black italic tracking-tighter transition-all backdrop-blur-xl ${isPaused
                                    ? 'bg-amber-500 text-white border-amber-400 shadow-2xl shadow-amber-500/30'
                                    : 'bg-black/40 text-slate-500 border-white/10 hover:bg-white/10 hover:text-white shadow-xl'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 20, className: isPaused ? 'animate-pulse' : '' }), isPaused ? 'RESUME MISSION' : 'HOLD PATTERN'] })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: onCancel, className: "flex items-center gap-4 px-10 h-16 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 font-black italic tracking-tighter hover:bg-red-500 hover:text-white transition-all group shadow-xl shadow-red-900/10 backdrop-blur-xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20, className: "group-hover:rotate-90 transition-transform duration-300" }), " ABORT MISSION"] })] }), (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: isInterrupted && ((0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-32 h-32 bg-amber-500/10 rounded-full flex items-center justify-center mb-10 border border-amber-500/20 animate-pulse", children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 64, className: "text-amber-500" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-6xl font-black italic tracking-tighter mb-6 text-white uppercase", children: "Critical Deviation" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-slate-400 max-w-xl mb-14 text-xl leading-relaxed", children: ["Flight PA2026 has deviated from its assigned route. Immediate re-entry required to complete the journey to ", route.to.name, "."] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsInterrupted(false), className: "px-20 py-8 bg-emerald-600 rounded-[32px] font-black italic tracking-tighter text-2xl text-white hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/40 uppercase", children: "Re-Engage Cockpit" })] })) })] }));
}
