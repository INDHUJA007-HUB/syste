import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { videoService } from '../services/videoService';
import { subscriptionService } from '../services/subscriptionService';
import { Video, SubscriptionPlan } from '../types';
import { VideoCarousel } from '../components/VideoCarousel';
import { PlanCard } from '../components/PlanCard';
import {
  Play,
  Film,
  Tv,
  Download,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    videoService.getVideos({ limit: 12, sortBy: 'trending' }).then((data) => {
      setTrendingVideos(data.videos);
    });
    subscriptionService.getPlans().then((data) => {
      setPlans(data);
    });
  }, []);

  const faqs = [
    {
      q: 'What is StreamSphere?',
      a: 'StreamSphere is a high-performance OTT video streaming platform offering adaptive bitrate HLS delivery, pristine 4K HDR playback, and transparent subscription tiers ranging from Free to VIP Premium.',
    },
    {
      q: 'Can I watch movies for free?',
      a: 'Yes! StreamSphere includes a permanent Free tier with access to our foundational catalogue in 480p with zero credit card required.',
    },
    {
      q: 'How does the payment sandbox work?',
      a: 'Our sandbox environment simulates real payment gateway authorization. You can test instant activations, simulated card declines, and tokenized checkouts using safe test card numbers.',
    },
    {
      q: 'Can I cancel or change my plan anytime?',
      a: 'Absolutely. Subscriptions are billed on a flexible monthly cycle. If you cancel, you retain full access through the end of your paid billing period.',
    },
    {
      q: 'What video quality formats are supported?',
      a: 'We support adaptive bitrate HLS streaming from 480p up to 4K Ultra HD (2160p) with stereo and 5.1 surround sound audio.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100">
      {/* 1. Cinematic Hero Banner */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Backdrop with Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80"
            alt="Cinematic background"
            className="w-full h-full object-cover object-center filter brightness-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/70 to-[#0a0d14]/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0d14]/40 to-[#0a0d14]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-rose-400 text-xs font-semibold shadow-lg border border-rose-500/20 animate-pulse">
            <Film className="w-4 h-4" />
            Next-Generation OTT Streaming Experience
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-['Outfit'] leading-tight">
            Infinite Stories. <br />
            <span className="bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Zero Compromise.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Stream award-winning cinema, high-octane sci-fi, and exclusive indie features in 4K HDR. Enjoy seamless playback resumption across all your devices.
          </p>

          {/* Call to Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm tracking-wide shadow-2xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Watching Free
            </Link>

            <Link
              to="/catalogue"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-white/10 text-white font-bold text-sm tracking-wide border border-white/15 transition-all flex items-center justify-center gap-2"
            >
              Browse Full Catalogue
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              No ads on paid tiers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Instant 4K streaming
            </span>
          </div>
        </div>
      </section>

      {/* 2. Trending Teaser Carousel */}
      <section className="relative z-10 -mt-10 mb-12">
        <VideoCarousel
          title="🔥 Trending Right Now on StreamSphere"
          videos={trendingVideos}
          seeAllLink="/catalogue"
        />
      </section>

      {/* 3. Platform Key Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit']">
            Engineered for Pure Cinema
          </h2>
          <p className="text-sm text-slate-400">
            Every frame optimized with modern media architecture and adaptive bitrate delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Adaptive HLS Bitrate</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically scales stream resolution from 480p to 4K to eliminate buffering on all connections.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Play className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Instant Resume</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continue watching from your exact second on any browser or device with server-synced heartbeat progress.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Signed Media Tokens</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Short-lived HMAC tokens guarantee private media stream authorization and prevent link scrapers.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Device Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stream on up to 4 concurrent screens with personalized family profiles and individual watchlists.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Subscription Plans Preview */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit']">
            Choose Your Entertainment Tier
          </h2>
          <p className="text-sm text-slate-400">
            No hidden fees. Switch plans anytime or test safely with our sandbox checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              onSelect={(plan) => navigate(`/checkout?plan=${plan.id}`)}
              isPopular={p.slug === 'standard'}
            />
          ))}
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-rose-400 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-rose-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Ready to Stream CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-rose-950/60 via-purple-950/60 to-indigo-950/60 border border-rose-500/30 p-8 sm:p-14 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black text-white font-['Outfit']">
            Ready to Dive into the Sphere?
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300">
            Create an account in less than 30 seconds and start enjoying top-rated cinema and sci-fi originals today.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
