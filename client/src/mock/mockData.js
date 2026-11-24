// Mock data pre-populated with realistic Instagram-style content, active 24-hr stories, and users

export const INITIAL_USERS = [
  {
    id: 'user_1',
    username: 'alex_creator',
    name: 'Alex Rivera',
    email: 'alex@snapgram.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: '📸 Visual Storyteller | Travel & Street Photography | Tokyo & NYC ✈️',
    website: 'https://alexrivera.photography',
    followersCount: 1420,
    followingCount: 380,
    postsCount: 12,
    followers: ['sarah_admin', 'elena_travels', 'marcus_dev', 'zoe_art'],
    following: ['sarah_admin', 'elena_travels', 'marcus_dev', 'kenji_photo'],
    closeFriends: ['elena_travels', 'sarah_admin'], // Alex considers Elena and Sarah as Close Friends
  },
  {
    id: 'user_2',
    username: 'sarah_admin',
    name: 'Sarah Chen (Admin)',
    email: 'admin@snapgram.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    bio: '🛡️ Snapgram Community Architect & Senior Engineer | Tech & Design',
    website: 'https://snapgram.internal/admin',
    followersCount: 5240,
    followingCount: 215,
    postsCount: 18,
    followers: ['alex_creator', 'elena_travels', 'marcus_dev', 'kenji_photo'],
    following: ['alex_creator', 'elena_travels', 'zoe_art'],
    closeFriends: ['alex_creator'],
  },
  {
    id: 'user_3',
    username: 'elena_travels',
    name: 'Elena Rostova',
    email: 'elena@travel.org',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    bio: '🏔️ Living out of a backpack | Alpinist & sunset chaser 🌅',
    followersCount: 8900,
    followingCount: 412,
    postsCount: 34,
    followers: ['alex_creator', 'sarah_admin', 'marcus_dev'],
    following: ['alex_creator', 'sarah_admin'],
    closeFriends: ['alex_creator'],
  },
  {
    id: 'user_4',
    username: 'marcus_dev',
    name: 'Marcus Brody',
    email: 'marcus@code.io',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: '💻 Building full-stack apps & generative UI | Coffee enthusiast ☕️',
    followersCount: 780,
    followingCount: 320,
    postsCount: 9,
    followers: ['alex_creator', 'sarah_admin'],
    following: ['alex_creator'],
    closeFriends: [],
  },
  {
    id: 'user_5',
    username: 'kenji_photo',
    name: 'Kenji Sato',
    email: 'kenji@lens.jp',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Kyoto neon nights & film cameras 🎞️ Leica M6 shooter',
    followersCount: 3200,
    followingCount: 190,
    postsCount: 22,
    followers: ['alex_creator', 'sarah_admin'],
    following: ['alex_creator'],
    closeFriends: ['alex_creator'],
  }
];

// Calculate timestamps for 24-hour stories
const now = Date.now();
const oneHourAgo = new Date(now - 1000 * 60 * 60 * 1).toISOString();
const threeHoursAgo = new Date(now - 1000 * 60 * 60 * 3).toISOString();
const sixHoursAgo = new Date(now - 1000 * 60 * 60 * 6).toISOString();
const tenHoursAgo = new Date(now - 1000 * 60 * 60 * 10).toISOString();
const twentyHoursAgo = new Date(now - 1000 * 60 * 60 * 20).toISOString();

