import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { checkoutSchema } from '../schemas';

const router = Router();

// Public plans
router.get('/plans', subscriptionController.getPlans);

// User-authenticated routes
router.get('/me', authenticate, subscriptionController.getMySubscription);
router.post('/checkout', authenticate, validateBody(checkoutSchema), subscriptionController.checkout);
router.post('/:id/cancel', authenticate, subscriptionController.cancel);
router.get('/payments', authenticate, subscriptionController.getPayments);

export default router;
