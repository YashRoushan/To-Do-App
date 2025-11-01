import mongoose, { Document, Schema } from 'mongoose';

export interface IChecklistItem {
  _id: mongoose.Types.ObjectId;
  label: string;
  done: boolean;
}

export interface IRecurrence {
  rule: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number; // e.g., every 2 weeks
  byWeekday?: number[]; // 0=Sun, 1=Mon, etc. for WEEKLY
  count?: number; // number of occurrences
  until?: Date; // end date
}

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: number; // 1-5
  tags: mongoose.Types.ObjectId[];
  dueAt: Date | null;
  startAt: Date | null;
  allDay: boolean;
  estimateMinutes: number | null;
  actualMinutes: number;
  recurrence: IRecurrence | null;
  checklist: IChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const checklistItemSchema = new Schema<IChecklistItem>(
  {
    label: {
      type: String,
      required: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const recurrenceSchema = new Schema<IRecurrence>(
  {
    rule: {
      type: String,
      enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'],
      required: true,
    },
    interval: {
      type: Number,
      default: 1,
    },
    byWeekday: [Number],
    count: Number,
    until: Date,
  },
  { _id: false }
);

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      index: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    dueAt: {
      type: Date,
      index: true,
    },
    startAt: {
      type: Date,
      index: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    estimateMinutes: {
      type: Number,
      default: null,
    },
    actualMinutes: {
      type: Number,
      default: 0,
    },
    recurrence: {
      type: recurrenceSchema,
      default: null,
    },
    checklist: {
      type: [checklistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
taskSchema.index({ userId: 1, status: 1, dueAt: 1 });
taskSchema.index({ userId: 1, dueAt: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);

