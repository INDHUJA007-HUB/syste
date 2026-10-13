import { Router } from 'express';
import { watchlistController } from '../controllers/watchlistController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', watchlistController.getWatchlist);
router.post('/:videoId', watchlistController.add);
router.delete('/:videoId', watchlistController.remove);

export default router;
