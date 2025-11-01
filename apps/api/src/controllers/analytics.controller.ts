import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { Tag } from '../models/Tag';
import { AuthRequest } from '../middleware/auth.middleware';
import { startOfDay, endOfDay, subDays, parseISO, format, isAfter, isBefore } from 'date-fns';

export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;

    const fromDate = from ? parseISO(from as string) : startOfDay(subDays(new Date(), 30));
    const toDate = to ? parseISO(to as string) : endOfDay(new Date());

    const userId = req.userId!;

    // Tasks completed today
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const tasksCompletedToday = await Task.countDocuments({
      userId,
      status: 'done',
      updatedAt: { $gte: todayStart, $lte: todayEnd },
    });

    // Tasks completed in last 7 days
    const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
    const tasksCompleted7d = await Task.countDocuments({
      userId,
      status: 'done',
      updatedAt: { $gte: sevenDaysAgo },
    });

    // Tasks completed in last 30 days
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    const tasksCompleted30d = await Task.countDocuments({
      userId,
      status: 'done',
      updatedAt: { $gte: thirtyDaysAgo },
    });

    // Total tasks in date range
    const totalTasks = await Task.countDocuments({
      userId,
      createdAt: { $gte: fromDate, $lte: toDate },
    });

    const completedTasks = await Task.countDocuments({
      userId,
      status: 'done',
      updatedAt: { $gte: fromDate, $lte: toDate },
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // On-time vs late
    const tasksWithDueDates = await Task.find({
      userId,
      dueAt: { $exists: true, $ne: null },
      createdAt: { $gte: fromDate, $lte: toDate },
    });

    let onTime = 0;
    let late = 0;
    for (const task of tasksWithDueDates) {
      if (task.status === 'done' && task.updatedAt && task.dueAt) {
        if (isAfter(task.updatedAt, task.dueAt)) {
          late++;
        } else {
          onTime++;
        }
      }
    }

    // Time spent by tag
    const allTasks = await Task.find({
      userId,
      createdAt: { $gte: fromDate, $lte: toDate },
    }).populate('tags');

    const timeByTag: Record<string, number> = {};
    for (const task of allTasks) {
      const time = task.actualMinutes || 0;
      for (const tag of task.tags) {
        // Handle both populated tags (objects) and ObjectIds
        const tagId = tag && typeof tag === 'object' && '_id' in tag 
          ? tag._id.toString() 
          : (tag as any).toString();
        timeByTag[tagId] = (timeByTag[tagId] || 0) + time;
      }
    }

    // Convert string keys to ObjectIds for the query
    const tagIds = Object.keys(timeByTag)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const tagNames = tagIds.length > 0 
      ? await Tag.find({ userId, _id: { $in: tagIds } })
      : [];
      
    const timeByTagDetails = tagNames.map((tag) => ({
      tagId: tag._id.toString(),
      tagName: tag.name,
      tagColor: tag.color,
      minutes: timeByTag[tag._id.toString()] || 0,
    }));

    // Streak calculation
    const completedActivities = await Activity.find({
      userId,
      type: 'completed',
    }).sort({ at: -1 });

    let streak = 0;
    let currentDate = startOfDay(new Date());
    for (const activity of completedActivities) {
      const activityDate = startOfDay(activity.at);
      if (activityDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (isBefore(activityDate, currentDate)) {
        break;
      } else {
        // Gap found
        break;
      }
    }

    // Upcoming workload (due this week)
    const weekEnd = endOfDay(subDays(new Date(), -7));
    const upcomingTasks = await Task.countDocuments({
      userId,
      status: { $ne: 'done' },
      dueAt: { $gte: new Date(), $lte: weekEnd },
    });

    // Burn-down for current week (last 7 days)
    const burnDown = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayEnd = endOfDay(day);
      const completed = await Task.countDocuments({
        userId,
        status: 'done',
        updatedAt: { $gte: day, $lte: dayEnd },
      });
      burnDown.push({
        date: format(day, 'MM/dd'),
        completed,
      });
    }

    // Tag-based analytics
    const allTags = await Tag.find({ userId });
    const tagStats = await Promise.all(
      allTags.map(async (tag) => {
        const tasksWithTag = await Task.find({
          userId,
          tags: tag._id,
          createdAt: { $gte: fromDate, $lte: toDate },
        });

        const completedWithTag = await Task.countDocuments({
          userId,
          tags: tag._id,
          status: 'done',
          updatedAt: { $gte: fromDate, $lte: toDate },
        });

        const inProgress = await Task.countDocuments({
          userId,
          tags: tag._id,
          status: 'in_progress',
          createdAt: { $gte: fromDate, $lte: toDate },
        });

        const todo = await Task.countDocuments({
          userId,
          tags: tag._id,
          status: 'todo',
          createdAt: { $gte: fromDate, $lte: toDate },
        });

        const totalTime = tasksWithTag.reduce((sum, task) => sum + (task.actualMinutes || 0), 0);
        const estimatedTime = tasksWithTag.reduce((sum, task) => sum + (task.estimateMinutes || 0), 0);

        return {
          tagId: tag._id.toString(),
          tagName: tag.name,
          tagColor: tag.color,
          totalTasks: tasksWithTag.length,
          completed: completedWithTag,
          inProgress,
          todo,
          completionRate: tasksWithTag.length > 0 ? (completedWithTag / tasksWithTag.length) * 100 : 0,
          totalTimeMinutes: totalTime,
          estimatedTimeMinutes: estimatedTime,
        };
      })
    );

    res.json({
      kpis: {
        tasksCompletedToday,
        tasksCompleted7d,
        tasksCompleted30d,
        completionRate: Math.round(completionRate * 100) / 100,
        onTime,
        late,
        streak,
        upcomingTasks,
      },
      charts: {
        timeByTag: timeByTagDetails,
        burnDown,
      },
      tagStats, // New: detailed tag breakdown
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsCSV = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;

    const fromDate = from ? parseISO(from as string) : subDays(new Date(), 30);
    const toDate = to ? parseISO(to as string) : new Date();

    const tasks = await Task.find({
      userId: req.userId,
      createdAt: { $gte: fromDate, $lte: toDate },
    }).populate('tags');

    // Generate CSV
    const headers = [
      'Title',
      'Status',
      'Priority',
      'Tags',
      'Due Date',
      'Created At',
      'Completed At',
      'Estimated Minutes',
      'Actual Minutes',
    ];

    const rows = tasks.map((task) => {
      const tags = task.tags.map((t: any) => t.name).join('; ');
      return [
        task.title,
        task.status,
        task.priority,
        tags,
        task.dueAt ? format(task.dueAt, 'yyyy-MM-dd HH:mm') : '',
        format(task.createdAt, 'yyyy-MM-dd HH:mm'),
        task.status === 'done' && task.updatedAt ? format(task.updatedAt, 'yyyy-MM-dd HH:mm') : '',
        task.estimateMinutes || '',
        task.actualMinutes || 0,
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

