import { Router } from 'express';
import { playbackController } from '../controllers/playbackController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { playbackSessionSchema, playbackProgressSchema } from '../schemas';

const router = Router();

router.use(authenticate);

router.post('/sessions', validateBody(playbackSessionSchema), playbackController.createSession);
router.put('/sessions/:id/progress', validateBody(playbackProgressSchema), playbackController.updateProgress);
router.get('/continue-watching', playbackController.getContinueWatching);
router.get('/resume/:videoId', playbackController.getResume);

export default router;
