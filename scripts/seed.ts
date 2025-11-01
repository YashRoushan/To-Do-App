const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const dateFns = require('date-fns');

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

    // Create tags with distinct color coding
    const tags = await Tag.insertMany([
      { userId: user._id, name: 'work', color: '#3B82F6' }, // Blue
      { userId: user._id, name: 'health', color: '#10B981' }, // Green
      { userId: user._id, name: 'side hustle', color: '#F59E0B' }, // Orange
      { userId: user._id, name: 'school', color: '#8B5CF6' }, // Purple
      { userId: user._id, name: 'personal', color: '#EC4899' }, // Pink
      { userId: user._id, name: 'fitness', color: '#EF4444' }, // Red
      { userId: user._id, name: 'project', color: '#06B6D4' }, // Cyan
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
        dueAt: dateFns.addDays(now, 2),
        startAt: dateFns.addDays(now, 1),
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
        dueAt: dateFns.addHours(now, 2),
        startAt: dateFns.addHours(now, 1),
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
        tags: [tagMap.get('health')!],
        dueAt: dateFns.addDays(now, 1),
        startAt: dateFns.addDays(now, 1),
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
        title: 'Update freelance project',
        description: 'Finish client website updates',
        status: 'in_progress' as const,
        priority: 4,
        tags: [tagMap.get('side hustle')!],
        dueAt: dateFns.addDays(now, 1),
        startAt: dateFns.addDays(now, 0),
        allDay: false,
        estimateMinutes: 180,
        actualMinutes: 60,
      },
      {
        userId: user._id,
        title: 'Review project proposal',
        description: 'Review and provide feedback on the new project proposal',
        status: 'todo' as const,
        priority: 5,
        tags: [tagMap.get('work')!, tagMap.get('project')!],
        dueAt: dateFns.addDays(now, 3),
        startAt: dateFns.addDays(now, 3),
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
        dueAt: dateFns.addDays(now, -1),
        startAt: dateFns.addDays(now, -1),
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
        dueAt: dateFns.addDays(now, -2),
        startAt: dateFns.addDays(now, -3),
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
        tags: [tagMap.get('health')!],
        dueAt: dateFns.addDays(now, 0),
        startAt: dateFns.addDays(now, 0),
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
        dueAt: dateFns.addDays(now, 4),
        startAt: dateFns.addDays(now, 2),
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
