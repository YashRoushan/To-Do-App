import { z } from 'zod';

const recurrenceSchema = z.object({
  rule: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']),
  interval: z.number().int().positive().default(1),
  byWeekday: z.array(z.number().int().min(0).max(6)).optional(),
  count: z.number().int().positive().optional(),
  until: z.date().optional(),
});

const checklistItemSchema = z.object({
  _id: z.string().optional(),
  label: z.string().min(1),
  done: z.boolean().default(false),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.number().int().min(1).max(5).default(3),
  tags: z.array(z.string()).default([]),
  dueAt: z.date().nullable().optional(),
  startAt: z.date().nullable().optional(),
  allDay: z.boolean().default(false),
  estimateMinutes: z.number().int().positive().nullable().optional(),
  actualMinutes: z.number().int().min(0).default(0),
  recurrence: recurrenceSchema.nullable().optional(),
  checklist: z.array(checklistItemSchema).default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  tags: z.string().optional(), // comma-separated tag IDs
  priority: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = typeof val === 'string' ? Number(val) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().int().positive().optional()
  ),
  limit: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = typeof val === 'string' ? Number(val) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().int().positive().optional()
  ),
  cursor: z.string().optional(),
}).passthrough(); // Allow extra query params

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

