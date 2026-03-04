import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        company: "",
        password: ""
    })
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign up user
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
            });

            if (error) throw error;

            if (data.user) {
                // 2. Insert profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            full_name: form.name,
                            company_name: form.company
                        }
                    ]);

                if (profileError) {
                    console.error("Profile creation error:", profileError);
                    alert("Account created but profile update failed.");
                } else {
                    alert("Signup successful! Please log in.");
                    navigate("/login");
                }
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center text-slate-300 px-4">
            <div className="glass-card w-full max-w-135 rounded-[3rem] p-10 md:p-14 flex flex-col items-center">

                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/30 mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl">potted_plant</span>
                    </div>

                    <h1 className="serif-logo text-4xl font-semibold text-white">
                        Nutri-Tech
                    </h1>

                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mt-3 opacity-80">
                        Join the Intelligent Harvest
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-5">

                    {/*Full Name */}
                    <Input
                        icon="person"
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

                    {/*Email*/}
                    <Input
                        icon="mail"
                        label="Email Address"
                        placeholder="john@enterprise.com"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />

                    {/*Company*/}
                    <Input
                        icon="corporate_fare"
                        label="Company Name"
                        placeholder="Global Farms Ltd."
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />

                    {/*Password*/}
                    <Input
                        icon="lock"
                        label="Password"
                        placeholder="********"
                        type="password"
                        trailingIcon="visibility"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="nt-button w-full py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>
                {/* Form */}

                <p className="text-xs text-slate-500 mt-8">
                    Already have an account?
                    <Link to="/login" className="text-primary font-bold ml-1 cursor-pointer">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

function Input({ label, icon, trailingIcon, ...props }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">
                {label}
            </label>

            <div className="input-glow flex items-center bg-whtie/5 border border-white/10 rounded-2xl px-5">
                <span className="material-symbols-outlined text-slate-500 mr-3">
                    {icon}
                </span>

                <input
                    {...props}
                    className="w-full py-3.5  bg-transparent text-white placeholder:text-slate-600 focus:outline-none text-sm"
                />

                {trailingIcon && (
                    <span className="material-symbol-outlined text-slate-500 cursor-pointer">
                        {trailingIcon}
                    </span>
                )}
            </div>
        </div>
    );
}

export default Signup;