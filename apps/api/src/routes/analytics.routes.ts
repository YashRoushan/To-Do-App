import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', analyticsController.getAnalytics);
router.get('/csv', analyticsController.getAnalyticsCSV);

export default router;

