import { addDays, addWeeks, addMonths, startOfWeek, isSameDay, format, parseISO } from 'date-fns';
import { IRecurrence, ITask } from '../models/Task';

export interface ExpandedEvent {
  taskId: string;
  startAt: Date;
  dueAt: Date;
  allDay: boolean;
  title: string;
  status: string;
  priority: number;
  tags: string[];
}

export function expandRecurrence(
  task: ITask,
  fromDate: Date,
  toDate: Date
): ExpandedEvent[] {
  if (!task.recurrence || task.recurrence.rule === 'NONE') {
    if (task.startAt && task.dueAt) {
      // Single event
      if (
        (task.startAt >= fromDate && task.startAt <= toDate) ||
        (task.dueAt >= fromDate && task.dueAt <= toDate) ||
        (task.startAt <= fromDate && task.dueAt >= toDate)
      ) {
        return [
          {
            taskId: task._id.toString(),
            startAt: task.startAt,
            dueAt: task.dueAt,
            allDay: task.allDay,
            title: task.title,
            status: task.status,
            priority: task.priority,
            tags: task.tags.map((t) => t.toString()),
          },
        ];
      }
    }
    return [];
  }

  const events: ExpandedEvent[] = [];
  const recurrence = task.recurrence;
  const baseStart = task.startAt || task.dueAt || new Date();
  const baseDue = task.dueAt || task.startAt || new Date();
  const duration = baseDue.getTime() - baseStart.getTime();

  let current = new Date(Math.max(baseStart.getTime(), fromDate.getTime()));
  const endLimit = recurrence.until || recurrence.count ? null : toDate;
  const maxDate = endLimit
    ? new Date(Math.min(endLimit.getTime(), toDate.getTime()))
    : toDate;

  let count = 0;
  const maxCount = recurrence.count || 365;

  while (current <= maxDate && count < maxCount) {
    let nextDate: Date;

    switch (recurrence.rule) {
      case 'DAILY':
        nextDate = addDays(baseStart, count * recurrence.interval);
        break;
      case 'WEEKLY':
        if (recurrence.byWeekday && recurrence.byWeekday.length > 0) {
          // Find next matching weekday
          const weekStart = startOfWeek(current, { weekStartsOn: 0 });
          const dayOfWeek = current.getDay();
          const targetWeekdays = recurrence.byWeekday;

          if (targetWeekdays.includes(dayOfWeek)) {
            nextDate = current;
          } else {
            // Find next matching weekday
            let daysToAdd = 0;
            for (let i = 1; i <= 7; i++) {
              const checkDay = (dayOfWeek + i) % 7;
              if (targetWeekdays.includes(checkDay)) {
                daysToAdd = i;
                break;
              }
            }
            nextDate = addDays(current, daysToAdd);
          }
          if (nextDate > maxDate) break;
        } else {
          nextDate = addWeeks(baseStart, count * recurrence.interval);
        }
        break;
      case 'MONTHLY':
        nextDate = addMonths(baseStart, count * recurrence.interval);
        break;
      default:
        nextDate = current;
    }

    if (nextDate >= fromDate && nextDate <= maxDate) {
      const eventDue = new Date(nextDate.getTime() + duration);
      events.push({
        taskId: task._id.toString(),
        startAt: nextDate,
        dueAt: eventDue,
        allDay: task.allDay,
        title: task.title,
        status: task.status,
        priority: task.priority,
        tags: task.tags.map((t) => t.toString()),
      });
    }

    count++;
    if (recurrence.rule === 'DAILY') {
      current = addDays(current, recurrence.interval);
    } else if (recurrence.rule === 'WEEKLY') {
      current = addWeeks(current, recurrence.interval);
    } else if (recurrence.rule === 'MONTHLY') {
      current = addMonths(current, recurrence.interval);
    } else {
      break;
    }
  }

  return events;
}

