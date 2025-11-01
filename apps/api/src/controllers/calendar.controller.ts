import { Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { AuthRequest } from '../middleware/auth.middleware';
import { expandRecurrence } from '../utils/recurrence.util';
import { parseISO } from 'date-fns';

export const getCalendarEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'from and to query parameters are required',
        },
      });
    }

    const fromDate = parseISO(from as string);
    const toDate = parseISO(to as string);

    // Get all tasks for the user in the date range or with recurrence
    const tasks = await Task.find({
      userId: req.userId,
      $or: [
        {
          $and: [
            { startAt: { $exists: true, $ne: null } },
            { startAt: { $lte: toDate } },
            { $or: [{ dueAt: null }, { dueAt: { $gte: fromDate } }] },
          ],
        },
        {
          $and: [
            { dueAt: { $exists: true, $ne: null } },
            { dueAt: { $lte: toDate, $gte: fromDate } },
          ],
        },
        {
          'recurrence.rule': { $ne: 'NONE' },
        },
      ],
    }).populate('tags');

    const events: any[] = [];

    for (const task of tasks) {
      const expanded = expandRecurrence(task, fromDate, toDate);
      events.push(...expanded);
    }

    res.json({ events });
  } catch (error) {
    next(error);
  }
};

