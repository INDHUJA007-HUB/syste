import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { videoService } from '../services/videoService';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';
import { Video, Genre, SubscriptionPlan } from '../types';
import {
  Shield,
  Film,
  Users,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Eye,
  X,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'plans'>('overview');

  // Video Create / Edit Modal
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    posterUrl: '',
    thumbnailUrl: '',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    durationSeconds: 600,
    releaseYear: 2024,
    maturityRating: 'PG-13',
    rating: 8.5,
    minimumPlanTier: 'FREE',
    director: '',
    cast: '',
    genreIds: [] as string[],
  });

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user]);


  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsData, videosData, genresData, plansData] = await Promise.all([
        adminService.getAnalytics(),
        videoService.getVideos({ limit: 50 }),
        videoService.getGenres(),
        subscriptionService.getPlans(),
      ]);
      setAnalytics(analyticsData);
      setVideos(videosData.videos);
      setGenres(genresData);
      setPlans(plansData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingVideoId(null);
    setVideoForm({
      title: '',
      description: '',
      posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      durationSeconds: 600,

      releaseYear: 2024,
      maturityRating: 'PG-13',
      rating: 8.5,
      minimumPlanTier: 'FREE',
      director: 'Christopher Nolan',
      cast: 'Cillian Murphy, Emily Blunt',
      genreIds: genres.length > 0 ? [genres[0].id] : [],
    });
    setVideoModalOpen(true);
  };

  const handleOpenEditModal = (video: Video) => {
    setEditingVideoId(video.id);
    setVideoForm({
      title: video.title,
      description: video.description,
      posterUrl: video.posterUrl,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: (video as any).videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      durationSeconds: video.durationSeconds,
      releaseYear: video.releaseYear,
      maturityRating: video.maturityRating,
      rating: video.rating ?? 8.5,
      minimumPlanTier: video.minimumPlanTier,
      director: video.director || '',
      cast: video.cast || '',
      genreIds: video.genres.map((g) => g.id),
    });
    setVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVideoId) {
        await adminService.updateVideo(editingVideoId, videoForm);
      } else {
        await adminService.createVideo(videoForm);
      }
      setVideoModalOpen(false);
      loadAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save video');
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await adminService.deleteVideo(id);
      loadAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete video');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full border border-rose-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Authentication Required
            </span>
            <h2 className="text-2xl font-black text-white font-['Outfit']">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Please sign in with administrator credentials to access the StreamSphere console.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-rose-600/30 transition-all"
            >
              Sign In as Admin
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full border border-rose-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              HTTP 403 Forbidden
            </span>
            <h2 className="text-2xl font-black text-white font-['Outfit']">
              Access Denied
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are signed in as <strong>{user.name}</strong> ({user.email}) with subscriber role <code className="text-amber-400 font-mono px-1.5 py-0.5 bg-black/50 rounded">{user.role}</code>. Administrator privileges are required to access this management console.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-rose-600/30 transition-all"
            >
              Return to Subscriber Dashboard
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-black text-white font-['Outfit']">Administrator Console</h1>
            </div>
            <p className="text-xs text-slate-400">
              Manage video catalogue, monitor subscriptions, and inspect real revenue metrics.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Catalogue Title
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              activeTab === 'videos'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Video Catalogue ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              activeTab === 'plans'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Subscription Plans ({plans.length})
          </button>
        </div>

        {/* TAB 1: Overview & Metrics */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Total Accounts</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-3xl font-black text-white font-['Outfit']">
                  {analytics.stats.totalUsers}
                </p>
                <span className="text-[11px] text-emerald-400">Registered platform users</span>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Active Subscriptions</span>
                  <CreditCard className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-3xl font-black text-white font-['Outfit']">
                  {analytics.stats.activeSubscriptions}
                </p>
                <span className="text-[11px] text-amber-400">Recurring subscribers</span>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Catalogue Items</span>
                  <Film className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-3xl font-black text-white font-['Outfit']">
                  {analytics.stats.totalVideos}
                </p>
                <span className="text-[11px] text-cyan-400">Titles published</span>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Platform Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-3xl font-black text-white font-['Outfit']">
                  {analytics.stats.totalRevenueFormatted}
                </p>
                <span className="text-[11px] text-emerald-400">Settled transactions</span>
              </div>
            </div>

            {/* Plan Breakdown & Top Streamed Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Distribution */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  Subscriptions Distribution
                </h3>
                <div className="space-y-3 text-xs">
                  {Object.entries(analytics.subscriptionsByPlan || {}).map(([planName, count]: any) => (
                    <div key={planName} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>{planName}</span>
                        <span className="font-bold text-white">{count} users</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, (count / (analytics.stats.activeSubscriptions || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Streamed Titles */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  Top Viewed Titles
                </h3>
                <div className="space-y-3">
                  {analytics.topVideos.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <img src={v.posterUrl} alt={v.title} className="w-8 h-11 object-cover rounded-md" />
                        <div>
                          <p className="font-semibold text-white">{v.title}</p>
                          <span className="text-[10px] text-slate-400">{v.minimumPlanTier} Tier</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-400 flex items-center gap-1 justify-end">
                          <Eye className="w-3.5 h-3.5" />
                          {v.viewCount.toLocaleString()} views
                        </span>
                        <span className="text-[10px] text-amber-400">⭐ {v.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Payments Log */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Recent Payment Audit Trail
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-3 font-semibold">User</th>
                      <th className="py-3 font-semibold">Plan</th>
                      <th className="py-3 font-semibold">Amount</th>
                      <th className="py-3 font-semibold">Date</th>
                      <th className="py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {analytics.recentPayments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-3 font-medium text-white">
                          {p.user} <span className="text-slate-500 text-[11px]">({p.email})</span>
                        </td>
                        <td className="py-3">{p.planName}</td>
                        <td className="py-3 font-bold text-white">{p.amountFormatted}</td>
                        <td className="py-3">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase border border-emerald-500/30">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Video Catalogue Management */}
        {activeTab === 'videos' && (
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <th className="py-3 font-semibold">Poster</th>
                    <th className="py-3 font-semibold">Title</th>
                    <th className="py-3 font-semibold">Tier</th>
                    <th className="py-3 font-semibold">Year</th>
                    <th className="py-3 font-semibold">Rating</th>
                    <th className="py-3 font-semibold">Duration</th>
                    <th className="py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {videos.map((v) => (
                    <tr key={v.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5">
                        <img src={v.posterUrl} alt={v.title} className="w-9 h-12 object-cover rounded-md" />
                      </td>
                      <td className="py-2.5 font-semibold text-white">{v.title}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                          {v.minimumPlanTier}
                        </span>
                      </td>
                      <td className="py-2.5">{v.releaseYear}</td>
                      <td className="py-2.5 text-amber-400 font-semibold">⭐ {v.rating}</td>
                      <td className="py-2.5">{Math.floor(v.durationSeconds / 60)} mins</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(v)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                            title="Edit Title"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(v.id, v.title)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Title"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Subscription Plans Management */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div key={p.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    ACTIVE
                  </span>
                </div>
                <p className="text-2xl font-black text-white font-['Outfit']">
                  ${(p.priceCents / 100).toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal"> / mo</span>
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Resolution: <strong className="text-white">{p.maxResolution}</strong></p>
                  <p>Screens: <strong className="text-white">{p.maxScreens} simultaneous</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Create / Edit Modal */}
        {videoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-xl w-full border border-slate-700 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  {editingVideoId ? 'Edit Video Metadata' : 'Add New Catalogue Movie'}
                </h3>
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVideo} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={videoForm.title}
                    onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Synopsis / Description</label>
                  <textarea
                    rows={3}
                    required
                    value={videoForm.description}
                    onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Poster URL</label>
                    <input
                      type="url"
                      required
                      value={videoForm.posterUrl}
                      onChange={(e) => setVideoForm({ ...videoForm, posterUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Thumbnail URL</label>
                    <input
                      type="url"
                      required
                      value={videoForm.thumbnailUrl}
                      onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Streaming Video Source URL (MP4 / HLS)</label>
                  <input
                    type="url"
                    required
                    value={videoForm.videoUrl}
                    onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      required
                      value={videoForm.durationSeconds}
                      onChange={(e) => setVideoForm({ ...videoForm, durationSeconds: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Release Year</label>
                    <input
                      type="number"
                      required
                      value={videoForm.releaseYear}
                      onChange={(e) => setVideoForm({ ...videoForm, releaseYear: parseInt(e.target.value, 10) || 2024 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Minimum Plan Tier</label>
                    <select
                      value={videoForm.minimumPlanTier}
                      onChange={(e) => setVideoForm({ ...videoForm, minimumPlanTier: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="FREE">FREE</option>
                      <option value="BASIC">BASIC</option>
                      <option value="STANDARD">STANDARD</option>
                      <option value="PREMIUM">PREMIUM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Director</label>
                    <input
                      type="text"
                      value={videoForm.director}
                      onChange={(e) => setVideoForm({ ...videoForm, director: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Cast</label>
                    <input
                      type="text"
                      value={videoForm.cast}
                      onChange={(e) => setVideoForm({ ...videoForm, cast: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setVideoModalOpen(false)}
                    className="px-4 py-2 rounded-xl glass-panel text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
                  >
                    Save Title
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
