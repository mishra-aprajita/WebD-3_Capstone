import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from './models/User.js';
import { Post } from './models/Post.js';
import { Comment } from './models/Comment.js';
import { Follow } from './models/Follow.js';
import { Story } from './models/Story.js';
import { Message } from './models/Message.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snapgram';

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding.');

    // Clear existing collections
    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Follow.deleteMany({}),
      Story.deleteMany({}),
      Message.deleteMany({}),
    ]);

    console.log('Creating sample users...');
    // We hash passwords directly or let pre-save hook do it.
    // To ensure reliable hashing without double hashing, we can instantiate models.

    const usersData = [
      {
        username: 'alex_creator',
        name: 'Alex Rivera',
        email: 'alex@snapgram.com',
        password: 'password123',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: '📸 Visual Storyteller | Travel & Street Photography | Tokyo & NYC ✈️',
      },
      {
        username: 'sarah_admin',
        name: 'Sarah Chen (Admin)',
        email: 'admin@snapgram.com',
        password: 'admin123',
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        bio: '🛡️ Snapgram Community Architect & Senior Engineer | Tech & Design',
      },
      {
        username: 'elena_travels',
        name: 'Elena Rostova',
        email: 'elena@travel.org',
        password: 'password123',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        bio: '🏔️ Living out of a backpack | Alpinist & sunset chaser 🌅',
      },
      {
        username: 'marcus_dev',
        name: 'Marcus Brody',
        email: 'marcus@code.io',
        password: 'password123',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        bio: '💻 Building full-stack apps & generative UI | Coffee enthusiast ☕️',
      },
      {
        username: 'kenji_photo',
        name: 'Kenji Sato',
        email: 'kenji@lens.jp',
        password: 'password123',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        bio: 'Kyoto neon nights & film cameras 🎞️ Leica M6 shooter',
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = new User(u);
      await user.save();
      createdUsers.push(user);
    }

    const [alex, sarah, elena, marcus, kenji] = createdUsers;

    // Set up Close Friends
    console.log('Configuring Close Friends circles...');
    alex.closeFriends = [elena._id, sarah._id];
    sarah.closeFriends = [alex._id];
    elena.closeFriends = [alex._id];
    kenji.closeFriends = [alex._id];

    await Promise.all([alex.save(), sarah.save(), elena.save(), kenji.save()]);

    // Set up Follow graph
    console.log('Establishing Follow relationships...');
    const follows = [
      { follower: alex._id, following: sarah._id },
      { follower: alex._id, following: elena._id },
      { follower: alex._id, following: marcus._id },
      { follower: alex._id, following: kenji._id },

      { follower: sarah._id, following: alex._id },
      { follower: sarah._id, following: elena._id },

      { follower: elena._id, following: alex._id },
      { follower: elena._id, following: sarah._id },

      { follower: marcus._id, following: alex._id },
      { follower: kenji._id, following: alex._id },
    ];
    await Follow.insertMany(follows);

    // Create Posts
    console.log('Seeding posts & likes...');
    const postsData = [
      {
        author: alex._id,
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lost in the majesty of Yosemite Valley. Nature has a way of resetting your mind completely. 🌲🏔️ #landscape #yosemite #naturephotography',
        location: 'Yosemite National Park, California',
        likes: [sarah._id, elena._id, kenji._id, marcus._id],
      },
      {
        author: elena._id,
        imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
        caption: 'Camping under a million stars in the Swiss Alps. Temperatures dropped to -4°C but the hot cocoa kept us alive! 🌌☕️ #stargazing #switzerland',
        location: 'Zermatt, Switzerland',
        likes: [alex._id, sarah._id, marcus._id],
      },
      {
        author: kenji._id,
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Reflections in the historic canals of Kyoto. Every corner here whispers an ancient story. 🏮⛩️ #kyoto #japan #travelphotography',
        location: 'Gion District, Kyoto',
        likes: [alex._id, sarah._id, elena._id],
      },
      {
        author: sarah._id,
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Brainstorming session with the engineering team. Great software is forged through empathy, craftsmanship, and endless iterations. 🚀💡 #tech #snapgram',
        location: 'San Francisco, CA',
        likes: [alex._id, elena._id, marcus._id, kenji._id],
      },
      {
        author: marcus._id,
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Configured a brand new mechanical keyboard with Lubed Holy Pandas & custom keycaps. Keystrokes sound like rain drops! ⌨️🎧 #setup #mechanicalkeyboard',
        location: 'Austin, Texas',
        likes: [alex._id],
      },
      {
        author: alex._id,
        imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        caption: 'Morning fog drifting over the redwood forest canopy. Silent, mystical, and peaceful. 🌲🌁',
        location: 'Redwood National Park',
        likes: [sarah._id, elena._id],
      },
    ];

    const createdPosts = await Post.insertMany(postsData);

    // Save bookmarks
    alex.savedPosts = [createdPosts[1]._id, createdPosts[2]._id];
    sarah.savedPosts = [createdPosts[0]._id];
    await Promise.all([alex.save(), sarah.save()]);

    // Create Comments
    console.log('Adding post comments...');
    const commentsData = [
      {
        post: createdPosts[0]._id,
        author: elena._id,
        text: 'The light hitting that granite wall is unbelievable Alex! 🌅',
      },
      {
        post: createdPosts[0]._id,
        author: sarah._id,
        text: 'Framing is pure perfection. Which lens did you use?',
      },
      {
        post: createdPosts[1]._id,
        author: alex._id,
        text: 'That Milky Way core exposure is so crisp! 🌟',
      },
      {
        post: createdPosts[2]._id,
        author: marcus._id,
        text: 'I need to visit Japan this autumn! Amazing shot Kenji.',
      },
      {
        post: createdPosts[3]._id,
        author: alex._id,
        text: 'Love the energy! Proud to be on this platform.',
      },
    ];
    await Comment.insertMany(commentsData);

    // Create 24-hr Stories with Close Friends twist
    console.log('Seeding 24-hour stories with Close Friends green ring flags...');
    const storiesData = [
      {
        author: alex._id,
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
        caption: 'Tokyo morning golden hour ✨',
        isCloseFriendsOnly: true, // GREEN RING!
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
      },
      {
        author: elena._id,
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        caption: 'Summit reached at 4:30 AM! 🏔️',
        isCloseFriendsOnly: true, // GREEN RING!
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        author: sarah._id,
        imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
        caption: 'Clean code & clean desk vibe 💻⚡️',
        isCloseFriendsOnly: false, // Normal gradient ring
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        author: kenji._id,
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
        caption: 'Midnight neon rain in Shibuya 🌧️',
        isCloseFriendsOnly: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
      },
    ];
    await Story.insertMany(storiesData);

    // Create Sample Direct Messages
    console.log('Seeding sample direct messages...');
    const messagesData = [
      {
        sender: sarah._id,
        receiver: alex._id,
        text: 'Hey Alex! Loved your Yosemite shot. The granite lighting was spectacular 🏔️',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 180),
      },
      {
        sender: alex._id,
        receiver: sarah._id,
        text: 'Thanks Sarah! It was freezing at dawn, but totally worth the hike.',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 120),
      },
      {
        sender: sarah._id,
        receiver: alex._id,
        text: 'Are we still on for the design review meeting this Friday?',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 25),
      },
      {
        sender: elena._id,
        receiver: alex._id,
        text: 'Hey Alex! Are you planning to visit the Swiss Alps anytime soon? ⛷️',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        sender: alex._id,
        receiver: elena._id,
        text: 'Hey Elena! Definitely on my bucket list for next spring!',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        sender: elena._id,
        receiver: alex._id,
        text: 'Check out this camp spot from my last trip:',
        sharedPost: createdPosts[1]._id,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 40),
      },
      {
        sender: kenji._id,
        receiver: alex._id,
        text: 'Konbanwa Alex! If you are ever in Kyoto, let me know. Leica night walk in Gion! 🏮',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
    ];
    await Message.insertMany(messagesData);

    console.log('\n======================================================');
    console.log('✅ Snapgram Database seeded successfully!');
    console.log('======================================================');
    console.log('Demo Credentials:');
    console.log('  Standard User:  alex@snapgram.com   / password123 (@alex_creator)');
    console.log('  Admin User:     admin@snapgram.com  / admin123    (@sarah_admin)');
    console.log('  Other Users:    elena@travel.org, marcus@code.io, kenji@lens.jp (pass: password123)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
