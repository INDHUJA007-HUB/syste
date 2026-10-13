import React from 'react';
import { SubscriptionPlan, PlanTier } from '../types';
import { Check, Sparkles, Tv, Monitor, ShieldCheck } from 'lucide-react';

interface PlanCardProps {
  plan: SubscriptionPlan;
  currentTier?: PlanTier;
  onSelect: (plan: SubscriptionPlan) => void;
  isPopular?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentTier,
  onSelect,
  isPopular = false,
}) => {
  const isCurrentPlan = currentTier === plan.tierName;

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
        isPopular
          ? 'glass-panel border-2 border-rose-500/80 shadow-2xl shadow-rose-950/40 transform -translate-y-2'
          : 'glass-panel border border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Most Popular
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-['Outfit']">{plan.name}</h3>
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
              plan.tierName === 'PREMIUM'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : plan.tierName === 'STANDARD'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : plan.tierName === 'BASIC'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {plan.tierName}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>

        {/* Price display */}
        <div className="mt-6 flex items-baseline gap-1">
          {plan.priceCents === 0 ? (
            <span className="text-4xl font-extrabold text-white">Free</span>
          ) : (
            <>
              <span className="text-4xl font-extrabold text-white font-['Outfit']">
                ${(plan.priceCents / 100).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ month</span>
            </>
          )}
        </div>

        {/* Quick specs */}
        <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="block text-[10px] text-slate-400">Resolution</span>
              <span className="font-semibold text-white">{plan.maxResolution}</span>
            </div>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
            <Tv className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="block text-[10px] text-slate-400">Screens</span>
              <span className="font-semibold text-white">{plan.maxScreens} simultaneous</span>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-6 space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Benefits</h4>
          <ul className="space-y-2.5">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 pt-4 border-t border-slate-800/80">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs tracking-wider uppercase cursor-not-allowed border border-slate-700 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Current Active Plan
          </button>
        ) : (
          <button
            onClick={() => onSelect(plan)}
            className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg ${
              isPopular
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 hover:scale-105 active:scale-95'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20'
            }`}
          >
            {plan.priceCents === 0 ? 'Start Free' : 'Choose Plan'}
          </button>
        )}
      </div>
    </div>
  );
};
