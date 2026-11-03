'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FocusFlightPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const focus_flight_1 = require("@/lib/focus-flight");
const AirportHub_1 = __importDefault(require("./components/AirportHub"));
const BoardingPass_1 = __importDefault(require("./components/BoardingPass"));
const Cruise_1 = __importDefault(require("./components/Cruise"));
const Landing_1 = __importDefault(require("./components/Landing"));
const Stats_1 = __importDefault(require("./components/Stats"));
const FlightMap_1 = __importDefault(require("./components/FlightMap"));
function FocusFlightPage() {
    const [phase, setPhase] = (0, react_1.useState)('hub');
    const [activeFlight, setActiveFlightState] = (0, react_1.useState)(null);
    const [history, setHistory] = (0, react_1.useState)({ sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] });
    const [selectedRoute, setSelectedRoute] = (0, react_1.useState)(null);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [isPaused, setIsPaused] = (0, react_1.useState)(false);
    // PROGRESS TRACKER
    (0, react_1.useEffect)(() => {
        if (!activeFlight || (phase !== 'cruise' && phase !== 'landing') || isPaused) {
            if (!activeFlight || (phase !== 'cruise' && phase !== 'landing'))
                setProgress(0);
            return;
        }
        const calculateProgress = () => {
            const elapsedMs = Date.now() - activeFlight.startTime;
            const totalMs = activeFlight.route.duration * 60 * 1000;
            return Math.min(Math.max(elapsedMs / totalMs, 0), 1);
        };
        setProgress(calculateProgress());
        const interval = setInterval(() => {
            const p = calculateProgress();
            setProgress(p);
            if (p >= 1 && phase === 'cruise') {
                setPhase('landing');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeFlight, phase, isPaused]);
    // SESSION RESTORATION ENGINE
    (0, react_1.useEffect)(() => {
        const init = () => {
            const savedHistory = (0, focus_flight_1.getFlightHistory)();
            setHistory(savedHistory);
            const savedActive = (0, focus_flight_1.getActiveFlight)();
            if (savedActive) {
                // Calculate if flight is technically over
                const elapsedMs = Date.now() - savedActive.startTime;
                const totalMs = savedActive.route.duration * 60 * 1000;
                if (elapsedMs >= totalMs) {
                    setActiveFlightState(savedActive);
                    setPhase('landing');
                }
                else {
                    setActiveFlightState(savedActive);
                    setPhase('cruise');
                }
            }
        };
        init();
    }, []);
    const initiateBoarding = (0, react_1.useCallback)((route) => {
        setSelectedRoute(route);
        setPhase('boarding');
    }, []);
    const startFlight = (0, react_1.useCallback)((session) => {
        setActiveFlightState(session);
        (0, focus_flight_1.setActiveFlight)(session);
        setPhase('cruise');
    }, []);
    const completeFlight = (0, react_1.useCallback)((rating, reflection, status) => {
        if (!activeFlight)
            return;
        const finishedSession = {
            ...activeFlight,
            status,
            focusRating: rating,
            reflection,
        };
        (0, focus_flight_1.saveFlightSession)(finishedSession);
        setActiveFlightState(null);
        (0, focus_flight_1.setActiveFlight)(null);
        setHistory((0, focus_flight_1.getFlightHistory)());
        setPhase('stats');
    }, [activeFlight]);
    const cancelFlight = (0, react_1.useCallback)(() => {
        if (window.confirm('ABORT MISSION? Critical deviation will be logged in your profile.')) {
            completeFlight(0, 'Mission aborted by pilot manually.', 'interrupted');
        }
    }, [completeFlight]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-[#0a0a0b] text-white overflow-hidden relative selection:bg-emerald-500/30", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 z-0", children: (0, jsx_runtime_1.jsx)(FlightMap_1.default, { origin: activeFlight?.route.from.coords || { lat: 20, lng: 77 }, destination: activeFlight?.route.to.coords || { lat: 20, lng: 77 }, progress: progress, isActive: !!activeFlight }) }), (0, jsx_runtime_1.jsxs)("nav", { className: "relative z-[150] px-10 py-8 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-2xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-14 h-14 bg-emerald-600 rounded-[22px] flex items-center justify-center shadow-[0_20px_40px_rgba(5,150,105,0.3)] border border-emerald-400/20", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plane, { className: "w-8 h-8 text-white -rotate-12" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-0.5", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-black tracking-tighter italic leading-none uppercase", children: "Focus Flight" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]", children: "Route Network: Active" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-8", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setPhase('stats'), className: `flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${phase === 'stats' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { size: 18 }), " Pilot Log"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setPhase('hub'), className: `flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${phase === 'hub' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { size: 18 }), " Terminal"] })] })] }), (0, jsx_runtime_1.jsx)("main", { className: "relative z-10 container mx-auto px-10 py-12 h-[calc(100vh-120px)] bg-transparent overflow-y-auto", children: (0, jsx_runtime_1.jsxs)(framer_motion_1.AnimatePresence, { mode: "wait", children: [phase === 'hub' && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "flex-1", children: (0, jsx_runtime_1.jsx)(AirportHub_1.default, { history: history, onSelectRoute: initiateBoarding }) }, "hub")), phase === 'boarding' && selectedRoute && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 }, className: "flex-1", children: (0, jsx_runtime_1.jsx)(BoardingPass_1.default, { route: selectedRoute, onBoard: startFlight, onCancel: () => setPhase('hub') }) }, "boarding")), phase === 'cruise' && activeFlight && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-[200] bg-transparent", children: (0, jsx_runtime_1.jsx)(Cruise_1.default, { session: activeFlight, progress: progress, isPaused: isPaused, setIsPaused: setIsPaused, onComplete: () => setPhase('landing'), onCancel: cancelFlight }) }, "cruise")), phase === 'landing' && activeFlight && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -40 }, className: "flex-1", children: (0, jsx_runtime_1.jsx)(Landing_1.default, { session: activeFlight, onFinish: completeFlight }) }, "landing")), phase === 'stats' && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, className: "flex-1", children: (0, jsx_runtime_1.jsx)(Stats_1.default, { history: history, onNewFlight: () => setPhase('hub') }) }, "stats"))] }) })] }));
}