export const INITIAL_STORIES = [
  {
    id: 'story_1',
    author: {
      id: 'user_1',
      username: 'alex_creator',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      closeFriends: ['elena_travels', 'sarah_admin'],
    },
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    caption: 'Tokyo morning golden hour ✨',
    isCloseFriendsOnly: true, // GREEN RING!
    createdAt: oneHourAgo,
    expiresAt: new Date(now + 1000 * 60 * 60 * 23).toISOString(),
    viewers: ['sarah_admin'],
  },
  {
    id: 'story_2',
    author: {
      id: 'user_3',
      username: 'elena_travels',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      closeFriends: ['alex_creator'],
    },
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    caption: 'Summit reached at 4:30 AM! 🏔️',
    isCloseFriendsOnly: true, // GREEN RING!
    createdAt: threeHoursAgo,
    expiresAt: new Date(now + 1000 * 60 * 60 * 21).toISOString(),
    viewers: [],
  },
  {
    id: 'story_3',
    author: {
      id: 'user_2',
      username: 'sarah_admin',
      name: 'Sarah Chen (Admin)',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      closeFriends: ['alex_creator'],
    },
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
    caption: 'Clean code & clean desk vibe 💻⚡️',
    isCloseFriendsOnly: false, // Standard Instagram gradient ring
    createdAt: sixHoursAgo,
    expiresAt: new Date(now + 1000 * 60 * 60 * 18).toISOString(),
    viewers: [],
  },
  {
    id: 'story_4',
    author: {
      id: 'user_5',
      username: 'kenji_photo',
      name: 'Kenji Sato',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      closeFriends: ['alex_creator'],
    },
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    caption: 'Midnight neon rain in Shibuya 🌧️',
    isCloseFriendsOnly: false,
    createdAt: tenHoursAgo,
    expiresAt: new Date(now + 1000 * 60 * 60 * 14).toISOString(),
    viewers: [],
  },
  {
    id: 'story_5',
    author: {
      id: 'user_4',
      username: 'marcus_dev',
      name: 'Marcus Brody',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      closeFriends: [],
    },
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    caption: 'Late night sprint session ☕️🚀',
    isCloseFriendsOnly: false,
    createdAt: twentyHoursAgo,
    expiresAt: new Date(now + 1000 * 60 * 60 * 4).toISOString(),
    viewers: [],
  }
];

