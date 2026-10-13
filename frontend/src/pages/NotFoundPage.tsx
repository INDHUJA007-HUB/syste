import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4 text-center">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl max-w-md w-full border border-slate-800 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-500 mx-auto flex items-center justify-center">
          <Film className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-4xl sm:text-6xl font-black text-rose-500 font-['Outfit']">404</span>
          <h1 className="text-xl font-bold text-white">Title or Page Not Found</h1>
          <p className="text-xs text-slate-400">
            The screen you are looking for has been moved or does not exist in the StreamSphere catalogue.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/30"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
