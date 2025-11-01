import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getRemindersForUser, markReminderRead } from '../services/reminder.service';

export const getReminders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reminders = getRemindersForUser(req.userId!);
    res.json({ reminders });
  } catch (error) {
    next(error);
  }
};

export const dismissReminder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    markReminderRead(req.userId!, taskId);
    res.json({ message: 'Reminder dismissed' });
  } catch (error) {
    next(error);
  }
};

