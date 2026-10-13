import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import { playbackService } from '../services/playbackService';
import { subscriptionService } from '../services/subscriptionService';
import { authService } from '../services/authService';
import { ContinueWatchingItem, PaymentRecord } from '../types';
import { VideoCard } from '../components/VideoCard';
import {
  Crown,
  Bookmark,
  Play,
  Receipt,
  ShieldCheck,
  AlertCircle,
  Edit2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { watchlist, refreshWatchlist } = useWatchlist();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'watchlist' | 'continue' | 'billing'>('profile');
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [, setLoading] = useState<boolean>(true);

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEditName(user.name);
    setEditAvatar(user.avatarUrl || '');
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [cw, pay] = await Promise.all([
        playbackService.getContinueWatching(),
        subscriptionService.getPayments(),
        refreshWatchlist(),
      ]);
      setContinueWatching(cw);
      setPayments(pay);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateProfile({ name: editName, avatarUrl: editAvatar });
      await refreshUser();
      setEditingProfile(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.subscription?.id) return;
    try {
      const res = await subscriptionService.cancelSubscription(user.subscription.id);
      setCancelMessage(res.message);
      await refreshUser();
      setTimeout(() => {
        setCancelModalOpen(false);
        setCancelMessage(null);
      }, 3500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel subscription.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Profile Summary */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-xl"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">{user.name}</h1>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    user.entitlement.tierName === 'PREMIUM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : user.entitlement.tierName === 'STANDARD'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : user.entitlement.tierName === 'BASIC'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {user.entitlement.tierName} Member
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
              <p className="text-[11px] text-slate-500">
                Joined StreamSphere on {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingProfile(true)}
              className="px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <Link
              to="/plans"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              Manage Plan
            </Link>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-700 space-y-4">
              <h3 className="text-lg font-bold text-white">Update Profile</h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 rounded-xl glass-panel text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full border border-rose-500/40 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">Cancel Subscription?</h3>
              {cancelMessage ? (
                <p className="text-xs text-emerald-400">{cancelMessage}</p>
              ) : (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If you cancel, you will retain full access to all your plan titles until your current billing period ends on{' '}
                    <strong>
                      {user.subscription
                        ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                        : 'end of cycle'}
                    </strong>
                    . You will not be charged again.
                  </p>
                  <div className="flex justify-center gap-3 pt-3">
                    <button
                      onClick={() => setCancelModalOpen(false)}
                      className="px-5 py-2 rounded-xl glass-panel text-slate-300 text-xs"
                    >
                      Keep Subscription
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'profile'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Crown className="w-4 h-4" />
            Subscription & Membership
          </button>

          <button
            onClick={() => setActiveTab('continue')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'continue'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Play className="w-4 h-4" />
            Continue Watching ({continueWatching.length})
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'watchlist'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            My Watchlist ({watchlist.length})
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'billing'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Billing & Receipts
          </button>
        </div>

        {/* TAB 1: Subscription & Membership */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white font-['Outfit']">Active Membership</h3>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Active Status
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Plan</span>
                  <p className="text-2xl font-black text-white font-['Outfit']">
                    {user.subscription?.planName || 'StreamSphere Free'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Maximum Quality</span>
                    <span className="font-bold text-white">{user.entitlement.maxResolution}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Concurrent Screens</span>
                    <span className="font-bold text-white">{user.entitlement.maxScreens} simultaneous</span>
                  </div>
                </div>

                {user.subscription && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Current Period Renews:</span>
                    <span className="font-semibold text-white">
                      {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/plans"
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider text-center shadow-lg shadow-rose-600/30"
                >
                  Switch Plan
                </Link>

                {user.subscription && user.subscription.planName !== 'StreamSphere Free' && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="py-3 px-4 rounded-xl glass-panel hover:bg-rose-500/10 text-rose-400 font-semibold text-xs border border-rose-500/20"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <h3 className="text-base font-bold text-white font-['Outfit'] pb-3 border-b border-slate-800">
                Viewing Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <Bookmark className="w-5 h-5 text-indigo-400 mx-auto" />
                  <span className="text-2xl font-black text-white">{watchlist.length}</span>
                  <span className="text-xs text-slate-400 block">Watchlist Titles</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <Play className="w-5 h-5 text-rose-500 mx-auto" />
                  <span className="text-2xl font-black text-white">{continueWatching.length}</span>
                  <span className="text-xs text-slate-400 block">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Continue Watching */}
        {activeTab === 'continue' && (
          <div>
            {continueWatching.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {continueWatching.map((item) => (
                  <VideoCard
                    key={item.id}
                    video={item.video}
                    progressPercent={item.percentWatched}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto space-y-3">
                <Play className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No active videos in progress</h4>
                <p className="text-xs text-slate-400">
                  When you pause a movie or series, it will appear here so you can resume immediately.
                </p>
                <Link
                  to="/catalogue"
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs"
                >
                  Explore Catalogue
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: My Watchlist */}
        {activeTab === 'watchlist' && (
          <div>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {watchlist.map((item) => (
                  <VideoCard
                    key={item.id}
                    video={item.video}
                    onWatchlistToggle={() => loadDashboardData()}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto space-y-3">
                <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Your watchlist is empty</h4>
                <p className="text-xs text-slate-400">
                  Save movies to your personal list by clicking the bookmark button on any title.
                </p>
                <Link
                  to="/catalogue"
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs"
                >
                  Discover Movies
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Billing & Receipts */}
        {activeTab === 'billing' && (
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-white font-['Outfit'] pb-3 border-b border-slate-800">
              Payment & Invoicing History
            </h3>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-3 font-semibold">Transaction Date</th>
                      <th className="py-3 font-semibold">Plan Description</th>
                      <th className="py-3 font-semibold">Amount</th>
                      <th className="py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3.5 font-medium">{new Date(p.date || (p as any).createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 text-white">{p.subscription?.plan?.name || 'Subscription Activation'}</td>
                        <td className="py-3.5 font-bold text-white">{p.amountFormatted || `$${((p.amountCents || 0) / 100).toFixed(2)}`}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
