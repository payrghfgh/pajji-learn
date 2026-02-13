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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isLogin ? "Login" : "Sign Up"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <button
          onClick={handleAuth}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-blue-600 mt-3 cursor-pointer text-center"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  )
}
