export type PlanTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string;
  subscription: {
    id: string;
    planId: string;
    planName: string;
    tierName: PlanTier;
    tierLevel: number;
    maxResolution: string;
    maxScreens: number;
    status: SubscriptionStatus;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  entitlement: {
    tierName: PlanTier;
    tierLevel: number;
    maxResolution: string;
    maxScreens: number;
  };
  stats?: {
    watchlistCount: number;
    continueWatchingCount: number;
  };
  createdAt: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  videoCount?: number;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string;
  thumbnailUrl: string;
  trailerUrl?: string;
  durationSeconds: number;
  releaseYear: number;
  maturityRating: string;
  rating: number | null;
  isFeatured: boolean;
  isTrending: boolean;
  viewCount?: number;
  minimumPlanTier: PlanTier;
  director?: string;
  cast?: string;
  genres: { id: string; name: string; slug: string }[];
  inWatchlist?: boolean;
  playbackProgress?: {
    positionSeconds: number;
    durationSeconds: number;
    completed: boolean;
  } | null;
  availableQualities?: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  billingInterval: 'MONTHLY' | 'YEARLY';
  maxResolution: string;
  maxScreens: number;
  tierLevel: number;
  tierName: PlanTier;
  features: string[];
}

export interface PlaybackSessionResponse {
  sessionId: string;
  sessionToken: string;
  expiresAt: string;
  video: {
    id: string;
    title: string;
    durationSeconds: number;
    posterUrl: string;
  };
  media: {
    streamUrl: string;
    hlsManifestUrl?: string;
    directFallbackUrl: string;
    signedToken: string;
    maxResolution: string;
  };
  resumePositionSeconds: number;
}

export interface ContinueWatchingItem {
  id: string;
  positionSeconds: number;
  durationSeconds: number;
  percentWatched: number;
  lastWatchedAt: string;
  video: Video;
}

export interface WatchlistItem {
  id: string;
  addedAt: string;
  video: Video;
}

export interface PaymentRecord {
  id: string;
  user?: string;
  email?: string;
  amountFormatted: string;
  amountCents?: number;
  status: PaymentStatus;
  planName: string;
  date: string;
  subscription?: {
    plan: {
      name: string;
    };
  };
}
