"use client"

import { useState } from "react"
import { auth } from "../../lib/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState("")

  const handleAuth = async () => {
    setError("")
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        alert("Logged in successfully 🚀")
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        alert("Account created 🎉")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--ink-0)]">
      <div className="bg-[var(--ink-2)] border border-[var(--line)] p-8 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] w-80">
        <h1 className="text-2xl font-bold mb-4 text-center text-[var(--text)]">
          {isLogin ? "Login" : "Sign Up"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border border-[var(--line)] rounded bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--dim)]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border border-[var(--line)] rounded bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--dim)]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-[var(--coral)] text-sm mb-2">{error}</p>
        )}

        <button
          onClick={handleAuth}
          className="w-full bg-[var(--jade)] text-[#04150D] font-bold p-2 rounded hover:bg-[#5FE0AC]"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-[var(--jade)] mt-3 cursor-pointer text-center"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  )
}
