import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      default: '#3B82F6',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique constraint: name per user
tagSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Tag = mongoose.model<ITag>('Tag', tagSchema);

