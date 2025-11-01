import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  settings: {
    timezone: string;
    startOfWeek: number; // 0 = Sunday, 1 = Monday
    defaultView: 'week' | 'month';
    reminderMinutesBefore: number;
  };
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    settings: {
      timezone: {
        type: String,
        default: 'America/Moncton',
      },
      startOfWeek: {
        type: Number,
        default: 1, // Monday
      },
      defaultView: {
        type: String,
        enum: ['week', 'month'],
        default: 'week',
      },
      reminderMinutesBefore: {
        type: Number,
        default: 15,
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const User = mongoose.model<IUser>('User', userSchema);

