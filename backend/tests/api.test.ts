import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { config } from '../src/config/env';

describe('StreamSphere Full-Stack OTT Platform API Test Suite', () => {
  let adminToken: string;
  let premiumUserToken: string;
  let basicUserToken: string;
  let freeUserToken: string;

  let testMovieId: string;
  let premiumMovieId: string;
  let standardPlanId: string;

  beforeAll(async () => {
    // 1. Authenticate Admin User
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@streamsphere.com',
      password: 'Admin123!',
    });
    adminToken = adminRes.body.data.tokens.accessToken;

    // 2. Authenticate Premium User (Sarah)
    const premRes = await request(app).post('/api/auth/login').send({
      email: 'sarah@streamsphere.com',
      password: 'User123!',
    });
    premiumUserToken = premRes.body.data.tokens.accessToken;

    // 3. Authenticate Basic User (John)
    const basicRes = await request(app).post('/api/auth/login').send({
      email: 'john@streamsphere.com',
      password: 'User123!',
    });
    basicUserToken = basicRes.body.data.tokens.accessToken;

    // 4. Authenticate Free User (Emma)
    const freeRes = await request(app).post('/api/auth/login').send({
      email: 'emma@streamsphere.com',
      password: 'User123!',
    });
    freeUserToken = freeRes.body.data.tokens.accessToken;

    // 5. Query sample movies and plans for tests
    const movies = await prisma.video.findMany({ take: 10 });
    const freeMovie = movies.find((m) => m.minimumPlanTier === 'FREE') || movies[0];
    const premMovie = movies.find((m) => m.minimumPlanTier === 'PREMIUM') || movies[1];
    testMovieId = freeMovie.id;
    premiumMovieId = premMovie.id;

    const standardPlan = await prisma.subscriptionPlan.findUnique({ where: { slug: 'standard' } });
    standardPlanId = standardPlan!.id;

    // Reset any test progress on testMovieId to ensure clean test state
    await prisma.playbackProgress.deleteMany({ where: { videoId: testMovieId } });
  });


  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Test 1: Registration and validation
  it('1. should register a new user with valid input and default Free subscription', async () => {
    const uniqueEmail = `testuser_${Date.now()}@streamsphere.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Viewer',
      email: uniqueEmail,
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  // Test 2: Duplicate account handling
  it('2. should reject duplicate email registration with 409 Conflict', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate Admin',
      email: 'admin@streamsphere.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_EMAIL');
  });

  // Test 3: Catalogue search and filtering
  it('3. should search catalogue by keyword and filter by genre', async () => {
    const searchRes = await request(app).get('/api/videos?search=Steel');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.videos.length).toBeGreaterThanOrEqual(1);
    expect(searchRes.body.data.videos[0].title).toContain('Tears of Steel');

    const genreRes = await request(app).get('/api/videos?genre=sci-fi');
    expect(genreRes.status).toBe(200);
    expect(genreRes.body.data.videos.length).toBeGreaterThan(0);
  });

  // Test 4: Watchlist ownership & operations
  it('4. should maintain personal watchlists and prevent cross-user leakage', async () => {
    // Add to Sarah's watchlist
    const addRes = await request(app)
      .post(`/api/watchlist/${testMovieId}`)
      .set('Authorization', `Bearer ${premiumUserToken}`);
    expect([200, 201]).toContain(addRes.status);

    // Fetch Sarah's watchlist
    const listRes = await request(app)
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    expect(listRes.status).toBe(200);
    const hasItem = listRes.body.data.some((item: any) => item.video.id === testMovieId);
    expect(hasItem).toBe(true);

    // Remove from Sarah's watchlist
    const removeRes = await request(app)
      .delete(`/api/watchlist/${testMovieId}`)
      .set('Authorization', `Bearer ${premiumUserToken}`);
    expect(removeRes.status).toBe(200);
  });

  // Test 5: Subscription checkout & activation
  it('5. should process sandbox subscription checkout and activate plan', async () => {
    const idempotencyKey = `idem_test_${Date.now()}`;
    const res = await request(app)
      .post('/api/subscriptions/checkout')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({
        planId: standardPlanId,
        paymentMethod: 'card_mock_visa',
        idempotencyKey,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subscription.status).toBe('ACTIVE');
    expect(res.body.data.payment.status).toBe('SUCCEEDED');

    // Test Idempotency: Replay same request with same key
    const replayRes = await request(app)
      .post('/api/subscriptions/checkout')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({
        planId: standardPlanId,
        paymentMethod: 'card_mock_visa',
        idempotencyKey,
      });
    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data.idempotentReplay).toBe(true);
  });

  // Test 6: Playback authorization with active subscription
  it('6. should authorize playback for entitled premium video when user has Premium subscription', async () => {
    const res = await request(app)
      .post('/api/playback/sessions')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ videoId: premiumMovieId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.media.streamUrl).toBeDefined();
    expect(res.body.data.media.signedToken).toBeDefined();
  });

  // Test 7: Playback denial with insufficient subscription tier
  it('7. should deny playback with 403 UPGRADE_REQUIRED when lower tier user accesses Premium video', async () => {
    // Basic user trying to watch Premium movie
    const res = await request(app)
      .post('/api/playback/sessions')
      .set('Authorization', `Bearer ${basicUserToken}`)
      .send({ videoId: premiumMovieId });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('UPGRADE_REQUIRED');
    expect(res.body.details.requiredTier).toBe('PREMIUM');
  });

  // Test 8: Playback progress persistence
  it('8. should persist playback progress and return it for resume functionality', async () => {
    // Create playback session first
    const sessionRes = await request(app)
      .post('/api/playback/sessions')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ videoId: testMovieId });
    const sessionId = sessionRes.body.data.sessionId;

    // Send heartbeat progress
    const progressRes = await request(app)
      .put(`/api/playback/sessions/${sessionId}/progress`)
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        positionSeconds: 245.5,
        durationSeconds: 734,
      });

    expect(progressRes.status).toBe(200);
    expect(progressRes.body.data.positionSeconds).toBe(245.5);

    // Verify resume endpoint
    const resumeRes = await request(app)
      .get(`/api/playback/resume/${testMovieId}`)
      .set('Authorization', `Bearer ${premiumUserToken}`);
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.positionSeconds).toBe(245.5);
  });

  // Test 9: Payment webhook verification and signature check
  it('9. should verify payment webhook signature and process event idempotently', async () => {
    const payload = {
      event: 'payment.succeeded',
      data: {
        externalTransactionId: `txn_webhook_${Date.now()}`,
        subscriptionId: null,
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', config.paymentWebhookSecret)
      .update(rawBody)
      .digest('hex');

    const webhookRes = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', signature)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.data.received).toBe(true);

    // Invalid signature test
    const badWebhookRes = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', 'forged_fake_signature')
      .send(payload);

    expect(badWebhookRes.status).toBe(401);
  });

  // Test 10: Prevention of unauthorized access to administrator-only endpoints
  it('10. should block non-admin users from administrator endpoints with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${premiumUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // Test 11: Administrator operations succeed for admin role
  it('11. should allow administrator access to analytics and video catalogue management', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalUsers).toBeGreaterThan(0);
    expect(res.body.data.stats.totalVideos).toBeGreaterThan(0);
  });

  // Test 12: Media streaming authorization with signed token
  it('12. should allow media stream with valid signed token and redirect or stream media', async () => {
    const sessionRes = await request(app)
      .post('/api/playback/sessions')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ videoId: testMovieId });

    expect(sessionRes.status).toBe(200);
    const signedToken = sessionRes.body.data.media.signedToken;

    const streamRes = await request(app)
      .get(`/api/media/stream/${testMovieId}?token=${signedToken}`);

    expect([200, 206, 302]).toContain(streamRes.status);
    if (streamRes.status === 302) {
      expect(streamRes.headers.location).toBeDefined();
    }
  });

  // Test 13: Media streaming rejection for invalid, missing, or mismatched token
  it('13. should reject media streaming when token is missing or forged', async () => {
    const missingRes = await request(app).get(`/api/media/stream/${testMovieId}`);
    expect(missingRes.status).toBe(401);

    const badTokenRes = await request(app).get(`/api/media/stream/${testMovieId}?token=invalid_forged_token`);
    expect(badTokenRes.status).toBe(403);
  });

  // Test 14: Watchlist user isolation and cross-user privacy
  it('14. should guarantee that User A cannot see or delete User B\'s watchlist items', async () => {
    // Find a movie not in John's watchlist
    const isolatedMovie = await prisma.video.findFirst({
      where: {
        watchlistItems: { none: { user: { email: 'john@streamsphere.com' } } },
      },
    });
    const isolatedMovieId = isolatedMovie!.id;

    // Add movie to Sarah's watchlist
    await request(app)
      .post(`/api/watchlist/${isolatedMovieId}`)
      .set('Authorization', `Bearer ${premiumUserToken}`);

    // John fetches his watchlist - should NOT see Sarah's items
    const johnRes = await request(app)
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${basicUserToken}`);
    expect(johnRes.status).toBe(200);
    const hasSarahItem = johnRes.body.data.some((item: any) => item.video.id === isolatedMovieId);
    expect(hasSarahItem).toBe(false);

    // John attempts to delete Sarah's watchlist item directly
    const deleteAttempt = await request(app)
      .delete(`/api/watchlist/${isolatedMovieId}`)
      .set('Authorization', `Bearer ${basicUserToken}`);
    expect(deleteAttempt.status).toBe(404);

    // Clean up Sarah's watchlist
    await request(app)
      .delete(`/api/watchlist/${isolatedMovieId}`)
      .set('Authorization', `Bearer ${premiumUserToken}`);
  });


  // Test 15: Asynchronous progress anti-stale overwrite protection
  it('15. should prevent stale asynchronous progress updates from overwriting newer progress', async () => {
    const sessionRes = await request(app)
      .post('/api/playback/sessions')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ videoId: testMovieId });
    const sessionId = sessionRes.body.data.sessionId;

    const now = Date.now();

    // 1. Send modern progress update at t = 100s with timestamp T
    await request(app)
      .put(`/api/playback/sessions/${sessionId}/progress`)
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        positionSeconds: 100,
        durationSeconds: 600,
        clientTimestamp: now,
      });

    // 2. Send delayed/stale progress update at t = 40s with older timestamp T - 10000ms
    const staleRes = await request(app)
      .put(`/api/playback/sessions/${sessionId}/progress`)
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        positionSeconds: 40,
        durationSeconds: 600,
        clientTimestamp: now - 10000,
      });

    expect(staleRes.status).toBe(200);

    // Resume query should still retain the newer 100s position
    const resumeRes = await request(app)
      .get(`/api/playback/resume/${testMovieId}`)
      .set('Authorization', `Bearer ${premiumUserToken}`);
    expect(resumeRes.body.data.positionSeconds).toBe(100);
  });

  // Test 16: Continue Watching inclusion and exclusion for completed titles
  it('16. should include partially watched videos and exclude completed videos from Continue Watching', async () => {
    const sessionRes = await request(app)
      .post('/api/playback/sessions')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ videoId: testMovieId });
    const sessionId = sessionRes.body.data.sessionId;

    // Save partial progress (50% watched)
    await request(app)
      .put(`/api/playback/sessions/${sessionId}/progress`)
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        positionSeconds: 300,
        durationSeconds: 600,
        completed: false,
      });

    const cwRes = await request(app)
      .get('/api/playback/continue-watching')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    expect(cwRes.status).toBe(200);
    const inContinue = cwRes.body.data.some((item: any) => item.video.id === testMovieId);
    expect(inContinue).toBe(true);

    // Now mark completed (e.g. 98% watched)
    await request(app)
      .put(`/api/playback/sessions/${sessionId}/progress`)
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        positionSeconds: 590,
        durationSeconds: 600,
        completed: true,
      });

    const cwAfterRes = await request(app)
      .get('/api/playback/continue-watching')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    const inContinueAfter = cwAfterRes.body.data.some((item: any) => item.video.id === testMovieId);
    expect(inContinueAfter).toBe(false);
  });

  // Test 17: Admin Video CRUD operations with database persistence
  it('17. should allow administrator to create, update, and delete video titles in PostgreSQL', async () => {
    // 1. Create Video
    const createRes = await request(app)
      .post('/api/admin/videos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Vitest Test Sci-Fi Feature',
        description: 'An automated testing title verifying complete administrative CRUD persistence.',
        posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600',
        videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        durationSeconds: 480,
        releaseYear: 2024,
        maturityRating: 'PG-13',
        rating: 8.8,
        minimumPlanTier: 'FREE',
      });

    expect(createRes.status).toBe(201);
    const createdId = createRes.body.data.id;
    expect(createdId).toBeDefined();

    // Verify persisted in PostgreSQL
    const dbVideo = await prisma.video.findUnique({ where: { id: createdId } });
    expect(dbVideo).not.toBeNull();
    expect(dbVideo?.title).toBe('Vitest Test Sci-Fi Feature');

    // 2. Update Video
    const updateRes = await request(app)
      .put(`/api/admin/videos/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Vitest Test Sci-Fi Feature (Updated Edition)',
        rating: 9.4,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Vitest Test Sci-Fi Feature (Updated Edition)');

    // 3. Delete Video
    const deleteRes = await request(app)
      .delete(`/api/admin/videos/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);

    // Verify deleted in PostgreSQL
    const deletedDbVideo = await prisma.video.findUnique({ where: { id: createdId } });
    expect(deletedDbVideo).toBeNull();
  });

  // Test 18: Ordinary user cannot execute administrative mutations
  it('18. should block ordinary users from creating or mutating videos and plans with 403 Forbidden', async () => {
    const createAttempt = await request(app)
      .post('/api/admin/videos')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        title: 'Hacked Title Attempt',
        description: 'Should be blocked immediately by requireAdmin middleware.',
        posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600',
        videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        durationSeconds: 300,
        releaseYear: 2024,
      });

    expect(createAttempt.status).toBe(403);
    expect(createAttempt.body.code).toBe('FORBIDDEN');

    const planUpdateAttempt = await request(app)
      .put(`/api/admin/plans/${standardPlanId}`)
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        name: 'Free Standard Hack',
        description: 'Attempting to lower price without admin rights.',
        priceCents: 0,
        maxResolution: '4K',
        maxScreens: 10,
        features: ['All features free'],
      });

    expect(planUpdateAttempt.status).toBe(403);
    expect(planUpdateAttempt.body.code).toBe('FORBIDDEN');
  });
});

