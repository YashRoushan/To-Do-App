import { Router } from 'express';
import * as reminderController from '../controllers/reminder.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', reminderController.getReminders);
router.post('/:taskId/dismiss', reminderController.dismissReminder);

export default router;

