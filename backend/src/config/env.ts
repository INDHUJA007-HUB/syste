import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/streamsphere?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'streamsphere_access_secret_development_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'streamsphere_refresh_secret_development_key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_sandbox_streamsphere_secure_hash_secret_2026',
  cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.streamsphere.net',
  mediaSigningSecret: process.env.MEDIA_STREAM_SIGNING_SECRET || 'media_signature_secret_ott_2026',
};