export const INITIAL_POSTS = [
  {
    id: 'post_1',
    author: {
      id: 'user_1',
      username: 'alex_creator',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    caption: 'Lost in the majesty of Yosemite Valley. Nature has a way of resetting your mind completely. 🌲🏔️ #landscape #yosemite #naturephotography #explore',
    location: 'Yosemite National Park, California',
    likes: ['sarah_admin', 'elena_travels', 'kenji_photo', 'marcus_dev'],
    likesCount: 142,
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(), // 45m ago
    comments: [
      {
        id: 'c_1',
        author: {
          username: 'elena_travels',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
        },
        text: 'The light hitting that granite wall is unbelievable Alex! 🌅',
        createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'c_2',
        author: {
          username: 'sarah_admin',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
        },
        text: 'Framing is pure perfection. Which lens did you use?',
        createdAt: new Date(now - 1000 * 60 * 15).toISOString(),
      }
    ]
  },
  {
    id: 'post_2',
    author: {
      id: 'user_3',
      username: 'elena_travels',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    caption: 'Camping under a million stars in the Swiss Alps. Temperatures dropped to -4°C but the hot cocoa kept us alive! 🌌☕️ #stargazing #switzerland #alps #adventure',
    location: 'Zermatt, Switzerland',
    likes: ['alex_creator', 'sarah_admin', 'marcus_dev'],
    likesCount: 389,
    createdAt: new Date(now - 1000 * 60 * 180).toISOString(), // 3h ago
    comments: [
      {
        id: 'c_3',
        author: {
          username: 'alex_creator',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
        },
        text: 'That Milky Way core exposure is so crisp! 🌟',
        createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
      }
    ]
  },
  {
    id: 'post_3',
    author: {
      id: 'user_5',
      username: 'kenji_photo',
      name: 'Kenji Sato',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Reflections in the historic canals of Kyoto. Every corner here whispers an ancient story. 🏮⛩️ #kyoto #japan #travelphotography #streetstyle',
    location: 'Gion District, Kyoto',
    likes: ['alex_creator', 'sarah_admin', 'elena_travels'],
    likesCount: 275,
    createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(), // 8h ago
    comments: [
      {
        id: 'c_4',
        author: {
          username: 'marcus_dev',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
        },
        text: 'I need to visit Japan this autumn! Amazing shot Kenji.',
        createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      }
    ]
  },
  {
    id: 'post_4',
    author: {
      id: 'user_2',
      username: 'sarah_admin',
      name: 'Sarah Chen (Admin)',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    },
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Brainstorming session with the engineering team. Great software is forged through empathy, craftsmanship, and endless iterations. 🚀💡 #tech #engineering #startuplife #snapgram',
    location: 'San Francisco, CA',
    likes: ['alex_creator', 'elena_travels', 'marcus_dev', 'kenji_photo'],
    likesCount: 512,
    createdAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(), // 14h ago
    comments: [
      {
        id: 'c_5',
        author: {
          username: 'alex_creator',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
        },
        text: 'Love the energy! Proud to be on this platform.',
        createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      }
    ]
  },
  {
    id: 'post_5',
    author: {
      id: 'user_4',
      username: 'marcus_dev',
      name: 'Marcus Brody',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Configured a brand new mechanical keyboard with Lubed Holy Pandas & custom keycaps. Keystrokes sound like rain drops! ⌨️🎧 #setup #mechanicalkeyboard #workspace',
    location: 'Austin, Texas',
    likes: ['alex_creator'],
    likesCount: 94,
    createdAt: new Date(now - 1000 * 60 * 60 * 22).toISOString(), // 22h ago
    comments: []
  },
  {
    id: 'post_6',
    author: {
      id: 'user_1',
      username: 'alex_creator',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    caption: 'Morning fog drifting over the redwood forest canopy. Silent, mystical, and peaceful. 🌲🌁',
    location: 'Redwood National Park',
    likes: ['sarah_admin', 'elena_travels', 'marcus_dev'],
    likesCount: 210,
    createdAt: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
    comments: []
  }
];

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
export const FALLBACK_AVATAR = '';

export const INITIAL_MESSAGES = [
  {
    _id: 'msg_1',
    sender: 'sarah_admin',
    receiver: 'alex_creator',
    text: 'Hey Alex! Loved your Yosemite shot. The granite lighting was spectacular 🏔️',
    sharedPost: null,
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 180).toISOString(),
  },
  {
    _id: 'msg_2',
    sender: 'alex_creator',
    receiver: 'sarah_admin',
    text: 'Thanks Sarah! It was freezing at dawn, but totally worth the hike.',
    sharedPost: null,
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: 'msg_3',
    sender: 'sarah_admin',
    receiver: 'alex_creator',
    text: 'Are we still on for the design review meeting this Friday?',
    sharedPost: null,
    isRead: false,
    createdAt: new Date(now - 1000 * 60 * 25).toISOString(),
  },
  {
    _id: 'msg_4',
    sender: 'elena_travels',
    receiver: 'alex_creator',
    text: 'Hey Alex! Are you planning to visit the Swiss Alps anytime soon? ⛷️',
    sharedPost: null,
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    _id: 'msg_5',
    sender: 'alex_creator',
    receiver: 'elena_travels',
    text: 'Hey Elena! Definitely on my bucket list for next spring!',
    sharedPost: null,
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    _id: 'msg_6',
    sender: 'elena_travels',
    receiver: 'alex_creator',
    text: 'Check out this camp spot from my last trip:',
    sharedPost: {
      id: 'post_2',
      imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
      caption: 'Camping under a million stars in the Swiss Alps 🌌☕️',
      author: { username: 'elena_travels' }
    },
    isRead: false,
    createdAt: new Date(now - 1000 * 60 * 40).toISOString(),
  },
  {
    _id: 'msg_7',
    sender: 'kenji_photo',
    receiver: 'alex_creator',
    text: 'Konbanwa Alex! If you are ever in Kyoto, let me know. Leica night walk in Gion! 🏮',
    sharedPost: null,
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
  }
];

