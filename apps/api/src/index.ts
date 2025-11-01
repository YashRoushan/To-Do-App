import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes';
import tagRoutes from './routes/tag.routes';
import taskRoutes from './routes/task.routes';
import calendarRoutes from './routes/calendar.routes';
import analyticsRoutes from './routes/analytics.routes';
import reminderRoutes from './routes/reminder.routes';
import { errorHandler } from './middleware/error.middleware';
import { startReminderService } from './services/reminder.service';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// CORS
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// Health check
app.get('/api/v1/health', (_req, res) => res.json({ ok: true, time: new Date() }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reminders', reminderRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app';
  
  // MongoDB connection options
  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    connectTimeoutMS: 10000, // Give up initial connection after 10s
  };

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongo, mongooseOptions);
    console.log('✅ Connected to MongoDB successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
  } catch (err: any) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if MongoDB is running (if using local): docker compose up -d');
    console.error('2. Verify MONGO_URI in apps/api/.env is correct');
    console.error('3. For MongoDB Atlas: check network access and connection string');
    console.error('\nCurrent MONGO_URI:', mongo.replace(/:[^:@]+@/, ':****@')); // Hide password
    process.exit(1); // Exit if DB connection fails
  }

  // Start reminder service
  startReminderService();

  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

start();
