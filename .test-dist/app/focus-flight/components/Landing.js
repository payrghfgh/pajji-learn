'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LandingPhase;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const canvas_confetti_1 = __importDefault(require("canvas-confetti"));
function LandingPhase({ session, onFinish }) {
    const [rating, setRating] = (0, react_1.useState)(0);
    const [reflection, setReflection] = (0, react_1.useState)('');
    const [isSubmitted, setIsSubmitted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        (0, canvas_confetti_1.default)({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#ffffff']
        });
    }, []);
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            onFinish(rating, reflection, 'completed');
        }, 1000);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-2xl mx-auto flex flex-col items-center justify-center h-full space-y-12", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center space-y-4", children: [(0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trophy, { className: "w-12 h-12 text-emerald-500" }) }), (0, jsx_runtime_1.jsx)("h2", { className: "text-4xl font-black italic", children: "MISSION ACCOMPLISHED" }), (0, jsx_runtime_1.jsx)("p", { className: "text-slate-400", children: "Flight PA-2026 has landed safely. Review your performance to log the mission." })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-sm space-y-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 text-center", children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Star, { className: "w-4 h-4" }), " Rate Your Focus"] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-center gap-4", children: [1, 2, 3, 4, 5].map((s) => ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setRating(s), className: `w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${rating >= s
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110'
                                        : 'bg-white/5 text-slate-600 hover:bg-white/10'}`, children: s }, s))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "w-4 h-4" }), " Flight Debrief"] }), (0, jsx_runtime_1.jsx)("textarea", { placeholder: "What did you achieve? Any struggles?", value: reflection, onChange: (e) => setReflection(e.target.value), className: "w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-h-[120px] focus:outline-none focus:border-blue-500 transition-all resize-none" })] }), (0, jsx_runtime_1.jsxs)("button", { type: "submit", disabled: rating === 0 || isSubmitted, className: `w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${rating === 0 || isSubmitted
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'}`, children: [isSubmitted ? 'LOGGING MISSION...' : 'COMPLETE LANDING', " ", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "w-5 h-5" })] })] })] }));
}
