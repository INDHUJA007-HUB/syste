import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07090e] border-t border-slate-800/60 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/60">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
                Stream<span className="text-rose-500">Sphere</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise-grade OTT video streaming platform featuring HLS adaptive bitrate delivery, signed media tokens, multi-tier subscription authorization, and instant playback resumption.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TLS 1.3 & Signed Media Architecture</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Explore</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/catalogue" className="hover:text-white transition-colors">
                  Movie Catalogue
                </Link>
              </li>
              <li>
                <Link to="/catalogue?genre=sci-fi" className="hover:text-white transition-colors">
                  Sci-Fi & Cyberpunk
                </Link>
              </li>
              <li>
                <Link to="/catalogue?genre=animation" className="hover:text-white transition-colors">
                  CGI & Animation
                </Link>
              </li>
              <li>
                <Link to="/plans" className="hover:text-white transition-colors">
                  Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Technical Architecture */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                PostgreSQL 16 + Prisma ORM
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Redis Cache Layer
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                HLS Adaptive Media Delivery
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Idempotent Sandbox Payments
              </li>
            </ul>
          </div>

          {/* Platform Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Platform Status</h4>
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">API Server</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Media CDN</span>
                <span className="text-emerald-400 font-semibold">Ready (HLS)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Sandbox Mode</span>
                <span className="text-amber-400 font-semibold">Enabled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 StreamSphere Inc. All rights reserved. Designed for OTT high-concurrency streaming.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500">v1.0.0-production-ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
