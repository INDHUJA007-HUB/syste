import { Router } from 'express';
import authRoutes from './authRoutes';
import catalogueRoutes from './catalogueRoutes';
import watchlistRoutes from './watchlistRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import playbackRoutes from './playbackRoutes';
import adminRoutes from './adminRoutes';
import mediaRoutes from './mediaRoutes';
import { subscriptionController } from '../controllers/subscriptionController';
import { isUsingRedis } from '../config/cache';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StreamSphere API',
    uptimeSeconds: Math.floor(process.uptime()),
    cacheDriver: isUsingRedis() ? 'Redis' : 'In-Memory TTL',
  });
});

// Payment webhook at top level
router.post('/payments/webhook', subscriptionController.handleWebhook);

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/', catalogueRoutes); // provides /videos and /genres
router.use('/watchlist', watchlistRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/playback', playbackRoutes);
router.use('/admin', adminRoutes);
router.use('/media', mediaRoutes);

export default router;
