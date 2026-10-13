import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createVideoSchema, updateVideoSchema, planManagementSchema } from '../schemas';

const router = Router();

// Enforce authentication AND admin role on all admin routes
router.use(authenticate, requireAdmin);

router.get('/analytics', adminController.getAnalytics);

router.post('/videos', validateBody(createVideoSchema), adminController.createVideo);
router.put('/videos/:id', validateBody(updateVideoSchema), adminController.updateVideo);
router.delete('/videos/:id', adminController.deleteVideo);

router.put('/plans/:id', validateBody(planManagementSchema), adminController.updatePlan);

export default router;
