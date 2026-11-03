'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const firebase_1 = require("@/lib/firebase");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const admin_1 = require("@/lib/admin");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
function AdminPage() {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [activeTab, setActiveTab] = (0, react_1.useState)('codes');
    // AI Management State
    const [aiConfig, setAiConfig] = (0, react_1.useState)({
        systemPrompt: "You are Pajji Learn AI, an ai for a learning platform made by Pajji Services. Answer clearly and concisely using the provided context. Be helpful but brief to save time.Sometimes, act fun",
        model: "llama-3.3-70b-versatile",
        maxTokens: 300
    });
    const [isSavingAI, setIsSavingAI] = (0, react_1.useState)(false);
    // Promo Codes State
    const [codes, setCodes] = (0, react_1.useState)([]);
    const [newCodes, setNewCodes] = (0, react_1.useState)('');
    const [tier, setTier] = (0, react_1.useState)('plus');
    const [duration, setDuration] = (0, react_1.useState)(30);
    const [isAdding, setIsAdding] = (0, react_1.useState)(false);
    // User Management State
    const [allUsers, setAllUsers] = (0, react_1.useState)([]);
    const [userSearch, setUserSearch] = (0, react_1.useState)('');
    const [isUpdatingUser, setIsUpdatingUser] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, auth_1.onAuthStateChanged)(firebase_1.auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    (0, react_1.useEffect)(() => {
        if (user && (0, admin_1.isAdmin)(user.email)) {
            // Promo Codes Subscription
            const qCodes = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'promo_codes'), (0, firestore_1.orderBy)('createdAt', 'desc'));
            const unsubCodes = (0, firestore_1.onSnapshot)(qCodes, (snapshot) => {
                setCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            // Users Subscription (Limit to 50 for performance, or use search)
            const qUsers = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'users'), (0, firestore_1.limit)(50));
            const unsubUsers = (0, firestore_1.onSnapshot)(qUsers, (snapshot) => {
                setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            // AI Config Subscription
            const unsubAI = (0, firestore_1.onSnapshot)((0, firestore_1.doc)(firebase_1.db, 'settings', 'ai_config'), (docSnap) => {
                if (docSnap.exists()) {
                    setAiConfig(docSnap.data());
                }
            });
            return () => {
                unsubCodes();
                unsubUsers();
                unsubAI();
            };
        }
    }, [user]);
    const handleAddCodes = async (e) => {
        e.preventDefault();
        if (!newCodes.trim())
            return;
        setIsAdding(true);
        const codesList = newCodes.split(/[\n,]+/).map(c => c.trim().toUpperCase()).filter(c => c);
        try {
            for (const code of codesList) {
                await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'promo_codes'), {
                    code,
                    tier,
                    durationDays: duration,
                    isUsed: false,
                    usedBy: null,
                    createdAt: (0, firestore_1.serverTimestamp)()
                });
            }
            setNewCodes('');
            alert(`Added ${codesList.length} codes!`);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setIsAdding(false);
        }
    };
    const handleGiftXP = async (userId, currentXP) => {
        if (isUpdatingUser)
            return;
        setIsUpdatingUser(userId);
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', userId), {
                xp: (currentXP || 0) + 500
            });
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setIsUpdatingUser(null);
        }
    };
    const handleSetTier = async (userId, newTier) => {
        if (isUpdatingUser)
            return;
        setIsUpdatingUser(userId);
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', userId), {
                membership: newTier,
                membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setIsUpdatingUser(null);
        }
    };
    const handleSaveAIConfig = async () => {
        setIsSavingAI(true);
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'settings', 'ai_config'), aiConfig);
            alert('AI Configuration Saved Globally!');
        }
        catch (error) {
            // If document doesn't exist, try setting it
            try {
                const { setDoc } = await Promise.resolve().then(() => __importStar(require('firebase/firestore')));
                await setDoc((0, firestore_1.doc)(firebase_1.db, 'settings', 'ai_config'), aiConfig);
                alert('AI Configuration Created & Saved!');
            }
            catch (e) {
                console.error(e);
                alert('Failed to save AI config.');
            }
        }
        finally {
            setIsSavingAI(false);
        }
    };
    if (loading)
        return (0, jsx_runtime_1.jsx)("div", { className: "flex h-screen items-center justify-center bg-black text-white", children: "Loading..." });
    if (!user || !(0, admin_1.isAdmin)(user.email)) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen flex-col items-center justify-center bg-black p-10 text-center text-white", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 64, className: "mb-4 text-red-500" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-black text-red-500", children: "ACCESS DENIED" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 opacity-50", children: "You do not have administrative privileges." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "mt-8 text-emerald-500 underline", children: "Return to Pajji Learn" })] }));
    }
    const filteredUsers = allUsers.filter(u => u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(userSearch.toLowerCase()));
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-[#020617] p-4 text-white md:p-10", style: { fontFamily: 'Syne, Inter, system-ui, sans-serif' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-6xl", children: [(0, jsx_runtime_1.jsxs)("header", { className: "mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-4xl font-black tracking-tighter text-white md:text-6xl", children: ["ADMIN", (0, jsx_runtime_1.jsx)("span", { className: "text-emerald-500", children: "HUB" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-lg font-bold opacity-40", children: "System Management & User Control" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-bold transition-all hover:bg-white/10", children: ["Exit Dashboard ", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 18 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-10 flex gap-2 rounded-3xl bg-white/5 p-2 backdrop-blur-xl", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveTab('codes'), className: `flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black transition-all ${activeTab === 'codes' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-white/50'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Ticket, { size: 20 }), " PROMO CODES"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveTab('users'), className: `flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black transition-all ${activeTab === 'users' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-white/50'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { size: 20 }), " USER MANAGEMENT"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveTab('ai'), className: `flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black transition-all ${activeTab === 'ai' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-white/50'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bot, { size: 20 }), " AI ENGINE"] })] }), activeTab === 'codes' && ((0, jsx_runtime_1.jsxs)("div", { className: "grid gap-10 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "mb-6 flex items-center gap-2 text-xl font-black", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 20, className: "text-yellow-400" }), " GENERATE CODES"] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleAddCodes, children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-2 block text-xs font-black uppercase tracking-widest opacity-40", children: "Codes (comma or line separated)" }), (0, jsx_runtime_1.jsx)("textarea", { value: newCodes, onChange: (e) => setNewCodes(e.target.value), placeholder: "PAJJI-2026-X\\nPROMO-123-Y", className: "h-40 w-full rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-white outline-none focus:border-emerald-500/50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6 grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-2 block text-xs font-black uppercase tracking-widest opacity-40", children: "Tier" }), (0, jsx_runtime_1.jsxs)("select", { value: tier, onChange: (e) => setTier(e.target.value), className: "w-full rounded-xl border border-white/10 bg-black/40 p-3 font-bold outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "plus", children: "Plus" }), (0, jsx_runtime_1.jsx)("option", { value: "pro", children: "Pro" }), (0, jsx_runtime_1.jsx)("option", { value: "ultra", children: "Ultra" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-2 block text-xs font-black uppercase tracking-widest opacity-40", children: "Days" }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: duration, onChange: (e) => setDuration(parseInt(e.target.value)), className: "w-full rounded-xl border border-white/10 bg-black/40 p-3 font-bold outline-none" })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isAdding || !newCodes.trim(), className: "w-full rounded-2xl bg-white py-4 font-black text-black transition-all hover:bg-white/90 disabled:opacity-30", children: isAdding ? 'Adding...' : 'GENERATE CODES' })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-2", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "mb-6 flex items-center gap-2 text-xl font-black", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Award, { size: 20, className: "text-emerald-500" }), " ACTIVE PROMO INVENTORY (", codes.length, ")"] }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "p-6", children: "Code" }), (0, jsx_runtime_1.jsx)("th", { className: "p-6", children: "Tier" }), (0, jsx_runtime_1.jsx)("th", { className: "p-6", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "p-6", children: "Created" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-white/5", children: codes.map(c => ((0, jsx_runtime_1.jsxs)("tr", { className: "group hover:bg-white/[0.02]", children: [(0, jsx_runtime_1.jsx)("td", { className: "p-6 font-mono font-black", children: c.code }), (0, jsx_runtime_1.jsx)("td", { className: "p-6", children: (0, jsx_runtime_1.jsx)("span", { className: `rounded-lg px-2 py-1 text-[10px] font-black uppercase ${c.tier === 'ultra' ? 'bg-amber-500 text-black' : c.tier === 'pro' ? 'bg-blue-500 text-black' : 'bg-emerald-500 text-black'}`, children: c.tier }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-6", children: c.isUsed ? ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2 text-xs font-bold text-red-400", children: [(0, jsx_runtime_1.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-red-400" }), " Used"] })) : ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2 text-xs font-bold text-emerald-400", children: [(0, jsx_runtime_1.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" }), " Available"] })) }), (0, jsx_runtime_1.jsx)("td", { className: "p-6 text-xs font-bold text-white/30", children: c.createdAt?.toDate?.() ? c.createdAt.toDate().toLocaleDateString() : '---' })] }, c.id))) })] }) }) })] })] })), activeTab === 'users' && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "flex items-center gap-2 text-xl font-black uppercase tracking-tight", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { size: 20, className: "text-emerald-500" }), " Database Users (", allUsers.length, ")"] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1 md:max-w-md", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-white/30", size: 18 }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search by name or email...", value: userSearch, onChange: (e) => setUserSearch(e.target.value), className: "w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 font-bold outline-none focus:border-emerald-500/50" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 md:grid-cols-2 xl:grid-cols-3", children: filteredUsers.map(u => ((0, jsx_runtime_1.jsxs)("div", { className: "group relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-emerald-500/30 hover:bg-white/[0.08]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4 flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-black text-black", children: u.displayName?.[0] || u.email?.[0] || '?' }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-black leading-tight text-white", children: u.displayName || 'Unnamed Student' }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-bold opacity-30", children: u.email })] })] }), (0, jsx_runtime_1.jsx)("span", { className: `rounded-lg px-2 py-1 text-[10px] font-black uppercase ${u.membership === 'ultra' ? 'bg-amber-500 text-black' : u.membership === 'pro' ? 'bg-blue-500 text-black' : 'bg-emerald-500 text-black'}`, children: u.membership || 'Free' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6 grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-black/40 p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black uppercase tracking-widest opacity-30", children: "Current XP" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-black text-emerald-500", children: u.xp || 0 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-black/40 p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black uppercase tracking-widest opacity-30", children: "Level" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-black text-yellow-400", children: Math.floor((u.xp || 0) / 500) + 1 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => handleGiftXP(u.id, u.xp), disabled: isUpdatingUser === u.id, className: "flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 text-xs font-black text-black transition-all hover:bg-emerald-400 disabled:opacity-30", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Gift, { size: 14 }), " +500 XP"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => handleSetTier(u.id, 'ultra'), disabled: isUpdatingUser === u.id, className: "flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2 text-xs font-black text-black transition-all hover:bg-amber-400 disabled:opacity-30", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Star, { size: 14 }), " ULTRA"] })] })] }, u.id))) })] })), activeTab === 'ai' && ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-3xl space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "mb-8 flex items-center gap-3 text-2xl font-black", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bot, { size: 32, className: "text-emerald-500" }), " AI ENGINE CONTROL"] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-2 block text-xs font-black uppercase tracking-widest opacity-40", children: "System Instruction (Persona)" }), (0, jsx_runtime_1.jsx)("textarea", { value: aiConfig.systemPrompt, onChange: (e) => setAiConfig({ ...aiConfig, systemPrompt: e.target.value }), className: "h-48 w-full rounded-2xl border border-white/10 bg-black/40 p-5 font-bold text-white outline-none focus:border-emerald-500/50", placeholder: "Enter instructions for the AI..." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-2 block text-xs font-black uppercase tracking-widest opacity-40", children: "LLM Model" }), (0, jsx_runtime_1.jsxs)("select", { value: aiConfig.model, onChange: (e) => setAiConfig({ ...aiConfig, model: e.target.value }), className: "w-full rounded-xl border border-white/10 bg-black/40 p-4 font-black outline-none focus:border-emerald-500/50", children: [(0, jsx_runtime_1.jsx)("option", { value: "llama-3.3-70b-versatile", children: "Llama 3.3 70B (Versatile)" }), (0, jsx_runtime_1.jsx)("option", { value: "llama-3.1-8b-instant", children: "Llama 3.1 8B (Instant/Cheap)" }), (0, jsx_runtime_1.jsx)("option", { value: "mixtral-8x7b-32768", children: "Mixtral 8x7b" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-2 block text-xs font-black uppercase tracking-widest opacity-40", children: "Response Cap (Max Tokens)" }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: aiConfig.maxTokens, onChange: (e) => setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) }), className: "w-full rounded-xl border border-white/10 bg-black/40 p-4 font-black outline-none focus:border-emerald-500/50" })] })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleSaveAIConfig, disabled: isSavingAI, className: "flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-5 text-lg font-black text-black transition-all hover:bg-emerald-400 disabled:opacity-30", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { size: 20 }), " ", isSavingAI ? 'Saving Settings...' : 'PUBLISH AI UPDATES'] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl border border-dashed border-white/10 p-8 text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { size: 32, className: "mx-auto mb-4 opacity-20" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-bold opacity-30", children: "These settings take effect globally for all users instantly upon saving." })] })] }))] }) }));
}
