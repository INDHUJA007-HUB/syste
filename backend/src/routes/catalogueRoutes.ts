import { Router } from 'express';
import { catalogueController } from '../controllers/catalogueController';
import { optionalAuthenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { videoQuerySchema } from '../schemas';

const router = Router();

router.get('/videos', optionalAuthenticate, validateQuery(videoQuerySchema), catalogueController.listVideos);
router.get('/videos/:id', optionalAuthenticate, catalogueController.getVideo);
router.get('/genres', catalogueController.getGenres);

export default router;
