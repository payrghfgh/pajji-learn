'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RedeemPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const firebase_1 = require("@/lib/firebase");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const link_1 = __importDefault(require("next/link"));
function RedeemPage() {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [code, setCode] = (0, react_1.useState)('');
    const [status, setStatus] = (0, react_1.useState)({ type: 'idle', message: '' });
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [redeemedInfo, setRedeemedInfo] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, auth_1.onAuthStateChanged)(firebase_1.auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    const handleRedeem = async (e) => {
        e.preventDefault();
        if (!user) {
            setStatus({ type: 'error', message: 'You must be logged in to redeem a code.' });
            return;
        }
        if (!code.trim())
            return;
        setIsSubmitting(true);
        setStatus({ type: 'idle', message: '' });
        try {
            // 1. Find the code in Firestore
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'promo_codes'), (0, firestore_1.where)('code', '==', code.trim().toUpperCase()));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            if (querySnapshot.empty) {
                setStatus({ type: 'error', message: '❌ Nope, invalid code.' });
                setIsSubmitting(false);
                return;
            }
            const codeDoc = querySnapshot.docs[0];
            const codeData = codeDoc.data();
            // 2. Check if already used
            if (codeData.isUsed) {
                setStatus({ type: 'error', message: '❌ This code has already been used.' });
                setIsSubmitting(false);
                return;
            }
            // 3. Mark code as used
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'promo_codes', codeDoc.id), {
                isUsed: true,
                usedBy: user.uid,
                usedAt: (0, firestore_1.serverTimestamp)()
            });
            // 4. Update user's membership
            const tier = codeData.tier || 'plus';
            const durationDays = codeData.durationDays || 30;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + durationDays);
            const expiryString = expiryDate.toISOString();
            const membershipValue = `PAJJI${tier.toUpperCase()}`;
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'users', user.uid), {
                membership: membershipValue,
                membershipExpiry: expiryString
            }, { merge: true });
            // 5. Show success
            setRedeemedInfo({
                tier: tier.charAt(0).toUpperCase() + tier.slice(1),
                expiry: expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            });
            setStatus({ type: 'success', message: '✅ Success!' });
        }
        catch (error) {
            console.error('Redemption error:', error);
            setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }, children: (0, jsx_runtime_1.jsx)("p", { children: "Loading..." }) }));
    }
    if (!user) {
        return ((0, jsx_runtime_1.jsxs)("div", { style: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white', padding: '20px' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { fontSize: '2rem', marginBottom: '20px' }, children: "Redeem Your Code" }), (0, jsx_runtime_1.jsx)("p", { style: { marginBottom: '30px', opacity: 0.7 }, children: "Please login to your Pajji Learn account first." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", style: { padding: '12px 24px', background: '#10b981', borderRadius: '8px', color: 'black', fontWeight: 'bold', textDecoration: 'none' }, children: "Back to Home" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            minHeight: '100vh',
            background: '#0a0a0a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'Inter, system-ui, sans-serif'
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '40px',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '450px',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800', background: 'linear-gradient(to right, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, children: "Redeem Code" }), (0, jsx_runtime_1.jsx)("p", { style: { marginBottom: '32px', opacity: 0.6 }, children: "Enter your special code to unlock premium features." }), status.type === 'success' ? ((0, jsx_runtime_1.jsxs)("div", { style: { animation: 'fadeIn 0.5s ease-out' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '5rem', marginBottom: '20px' }, children: "\uD83C\uDF89" }), (0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.5rem', marginBottom: '8px' }, children: status.message }), (0, jsx_runtime_1.jsxs)("p", { style: { fontSize: '1.1rem', marginBottom: '4px' }, children: ["You got ", (0, jsx_runtime_1.jsxs)("strong", { children: ["Pajji ", redeemedInfo?.tier] })] }), (0, jsx_runtime_1.jsxs)("p", { style: { opacity: 0.6, fontSize: '0.9rem', marginBottom: '30px' }, children: ["Valid until ", redeemedInfo?.expiry] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", style: {
                                    display: 'block',
                                    padding: '14px',
                                    background: '#10b981',
                                    borderRadius: '12px',
                                    color: 'black',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    transition: 'transform 0.2s'
                                }, children: "Start Learning" })] })) : ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleRedeem, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "PLUS-ABC123XYZ", value: code, onChange: (e) => setCode(e.target.value), disabled: isSubmitting, style: {
                                    width: '100%',
                                    padding: '16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    textAlign: 'center',
                                    letterSpacing: '2px',
                                    marginBottom: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }, onFocus: (e) => e.target.style.borderColor = '#10b981', onBlur: (e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)' }), status.type === 'error' && ((0, jsx_runtime_1.jsx)("p", { style: { color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem', fontWeight: '500' }, children: status.message })), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isSubmitting || !code.trim(), style: {
                                    width: '100%',
                                    padding: '16px',
                                    background: isSubmitting ? '#065f46' : '#10b981',
                                    borderRadius: '12px',
                                    color: 'black',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    border: 'none',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }, children: isSubmitting ? 'Activating...' : 'Activate Now 🚀' })] }))] }), (0, jsx_runtime_1.jsx)("style", { children: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` })] }));
}
