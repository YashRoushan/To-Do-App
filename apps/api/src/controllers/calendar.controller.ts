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

    // Get all tasks for the user that:
    // 1. Have startAt or dueAt in the date range
    // 2. Have recurrence (will be expanded)
    // 3. Have startAt that overlaps with range (even if dueAt is outside)
    // 4. Have dueAt in range (even if no startAt)
    const tasks = await Task.find({
      userId: req.userId,
      $or: [
        // Tasks with startAt in range
        {
          startAt: {
            $exists: true,
            $ne: null,
            $lte: toDate,
            $gte: fromDate,
          },
        },
        // Tasks with dueAt in range
        {
          dueAt: {
            $exists: true,
            $ne: null,
            $lte: toDate,
            $gte: fromDate,
          },
        },
        // Tasks that span the date range (start before, end after)
        {
          $and: [
            { startAt: { $exists: true, $ne: null, $lte: fromDate } },
            {
              $or: [
                { dueAt: { $exists: true, $ne: null, $gte: toDate } },
                { dueAt: null },
              ],
            },
          ],
        },
        // Tasks with recurrence (will be expanded)
        {
          'recurrence.rule': { $ne: 'NONE', $exists: true },
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

