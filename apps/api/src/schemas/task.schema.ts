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
  description: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().optional()
  ),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.preprocess(
    (val) => (val === undefined || val === null ? 3 : Number(val)),
    z.number().int().min(1).max(5).default(3)
  ),
  tags: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(z.string()).default([])
  ),
  dueAt: z.preprocess(
    (val) => {
      if (!val || val === '' || val === null) return null;
      return new Date(val as string);
    },
    z.date().nullable().optional()
  ),
  startAt: z.preprocess(
    (val) => {
      if (!val || val === '' || val === null) return null;
      return new Date(val as string);
    },
    z.date().nullable().optional()
  ),
  allDay: z.preprocess(
    (val) => (val === undefined || val === null ? false : Boolean(val)),
    z.boolean().default(false)
  ),
  estimateMinutes: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().int().positive().nullable().optional()
  ),
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

