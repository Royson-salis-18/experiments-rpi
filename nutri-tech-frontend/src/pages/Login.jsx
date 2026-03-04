import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                // Store session info if needed, e.g. for Protected Route checks
                localStorage.setItem("token", data.session.access_token);
                alert("Login successful");
                navigate("/dashboard");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center text-slate-300 px-4">
            <div className="glass-card w-full max-w-110 rounded-[3rem] p-10 md:p-12 flex flex-col items-center">

                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="size-16 bg-(--accent-gold)/10 rounded-2xl flex items-center justify-center
                                border border-(--accent-gold)/30 shadow-[0_0_20px_rgba(208, 187, 149, 0.15)]
                                mx-auto mb-6 accent-glow">
                        <span className="text-4xl">🌱</span>
                    </div>

                    <h1 className="serif-logo text-4xl font-semibold text-white tracking-right">
                        Nutri-Tech
                    </h1>

                    <p className="text-[10px] text-(--accent-gold) font-black uppercase tracking-[0.4em] mt-3 opacity-80">
                        Precision Intelligence
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-5">

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:right-2 focus:ring-yellow-200"
                        required
                    />

                    <input
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ringt-2 focus:ring-yellow-200"
                        required
                    />

                    {error && (
                        <p className="text-red-400 text-sm text-center">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-yellow-200 py-3 font-bold text-black hover:bg-yellow-300 transition"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

                <p className="text-xs text-center mt-6 text-slate-400">
                    New here?{" "}
                    <Link
                        to={"/signup"}
                        className="text-yellow-200 cursor-pointer hover:underline">
                        Create Account.
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Login; 