import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema, updateProfileSchema } from '../schemas';

const router = Router();

// Rate limit login/register to prevent brute force (50 attempts per 15 min)
const authLimiter = rateLimiter({ maxRequests: 50, windowSeconds: 900 });

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/profile', authenticate, validateBody(updateProfileSchema), authController.updateProfile);

export default router;
