const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './apps/api/.env' });

const path = require('path');
const apiPath = path.resolve(__dirname, '../apps/api/src');
const { User } = require(path.join(apiPath, 'models/User'));
const { Tag } = require(path.join(apiPath, 'models/Tag'));

async function addDefaultTags() {
  const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app';
  
  try {
    await mongoose.connect(mongo);
    console.log('Connected to MongoDB');

    const defaultTags = [
      { name: 'work', color: '#3B82F6' },
      { name: 'health', color: '#10B981' },
      { name: 'side hustle', color: '#F59E0B' },
      { name: 'school', color: '#8B5CF6' },
      { name: 'personal', color: '#EC4899' },
      { name: 'fitness', color: '#EF4444' },
      { name: 'project', color: '#06B6D4' },
    ];

    const users = await User.find();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const existingTags = await Tag.find({ userId: user._id });
      console.log(`User ${user.email} has ${existingTags.length} existing tags`);

      if (existingTags.length === 0) {
        console.log(`Creating default tags for ${user.email}...`);
        await Tag.insertMany(
          defaultTags.map((tag) => ({
            userId: user._id,
            name: tag.name,
            color: tag.color,
          }))
        );
        console.log(`✅ Created ${defaultTags.length} tags for ${user.email}`);
      } else {
        // Add any missing default tags
        const existingNames = existingTags.map((t: any) => t.name.toLowerCase());
        const missingTags = defaultTags.filter((tag) => !existingNames.includes(tag.name.toLowerCase()));

        if (missingTags.length > 0) {
          await Tag.insertMany(
            missingTags.map((tag) => ({
              userId: user._id,
              name: tag.name,
              color: tag.color,
            }))
          );
          console.log(`✅ Added ${missingTags.length} missing tags for ${user.email}`);
        } else {
          console.log(`✓ ${user.email} already has all default tags`);
        }
      }
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addDefaultTags();

