import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { addDays, addHours } from 'date-fns';

// Load environment variables
dotenv.config({ path: './apps/api/.env' });

// Use require for CommonJS modules (Mongoose models are compiled to CommonJS)
const path = require('path');
const apiPath = path.resolve(__dirname, '../apps/api/src');
const { User } = require(path.join(apiPath, 'models/User'));
const { Tag } = require(path.join(apiPath, 'models/Tag'));
const { Task } = require(path.join(apiPath, 'models/Task'));

async function seed() {
  const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app';
  
  try {
    await mongoose.connect(mongo);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Tag.deleteMany({});
    await Task.deleteMany({});
    console.log('Cleared existing data');

    // Create demo user
    const passwordHash = await bcrypt.hash('demo123', 10);
    const user = await User.create({
      email: 'demo@example.com',
      passwordHash,
      name: 'Demo User',
      settings: {
        timezone: 'America/Moncton',
        startOfWeek: 1,
        defaultView: 'week',
        reminderMinutesBefore: 15,
      },
    });
    console.log('Created demo user:', user.email);

    // Create tags
    const tags = await Tag.insertMany([
      { userId: user._id, name: 'work', color: '#3B82F6' },
      { userId: user._id, name: 'school', color: '#10B981' },
      { userId: user._id, name: 'personal', color: '#F59E0B' },
      { userId: user._id, name: 'fitness', color: '#EF4444' },
      { userId: user._id, name: 'project', color: '#8B5CF6' },
    ]);
    console.log('Created tags:', tags.map((t: any) => t.name).join(', '));

    const tagMap = new Map(tags.map((t: any) => [t.name, t._id.toString()]));

    const now = new Date();
    const tasks = [
      {
        userId: user._id,
        title: 'Complete lab report',
        description: 'Finish the chemistry lab report with results and analysis',
        status: 'in_progress' as const,
        priority: 4,
        tags: [tagMap.get('school')!],
        dueAt: addDays(now, 2),
        startAt: addDays(now, 1),
        allDay: false,
        estimateMinutes: 120,
        actualMinutes: 45,
      },
      {
        userId: user._id,
        title: 'Team meeting',
        description: 'Weekly standup with the team',
        status: 'todo' as const,
        priority: 3,
        tags: [tagMap.get('work')!],
        dueAt: addHours(now, 2),
        startAt: addHours(now, 1),
        allDay: false,
        estimateMinutes: 60,
        recurrence: {
          rule: 'WEEKLY' as const,
          interval: 1,
          byWeekday: [1], // Monday
        },
      },
      {
        userId: user._id,
        title: 'Gym workout',
        description: 'Upper body strength training',
        status: 'todo' as const,
        priority: 2,
        tags: [tagMap.get('fitness')!],
        dueAt: addDays(now, 1),
        startAt: addDays(now, 1),
        allDay: true,
        estimateMinutes: 90,
        recurrence: {
          rule: 'WEEKLY' as const,
          interval: 1,
          byWeekday: [1, 3, 5], // Mon, Wed, Fri
        },
      },
      {
        userId: user._id,
        title: 'Review project proposal',
        description: 'Review and provide feedback on the new project proposal',
        status: 'todo' as const,
        priority: 5,
        tags: [tagMap.get('work')!, tagMap.get('project')!],
        dueAt: addDays(now, 3),
        startAt: addDays(now, 3),
        allDay: false,
        estimateMinutes: 180,
        checklist: [
          { _id: new mongoose.Types.ObjectId(), label: 'Read proposal', done: false },
          { _id: new mongoose.Types.ObjectId(), label: 'Check budget', done: false },
          { _id: new mongoose.Types.ObjectId(), label: 'Write feedback', done: false },
        ],
      },
      {
        userId: user._id,
        title: 'Buy groceries',
        description: 'Weekly grocery shopping',
        status: 'done' as const,
        priority: 2,
        tags: [tagMap.get('personal')!],
        dueAt: addDays(now, -1),
        startAt: addDays(now, -1),
        allDay: true,
        estimateMinutes: 60,
        actualMinutes: 45,
      },
      {
        userId: user._id,
        title: 'Finish homework assignment',
        description: 'Complete math homework problems 1-20',
        status: 'done' as const,
        priority: 4,
        tags: [tagMap.get('school')!],
        dueAt: addDays(now, -2),
        startAt: addDays(now, -3),
        allDay: false,
        estimateMinutes: 120,
        actualMinutes: 105,
      },
      {
        userId: user._id,
        title: 'Morning run',
        description: '5km morning run',
        status: 'todo' as const,
        priority: 1,
        tags: [tagMap.get('fitness')!],
        dueAt: addDays(now, 0),
        startAt: addDays(now, 0),
        allDay: false,
        estimateMinutes: 30,
        recurrence: {
          rule: 'DAILY' as const,
          interval: 1,
        },
      },
      {
        userId: user._id,
        title: 'Update project documentation',
        description: 'Document the latest API changes',
        status: 'in_progress' as const,
        priority: 3,
        tags: [tagMap.get('project')!],
        dueAt: addDays(now, 4),
        startAt: addDays(now, 2),
        allDay: false,
        estimateMinutes: 90,
        actualMinutes: 30,
      },
    ];

    await Task.insertMany(tasks);
    console.log(`Created ${tasks.length} tasks`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📧 Demo credentials:');
    console.log('   Email: demo@example.com');
    console.log('   Password: demo123');
    console.log('\n🚀 You can now login with these credentials.\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
