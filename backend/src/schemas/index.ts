import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const checkoutSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  paymentMethod: z.string().default('card_mock_visa'),
  idempotencyKey: z.string().min(8, 'Idempotency key required for safe transaction').optional(),
  simulateFailure: z.boolean().optional().default(false),
});

export const playbackSessionSchema = z.object({
  videoId: z.string().uuid('Invalid video ID'),
});

export const playbackProgressSchema = z.object({
  positionSeconds: z.number().min(0, 'Position must be non-negative'),
  durationSeconds: z.number().min(0, 'Duration must be non-negative'),
  completed: z.boolean().optional(),
  clientTimestamp: z.number().optional(),
});


export const videoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  genre: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  tier: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['FREE', 'BASIC', 'STANDARD', 'PREMIUM']).optional()
  ),
  sortBy: z.enum(['trending', 'rating', 'year', 'views', 'newest']).default('trending'),
});

export const createVideoSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  posterUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  trailerUrl: z.string().url().optional(),
  videoUrl: z.string().url(),
  hlsManifestUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive(),
  releaseYear: z.number().int().min(1900).max(2100),
  maturityRating: z.string().default('PG-13'),
  rating: z.number().min(0).max(10).default(8.5),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  minimumPlanTier: z.enum(['FREE', 'BASIC', 'STANDARD', 'PREMIUM']).default('FREE'),
  director: z.string().optional(),
  cast: z.string().optional(),
  genreIds: z.array(z.string().uuid()).default([]),
});

export const updateVideoSchema = createVideoSchema.partial();

export const planManagementSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default('USD'),
  maxResolution: z.string(),
  maxScreens: z.number().int().positive(),
  features: z.array(z.string()).or(z.string()),
  isActive: z.boolean().default(true),
});
