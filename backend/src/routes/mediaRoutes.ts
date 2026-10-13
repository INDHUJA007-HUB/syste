import { Router } from 'express';
import { mediaController } from '../controllers/mediaController';

const router = Router();

// Streaming endpoint guarded with signed token
router.get('/stream/:videoId', mediaController.streamMedia);

export default router;
