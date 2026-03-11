import { useState } from "react"
import { supabase } from "../supabaseClient"

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", type: "" })
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({ text: "Success! Check your email for confirmation link.", type: "success" })
      }
    } catch (err) {
      setMessage({ text: err.message || "An error occurred", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Brand logo/name */}
      <div className="flex items-center gap-3 mb-8">
        <div className="size-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">NT</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">NutriTech</h1>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-6 text-center">
          {isLogin ? "Sign In to Console" : "Create Account"}
        </h2>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@nutritech.ag"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:to-green-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-sm">refresh</span> Processing</>
            ) : (
              isLogin ? "Access Console" : "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setMessage({text:"", type:""}) }}
            className="text-gray-400 hover:text-emerald-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}
