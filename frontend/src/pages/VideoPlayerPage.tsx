import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { playbackService } from '../services/playbackService';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Lock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const VideoPlayerPage: React.FC = () => {
  const { id: videoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Player States
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState<{
    requiredTier: string;
    requiredPlanName: string;
  } | null>(null);

  const [, setSessionId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [speedMenuOpen, setSpeedMenuOpen] = useState<boolean>(false);
  const [resumePrompt, setResumePrompt] = useState<number | null>(null);

  const saveCurrentProgress = useCallback((forcedCompleted?: boolean) => {
    if (!videoRef.current || !sessionIdRef.current) return;
    const pos = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    if (dur <= 0 && pos <= 0) return;
    const isComp = forcedCompleted !== undefined ? forcedCompleted : (dur > 0 && pos >= dur * 0.95);
    playbackService.updateProgress(sessionIdRef.current, pos, dur, isComp, Date.now()).catch(() => {});
  }, []);

  // Initialize Playback Session
  useEffect(() => {
    if (!videoId) return;

    if (!user) {
      navigate('/login', { state: { from: { pathname: `/watch/${videoId}` } } });
      return;
    }

    initPlayback();

    return () => {
      saveCurrentProgress();
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoId, user]);

  // Window unload progress persistence
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoRef.current && sessionIdRef.current) {
        const pos = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 0;
        if (pos > 0) {
          const payload = JSON.stringify({
            positionSeconds: pos,
            durationSeconds: dur,
            completed: dur > 0 && pos >= dur * 0.95,
            clientTimestamp: Date.now(),
          });
          const token = localStorage.getItem('streamsphere_access_token');
          fetch(`/api/playback/sessions/${sessionIdRef.current}/progress`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const initPlayback = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setUpgradeRequired(null);

      // 1. Request Playback Authorization from Backend (Section 7)
      const session = await playbackService.createSession(videoId!);
      setSessionId(session.sessionId);
      sessionIdRef.current = session.sessionId;
      setVideoTitle(session.video.title);

      const hlsUrl = session.media.hlsManifestUrl;
      const directUrl = session.media.streamUrl || session.media.directFallbackUrl;

      // Check if resume position exists
      if (session.resumePositionSeconds && session.resumePositionSeconds > 5) {
        setResumePrompt(session.resumePositionSeconds);
      }

      // 2. Setup Video Streaming (HLS or Native HTML5 MP4)
      if (videoRef.current) {
        const videoEl = videoRef.current;

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        if (hlsUrl && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoEl);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (session.resumePositionSeconds && session.resumePositionSeconds > 5) {
              videoEl.currentTime = session.resumePositionSeconds;
            }
            videoEl.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              console.warn('HLS manifest load error, falling back to direct MP4 stream:', data.type);
              hls.destroy();
              hlsRef.current = null;
              videoEl.src = directUrl;
              if (session.resumePositionSeconds && session.resumePositionSeconds > 5) {
                videoEl.currentTime = session.resumePositionSeconds;
              }
              videoEl.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            }
          });
        } else {
          // Native MP4 / Safari HLS
          videoEl.src = directUrl;
          if (session.resumePositionSeconds && session.resumePositionSeconds > 5) {
            videoEl.currentTime = session.resumePositionSeconds;
          }
          videoEl.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }

        // Start heartbeat progress saving every 15 seconds
        startHeartbeat();
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'UPGRADE_REQUIRED') {
        setUpgradeRequired({
          requiredTier: err.response.data.details?.requiredTier || 'PREMIUM',
          requiredPlanName: err.response.data.details?.requiredPlanName || 'Premium Plan',
        });
      } else {
        setErrorMessage(
          err.response?.data?.error || 'Unable to establish authorized video playback stream.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 15-second interval heartbeat saver
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

    heartbeatIntervalRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveCurrentProgress();
      }
    }, 15000);
  };



  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, isFullscreen]);

  // Handle Controls auto-hide on inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setSpeedMenuOpen(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Video Element Handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      saveCurrentProgress();
    }
  };

  const seekDelta = (seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    saveCurrentProgress();
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      saveCurrentProgress();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const setSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setSpeedMenuOpen(false);
    }
  };

  const applyResume = (resumeSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = resumeSec;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    setResumePrompt(null);
  };

  const startOver = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      saveCurrentProgress(false);
    }
    setResumePrompt(null);
  };


  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. Upgrade Required Modal View
  if (upgradeRequired) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full border border-amber-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Content Protection Gate
            </span>
            <h2 className="text-2xl font-black text-white font-['Outfit']">
              Upgrade to {upgradeRequired.requiredTier}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              This high-bitrate title requires a {upgradeRequired.requiredPlanName} subscription. Your current active tier is {user?.entitlement.tierName || 'FREE'}.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/plans"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              View Subscription Plans
            </Link>

            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold"
            >
              Return to Movie Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Playback Failure View
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-rose-500/30 text-center space-y-5">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Playback Authorization Failed</h2>
          <p className="text-xs text-slate-400">{errorMessage}</p>
          <div className="pt-2 flex gap-3 justify-center">
            <button
              onClick={initPlayback}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs"
            >
              Retry Playback
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl glass-panel text-slate-300 text-xs"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen bg-black overflow-hidden select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          saveCurrentProgress();
        }}
        onSeeked={() => saveCurrentProgress()}
        onWaiting={() => setLoading(true)}
        onPlaying={() => {
          setLoading(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setErrorMessage('Video streaming error: Unable to load or decode playable video frames.');
        }}
        onClick={togglePlay}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Prominent Center Play Button Overlay when paused */}
      {!isPlaying && !loading && !errorMessage && !upgradeRequired && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 cursor-pointer group/centerplay transition-all"
        >
          <div className="w-20 h-20 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl shadow-rose-600/60 group-hover/centerplay:scale-110 group-hover/centerplay:bg-rose-600 transition-all">
            <Play className="w-9 h-9 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 pointer-events-none">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Resume Notification Prompt */}
      {resumePrompt && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 glass-panel px-6 py-4 rounded-2xl border border-rose-500/40 shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <p className="text-xs text-slate-300">
              Resume playback from <strong className="text-white">{formatTime(resumePrompt)}</strong>?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyResume(resumePrompt)}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              Resume
            </button>
            <button
              onClick={startOver}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs"
            >
              Start Over
            </button>
          </div>
        </div>
      )}


      {/* Top Overlay: Title & Back Button */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold truncate max-w-xs sm:max-w-md">{videoTitle}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40">
            StreamSphere Secure Stream
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-30 transition-opacity duration-300 space-y-3 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="relative group/scrubber flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleScrub}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600 hover:h-2.5 transition-all"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls: Play, Skips, Volume, Timers */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              onClick={() => seekDelta(-10)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekDelta(10)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
            </div>

            {/* Current Time / Duration */}
            <span className="text-slate-300 text-xs font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Speed, Fullscreen */}
          <div className="flex items-center gap-3 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
              >
                {playbackRate}x
              </button>

              {speedMenuOpen && (
                <div className="absolute right-0 bottom-8 mb-2 glass-panel rounded-xl shadow-2xl py-1 w-24 border border-slate-700 z-50 text-center">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`block w-full py-1 text-xs hover:bg-white/10 ${
                        playbackRate === s ? 'text-rose-400 font-bold' : 'text-slate-200'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
