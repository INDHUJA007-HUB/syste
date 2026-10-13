import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { PlanCard } from '../components/PlanCard';
import { Crown, Check, X, Sparkles, ShieldCheck } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    navigate(`/checkout?plan=${plan.id}&cycle=${billingCycle}`);
  };

  const comparisonFeatures = [
    { feature: 'Catalogue Access', free: 'Free Titles', basic: 'Core Movies', standard: 'Full Library', premium: 'VIP All-Access' },
    { feature: 'Max Streaming Quality', free: '480p SD', basic: '720p HD', standard: '1080p Full HD', premium: '4K Ultra HD + HDR' },
    { feature: 'Simultaneous Streams', free: '1 device', basic: '1 device', standard: '2 devices', premium: '4 devices' },
    { feature: 'Commercial-Free', free: false, basic: true, standard: true, premium: true },
    { feature: 'Spatial Audio / Atmos', free: false, basic: false, standard: false, premium: true },
    { feature: 'Offline Mobile Downloads', free: false, basic: false, standard: true, premium: true },
    { feature: 'Early Access Premieres', free: false, basic: false, standard: false, premium: true },
  ];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20">
            <Crown className="w-4 h-4 text-amber-400" />
            Transparent Subscription Tiers
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-['Outfit'] tracking-tight">
            Select the Perfect StreamSphere Plan
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Upgrade or switch tiers at any time. Enjoy ad-free cinema, multi-screen streaming, and pristine 4K HDR playback.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white glass-panel'
              }`}
            >
              Monthly Billing
            </button>

            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white glass-panel'
              }`}
            >
              Annual Billing
              <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-md">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 rounded-3xl skeleton-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                currentTier={user?.entitlement.tierName}
                onSelect={handleSelectPlan}
                isPopular={p.slug === 'standard'}
              />
            ))}
          </div>
        )}

        {/* In-Depth Feature Comparison Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-['Outfit']">Full Feature Comparison</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-4 font-semibold">Features</th>
                  <th className="py-4 font-semibold">Free</th>
                  <th className="py-4 font-semibold text-emerald-400">Basic</th>
                  <th className="py-4 font-semibold text-indigo-400">Standard</th>
                  <th className="py-4 font-semibold text-amber-400">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-medium text-white">{row.feature}</td>
                    <td className="py-3.5">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="py-3.5">
                      {typeof row.basic === 'boolean' ? (
                        row.basic ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />
                      ) : (
                        row.basic
                      )}
                    </td>
                    <td className="py-3.5">
                      {typeof row.standard === 'boolean' ? (
                        row.standard ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />
                      ) : (
                        row.standard
                      )}
                    </td>
                    <td className="py-3.5">
                      {typeof row.premium === 'boolean' ? (
                        row.premium ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />
                      ) : (
                        <span className="font-semibold text-amber-400">{row.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Secure encrypted payments powered by StreamSphere Sandbox
            </span>
            <span>All fees in USD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
