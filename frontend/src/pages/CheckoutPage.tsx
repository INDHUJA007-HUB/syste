import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Lock,
  ArrowLeft,
  Check,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const planIdParam = searchParams.get('plan');

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);

  // Form states
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('123');
  const [cardName, setCardName] = useState<string>(user?.name || 'Sarah Connor');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // Processing states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout', search: searchParams.toString() } } });
      return;
    }
    loadPlan();
  }, [planIdParam, user]);

  const loadPlan = async () => {
    try {
      setLoadingPlan(true);
      const allPlans = await subscriptionService.getPlans();
      const target = allPlans.find((p) => p.id === planIdParam) || allPlans[2] || allPlans[0];
      setPlan(target);
    } catch (err) {
      console.error('Failed to load plan:', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const autofillCard = (type: 'visa' | 'mastercard' | 'decline') => {
    if (type === 'visa') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/28');
      setCardCvc('424');
      setSimulateFailure(false);
    } else if (type === 'mastercard') {
      setCardNumber('5555 5555 5555 5555');
      setCardExpiry('08/29');
      setCardCvc('555');
      setSimulateFailure(false);
    } else if (type === 'decline') {
      setCardNumber('4000 0000 0000 0002');
      setCardExpiry('05/27');
      setCardCvc('002');
      setSimulateFailure(true);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const result = await subscriptionService.checkout({
        planId: plan.id,
        paymentMethod: cardNumber.startsWith('5') ? 'card_mock_mastercard' : 'card_mock_visa',
        idempotencyKey,
        simulateFailure,
      });

      if (result.success === false) {
        setErrorMessage(result.error || 'Payment declined by mock card issuer.');
      } else {
        setPaymentSuccess(result);
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || 'Payment transaction failed. Please retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPlan || !plan) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          to="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Choose a different plan
        </Link>

        {/* Sandbox Notice Banner */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-300">
                SANDBOX PAYMENT ENVIRONMENT
              </p>
              <p className="text-[11px] text-slate-300">
                Safe development sandbox. No real card charges are made. Use test chips below.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            TEST MODE
          </span>
        </div>

        {/* Success Modal Overlay */}
        {paymentSuccess && (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border-2 border-emerald-500/60 shadow-2xl shadow-emerald-950/40 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Payment Authorized & Verified
              </span>
              <h2 className="text-3xl font-black text-white font-['Outfit']">
                Welcome to {plan.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                {paymentSuccess.message || 'Your subscription is now active. Enjoy high-bitrate streaming across all your devices.'}
              </p>
            </div>

            <div className="max-w-xs mx-auto p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Receipt Transaction:</span>
                <span className="font-mono text-white text-[11px]">
                  {paymentSuccess.payment?.externalTransactionId?.slice(0, 16)}...
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="font-bold text-white">
                  ${((paymentSuccess.payment?.amountCents || plan.priceCents) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Plan Tier:</span>
                <span className="font-bold text-emerald-400">{plan.tierName}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/home')}
                className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                Start Watching Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3.5 rounded-xl glass-panel text-slate-300 hover:text-white font-semibold text-xs"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {!paymentSuccess && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Payment Form */}
            <div className="md:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-white font-['Outfit']">Payment Details</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  256-bit Encrypted
                </div>
              </div>

              {/* Quick Fill Test Cards */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick-Fill Test Cards:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => autofillCard('visa')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono transition-colors"
                  >
                    💳 Visa (Success)
                  </button>
                  <button
                    type="button"
                    onClick={() => autofillCard('mastercard')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono transition-colors"
                  >
                    💳 Mastercard (Success)
                  </button>
                  <button
                    type="button"
                    onClick={() => autofillCard('decline')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono transition-colors"
                  >
                    ⚠️ Card Decline (Test Error)
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">CVC / Security Code</label>
                    <input
                      type="text"
                      required
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Simulate Failure Toggle */}
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                    />
                    <span className="text-xs text-slate-400">
                      Simulate Issuer Decline (test payment failure handling)
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Confirm & Pay ${(plan.priceCents / 100).toFixed(2)}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="md:col-span-5 space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
                <h3 className="text-base font-bold text-white font-['Outfit'] pb-3 border-b border-slate-800">
                  Order Summary
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{plan.name}</span>
                    <span className="font-bold text-white">
                      ${(plan.priceCents / 100).toFixed(2)} / mo
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Resolution</span>
                    <span className="text-slate-200">{plan.maxResolution}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Screens</span>
                    <span className="text-slate-200">{plan.maxScreens} simultaneous</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Key Entitlements:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-white">Total Due Today:</span>
                  <span className="text-2xl font-black text-rose-500 font-['Outfit']">
                    ${(plan.priceCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 space-y-1">
                <p className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Cancel anytime before your next billing cycle.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
