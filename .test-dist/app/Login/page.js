"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const firebase_1 = require("../../lib/firebase");
const auth_1 = require("firebase/auth");
function AuthPage() {
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [isLogin, setIsLogin] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)("");
    const handleAuth = async () => {
        setError("");
        try {
            if (isLogin) {
                await (0, auth_1.signInWithEmailAndPassword)(firebase_1.auth, email, password);
                alert("Logged in successfully 🚀");
            }
            else {
                await (0, auth_1.createUserWithEmailAndPassword)(firebase_1.auth, email, password);
                alert("Account created 🎉");
            }
        }
        catch (err) {
            setError(err.message);
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-screen bg-gray-100", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-8 rounded-lg shadow-md w-80", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold mb-4 text-center", children: isLogin ? "Login" : "Sign Up" }), (0, jsx_runtime_1.jsx)("input", { type: "email", placeholder: "Email", className: "w-full mb-3 p-2 border rounded", value: email, onChange: (e) => setEmail(e.target.value) }), (0, jsx_runtime_1.jsx)("input", { type: "password", placeholder: "Password", className: "w-full mb-3 p-2 border rounded", value: password, onChange: (e) => setPassword(e.target.value) }), error && ((0, jsx_runtime_1.jsx)("p", { className: "text-red-500 text-sm mb-2", children: error })), (0, jsx_runtime_1.jsx)("button", { onClick: handleAuth, className: "w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700", children: isLogin ? "Login" : "Sign Up" }), (0, jsx_runtime_1.jsx)("p", { onClick: () => setIsLogin(!isLogin), className: "text-sm text-blue-600 mt-3 cursor-pointer text-center", children: isLogin
                        ? "Don't have an account? Sign up"
                        : "Already have an account? Login" })] }) }));
}
