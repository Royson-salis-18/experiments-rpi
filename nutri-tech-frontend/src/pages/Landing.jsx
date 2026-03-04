import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
    return (
        <div className="dark min-h-screen bg-brand-black text-white font-sans overflow-x-hidden selection:bg-brand-gold/30">
            {/* Background Texture & Effects */}
            <div className="fixed inset-0 grain-texture z-50 pointer-events-none"></div>
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-green/20 rounded-full blur-[100px] animate-pulse duration-[5000ms]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[100px] animate-pulse duration-[7000ms]"></div>
            </div>

            {/* Navigation - Added sticky and transition */}
            <nav className="sticky top-0 z-40 px-6 py-4 transition-all duration-300">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="size-10 bg-brand-surface border border-white/10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                            <span className="material-symbols-outlined text-brand-gold text-xl !fill-1">potted_plant</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight font-sans group-hover:text-brand-gold transition-colors">Nutri-Tech</h2>
                    </div>

                    <div className="hidden md:flex items-center gap-8 bg-brand-surface/50 backdrop-blur-xl border border-white/5 px-8 py-3 rounded-full shadow-lg shadow-black/5 hover:border-brand-gold/30 transition-colors">
                        {["Product", "Solutions", "Intelligence", "Pricing"].map((item) => (
                            <a key={item} href="#" className="text-sm font-medium text-text-secondary hover:text-brand-gold hover:scale-105 transition-all duration-300">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium hover:text-brand-gold transition-colors hover:scale-105 duration-300">Login</Link>
                        <Link to="/signup" className="bg-brand-gold text-brand-black px-6 py-3 rounded-full text-sm font-bold hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md hover:shadow-brand-gold/20">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-16 pb-32 px-6">
                <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default select-none">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
                            </span>
                            <span className="text-xs font-bold tracking-widest uppercase text-brand-gold">Next-Gen AgTech 2.0</span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-serif font-bold leading-[1.1] mb-8">
                            The Future of <br />
                            <span className="text-brand-gold italic relative inline-block after:content-[''] after:absolute after:bottom-2 after:left-0 after:w-full after:h-[2px] after:bg-brand-gold after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left after:transition-transform after:duration-500 cursor-default">Field</span> Intelligence
                        </h1>

                        <p className="text-lg text-text-secondary mb-10 max-w-lg leading-relaxed">
                            Precision farming SaaS powered by AI for modern agricultural excellence. Harness real-time data to optimize every single acre of your legacy.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link to="/signup" className="bg-brand-gold text-brand-black px-8 py-4 rounded-full text-lg font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-brand-gold/10 hover:shadow-brand-gold/20">
                                Start Free Trial
                            </Link>
                            <button className="px-8 py-4 rounded-full text-lg font-bold hover:bg-white/10 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-white/10 backdrop-blur-md group">
                                <span className="material-symbols-outlined group-hover:text-brand-accent transition-colors">play_circle</span>
                                Watch Demo
                            </button>
                        </div>
                    </div>

                    {/* Hero Image - Added Group and Zoom on Hover */}
                    <div className="relative group perspective-1000 cursor-pointer">
                        <div className="rounded-[24px] overflow-hidden border border-white/10 shadow-2xl relative aspect-square transition-transform duration-700 ease-out group-hover:scale-[1.02] group-hover:rotate-1 shadow-brand-green/20">
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyVU0ETROxW2lbe9PdxjJkYiZ036FAfiK9Vf4jz1p9-ljqebe1az-TrMGUs1hcmkx_MxG0pztGC7nWQlkYUnMB25iC2uxiHiRowui472RKyoGz148qgIzFMx0Nv80TOTb7Qd6fkTHqHATcHEBZU_byi-VzHvzwFkkY-O6byBZiOepnn6EJrcmTjOAsRur3zb6m7wWITAhAIJryPhqDgff9zW2k913cGzNI0AEioIjdzm01LgSdbc6qlkmP3JKDygvHQTk9uy-rQIs"
                                alt="Wheat Field"
                                className="w-full h-full object-cover opacity-80 transition-transform duration-1000 ease-out group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent"></div>

                            {/* Overlay Card - Added subtle lift on hover */}
                            <div className="absolute bottom-8 left-8 right-8 bg-brand-surface/40 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] flex items-center justify-between transition-transform duration-500 delay-100 group-hover:translate-y-[-5px] group-hover:bg-brand-surface/60">
                                <div className="flex gap-4 items-center">
                                    <div className="size-12 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-accent animate-pulse">
                                        <span className="material-symbols-outlined">analytics</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary uppercase font-bold tracking-wider mb-1">Current Yield Index</p>
                                        <p className="text-xl font-bold text-white">98.4% Efficiency</p>
                                    </div>
                                </div>
                                <span className="text-brand-accent font-bold">+12.5%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-[1200px] mx-auto">
                    <div className="text-center mb-20 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Precision Tools for Modern Growers</h2>
                        <p className="text-text-secondary text-lg">Our precision tools provide the deep insights needed to maximize yield and total sustainability through high-fidelity data.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Feature 1 - Added hover lift and icon zoom */}
                        <div className="bg-brand-surface/30 backdrop-blur-xl border border-white/5 p-10 rounded-[24px] hover:border-brand-gold/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-gold/10 group cursor-default">
                            <div className="size-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center mb-8 text-brand-gold group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-3xl">psychology</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold mb-4 group-hover:text-brand-gold transition-colors">AI-Predictions</h3>
                            <p className="text-text-secondary leading-relaxed">Predictive modeling for crop performance based on hyper-local weather data and historical soil performance.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-brand-surface/30 backdrop-blur-xl border border-white/5 p-10 rounded-[24px] hover:border-brand-accent/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-accent/10 group cursor-default">
                            <div className="size-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-8 text-brand-accent group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-3xl">biotech</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold mb-4 group-hover:text-brand-accent transition-colors">Nutrient Tracking</h3>
                            <p className="text-text-secondary leading-relaxed">Monitor vital minerals and nutrients in real-time with multi-spectral satellite integration and field sensors.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-brand-surface/30 backdrop-blur-xl border border-white/5 p-10 rounded-[24px] hover:border-white/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/5 group cursor-default">
                            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-3xl">grass</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold mb-4 group-hover:text-white transition-colors">Soil Health</h3>
                            <p className="text-text-secondary leading-relaxed">Deep insights into soil microbiome and precise moisture levels across every topographical variance.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 px-6">
                <div className="max-w-[1200px] mx-auto">
                    <div className="bg-brand-surface/40 backdrop-blur-xl border border-white/5 rounded-[24px] p-12 md:p-16 grid md:grid-cols-3 gap-12 text-center transition-all duration-500 hover:bg-brand-surface/60">
                        <div className="space-y-2 hover:scale-105 transition-transform duration-300">
                            <p className="text-text-secondary uppercase tracking-widest text-xs font-bold">Acres Managed</p>
                            <p className="text-5xl font-serif font-bold text-white">2.5M+</p>
                            <p className="text-brand-accent text-sm font-medium">+15% this year</p>
                        </div>
                        <div className="space-y-2 md:border-x border-white/10 hover:scale-105 transition-transform duration-300">
                            <p className="text-text-secondary uppercase tracking-widest text-xs font-bold">Yield Increase</p>
                            <p className="text-5xl font-serif font-bold text-white">24%</p>
                            <p className="text-brand-accent text-sm font-medium">+8% avg per user</p>
                        </div>
                        <div className="space-y-2 hover:scale-105 transition-transform duration-300">
                            <p className="text-text-secondary uppercase tracking-widest text-xs font-bold">Efficiency Gain</p>
                            <p className="text-5xl font-serif font-bold text-white">40%</p>
                            <p className="text-brand-accent text-sm font-medium">Water waste reduced</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 mx-6">
                <div className="max-w-[1200px] mx-auto bg-gradient-to-br from-[#123129] to-brand-black rounded-[32px] p-16 md:p-24 text-center relative overflow-hidden border border-white/5 transition-all duration-500 hover:border-brand-green/30 hover:shadow-2xl hover:shadow-brand-green/10">
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">
                            Ready to evolve your <br />
                            <span className="text-brand-gold italic">farming operations?</span>
                        </h2>
                        <p className="text-text-secondary text-lg mb-12 max-w-xl mx-auto">
                            Join thousands of modern agriculturists who are already using Nutri-Tech to secure the future of their land.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link to="/signup" className="bg-brand-gold text-brand-black px-10 py-4 rounded-full text-lg font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-brand-gold/10 hover:shadow-brand-gold/20">
                                Schedule an Analysis
                            </Link>
                            <button className="px-10 py-4 rounded-full text-lg font-bold hover:bg-white/5 active:scale-95 transition-all duration-300 border border-text-secondary/30 text-white hover:border-white">
                                View Pricing
                            </button>
                        </div>
                    </div>
                    {/* Decorative Gradients */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-brand-green/20 rounded-full blur-[120px] animate-pulse duration-[8000ms]"></div>
                        <div className="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-brand-gold/10 rounded-full blur-[100px] animate-pulse duration-[6000ms]"></div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3 group">
                        <div className="size-8 bg-brand-surface border border-white/10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-12 duration-300">
                            <span className="material-symbols-outlined text-brand-gold text-sm !fill-1">potted_plant</span>
                        </div>
                        <h2 className="text-md font-bold tracking-tight text-white font-sans group-hover:text-brand-gold transition-colors">Nutri-Tech</h2>
                    </div>
                    <div className="flex gap-8 text-sm text-text-secondary">
                        <a href="#" className="hover:text-brand-gold transition-colors hover:translate-y-[-2px] inline-block">Privacy Policy</a>
                        <a href="#" className="hover:text-brand-gold transition-colors hover:translate-y-[-2px] inline-block">Terms of Service</a>
                        <a href="#" className="hover:text-brand-gold transition-colors hover:translate-y-[-2px] inline-block">Cookie Policy</a>
                    </div>
                    <p className="text-sm text-text-secondary/60">
                        © 2024 Nutri-Tech Agricultural Systems. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
