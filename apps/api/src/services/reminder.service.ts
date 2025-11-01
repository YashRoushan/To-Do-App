import * as cron from 'node-cron';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { addMinutes, isBefore } from 'date-fns';

interface Reminder {
  userId: string;
  taskId: string;
  taskTitle: string;
  dueAt: Date;
  reminderAt: Date;
}

// In-memory reminder queue (in production, use Redis or a proper queue)
export const reminderQueue: Reminder[] = [];

export function startReminderService() {
  const cronPattern = process.env.REMINDER_SCAN_INTERVAL_CRON || '*/1 * * * *';

  cron.schedule(cronPattern, async () => {
    try {
      const users = await User.find();
      const now = new Date();

      for (const user of users) {
        const reminderWindow = user.settings.reminderMinutesBefore || 15;

        // Find tasks due within the reminder window
        const tasks = await Task.find({
          userId: user._id,
          status: { $ne: 'done' },
          dueAt: {
            $gte: now,
            $lte: addMinutes(now, reminderWindow),
          },
        });

        for (const task of tasks) {
          if (!task.dueAt) continue;

          const reminderAt = addMinutes(task.dueAt, -reminderWindow);
          const shouldRemind = isBefore(reminderAt, now) && !isBefore(task.dueAt, now);

          if (shouldRemind) {
            // Check if reminder already exists
            const exists = reminderQueue.some(
              (r) => r.taskId === task._id.toString() && r.userId === user._id.toString()
            );

            if (!exists) {
              reminderQueue.push({
                userId: user._id.toString(),
                taskId: task._id.toString(),
                taskTitle: task.title,
                dueAt: task.dueAt,
                reminderAt: now,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Reminder service error:', error);
    }
  });

  console.log('Reminder service started');
}

export function getRemindersForUser(userId: string): Reminder[] {
  return reminderQueue.filter((r) => r.userId === userId);
}

export function markReminderRead(userId: string, taskId: string) {
  const index = reminderQueue.findIndex(
    (r) => r.userId === userId && r.taskId === taskId
  );
  if (index !== -1) {
    reminderQueue.splice(index, 1);
  }
}

