import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId | null;
  type: 'created' | 'started' | 'completed' | 'edited';
  at: Date;
  meta?: Record<string, any>;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['created', 'started', 'completed', 'edited'],
      required: true,
    },
    at: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

activitySchema.index({ userId: 1, at: -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);

