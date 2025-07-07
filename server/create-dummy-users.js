const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB (you'll need to replace this with your actual MongoDB URI)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bittrr';

// Dummy user data with realistic profiles
const dummyUsers = [
  {
    name: 'Sarah Johnson',
    age: 28,
    gender: 'female',
    lookingFor: 'male',
    bio: 'Adventure seeker and coffee enthusiast. Love hiking, photography, and trying new restaurants. Looking for someone to explore the world with!',
    interests: ['Hiking', 'Photography', 'Coffee', 'Travel', 'Cooking'],
    location: { city: 'New York', state: 'NY', coordinates: [-74.006, 40.7128] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'Michael Chen',
    age: 32,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Software engineer by day, musician by night. Looking for someone to share life\'s adventures with.',
    interests: ['Music', 'Technology', 'Gaming', 'Fitness', 'Reading'],
    location: { city: 'San Francisco', state: 'CA', coordinates: [-122.4194, 37.7749] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'Emma Davis',
    age: 25,
    gender: 'female',
    lookingFor: 'male',
    bio: 'Art teacher and yoga instructor. Passionate about creativity and mindfulness.',
    interests: ['Art', 'Yoga', 'Meditation', 'Nature', 'Dancing'],
    location: { city: 'Austin', state: 'TX', coordinates: [-97.7431, 30.2672] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'David Rodriguez',
    age: 30,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Chef who loves creating culinary experiences. Looking for someone to share good food and great conversations.',
    interests: ['Cooking', 'Wine', 'Travel', 'Sports', 'Movies'],
    location: { city: 'Miami', state: 'FL', coordinates: [-80.1918, 25.7617] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'Jessica Kim',
    age: 27,
    gender: 'female',
    lookingFor: 'male',
    bio: 'Marketing professional with a love for fashion and fitness. Always up for trying something new!',
    interests: ['Fashion', 'Fitness', 'Marketing', 'Netflix', 'Wine'],
    location: { city: 'Los Angeles', state: 'CA', coordinates: [-118.2437, 34.0522] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'Alex Thompson',
    age: 29,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Environmental scientist and outdoor enthusiast. Let\'s explore the world together!',
    interests: ['Hiking', 'Environment', 'Science', 'Camping', 'Photography'],
    location: { city: 'Denver', state: 'CO', coordinates: [-104.9903, 39.7392] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'Rachel Green',
    age: 26,
    gender: 'female',
    lookingFor: 'male',
    bio: 'Nurse with a heart of gold. Love animals, gardening, and making people smile.',
    interests: ['Nursing', 'Animals', 'Gardening', 'Volunteering', 'Baking'],
    location: { city: 'Seattle', state: 'WA', coordinates: [-122.3321, 47.6062] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'James Wilson',
    age: 31,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Financial analyst who enjoys the finer things in life. Looking for someone to share adventures with.',
    interests: ['Finance', 'Wine', 'Travel', 'Golf', 'Fine Dining'],
    location: { city: 'Chicago', state: 'IL', coordinates: [-87.6298, 41.8781] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'Amanda Foster',
    age: 24,
    gender: 'female',
    lookingFor: 'male',
    bio: 'Graduate student in psychology. Love learning about people and exploring new places.',
    interests: ['Psychology', 'Reading', 'Travel', 'Coffee', 'Art'],
    location: { city: 'Boston', state: 'MA', coordinates: [-71.0589, 42.3601] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  },
  {
    name: 'Ryan Cooper',
    age: 33,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Firefighter and fitness enthusiast. Looking for someone who values courage and adventure.',
    interests: ['Fitness', 'Firefighting', 'Adventure', 'Sports', 'Cooking'],
    location: { city: 'Phoenix', state: 'AZ', coordinates: [-112.0740, 33.4484] },
    photos: [
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop', isPrimary: false }
    ],
    lastActive: new Date()
  }
];

// Generate additional users with variations
const names = [
  'Sophie', 'Olivia', 'Isabella', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail',
  'Emily', 'Elizabeth', 'Sofia', 'Madison', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria',
  'Lucas', 'Mason', 'Logan', 'Alexander', 'Ethan', 'Jacob', 'Michael', 'Daniel', 'Henry', 'Jackson',
  'Sebastian', 'Aiden', 'Matthew', 'Samuel', 'David', 'Joseph', 'Carter', 'Owen', 'Wyatt', 'John'
];

const cities = [
  { city: 'Portland', state: 'OR', coords: [-122.6765, 45.5152] },
  { city: 'Nashville', state: 'TN', coords: [-86.7816, 36.1627] },
  { city: 'New Orleans', state: 'LA', coords: [-90.0715, 29.9511] },
  { city: 'Las Vegas', state: 'NV', coords: [-115.1398, 36.1699] },
  { city: 'Orlando', state: 'FL', coords: [-81.3792, 28.5383] },
  { city: 'San Diego', state: 'CA', coords: [-117.1611, 32.7157] },
  { city: 'Dallas', state: 'TX', coords: [-96.7970, 32.7767] },
  { city: 'Houston', state: 'TX', coords: [-95.3698, 29.7604] },
  { city: 'Philadelphia', state: 'PA', coords: [-75.1652, 39.9526] },
  { city: 'Atlanta', state: 'GA', coords: [-84.3880, 33.7490] }
];

const interests = [
  ['Music', 'Dancing', 'Fitness', 'Travel', 'Food'],
  ['Reading', 'Writing', 'Photography', 'Art', 'Nature'],
  ['Sports', 'Gaming', 'Technology', 'Movies', 'Cooking'],
  ['Yoga', 'Meditation', 'Hiking', 'Camping', 'Fishing'],
  ['Fashion', 'Beauty', 'Shopping', 'Netflix', 'Coffee'],
  ['Wine', 'Craft Beer', 'Fine Dining', 'Travel', 'Culture'],
  ['Fitness', 'Running', 'Cycling', 'Swimming', 'Gym'],
  ['Pets', 'Animals', 'Volunteering', 'Charity', 'Environment'],
  ['Science', 'Technology', 'Innovation', 'Startups', 'Business'],
  ['Art', 'Museums', 'Theater', 'Concerts', 'Culture']
];

// Add missing bios array
const bios = [
  'Adventure seeker and coffee enthusiast. Love hiking, photography, and trying new restaurants.',
  'Software engineer by day, musician by night. Looking for someone to share life\'s adventures with.',
  'Art teacher and yoga instructor. Passionate about creativity and mindfulness.',
  'Chef who loves creating culinary experiences. Looking for someone to share good food and great conversations.',
  'Marketing professional with a love for fashion and fitness. Always up for trying something new!',
  'Environmental scientist and outdoor enthusiast. Let\'s explore the world together!',
  'Nurse with a heart of gold. Love animals, gardening, and making people smile.',
  'Financial analyst who enjoys the finer things in life. Looking for someone to share adventures with.',
  'Graduate student in psychology. Love learning about people and exploring new places.',
  'Firefighter and fitness enthusiast. Looking for someone who values courage and adventure.',
  'Creative soul who finds beauty in everyday moments. Love art, music, and deep conversations.',
  'Tech enthusiast with a passion for innovation. Always curious and eager to learn new things.',
  'Nature lover and outdoor adventurer. Seeking someone to explore trails and create memories with.',
  'Foodie who believes in the power of good meals and great company. Let\'s cook together!',
  'Fitness fanatic with a heart for helping others. Looking for someone to share healthy lifestyle goals.',
  'Bookworm and travel enthusiast. Love discovering new places and getting lost in good stories.',
  'Artist who sees the world through a creative lens. Seeking someone to inspire and be inspired by.',
  'Music lover and concert-goer. Looking for someone to share playlists and dance with.',
  'Animal lover and volunteer. Passionate about making a difference in the world.',
  'Adventure photographer who captures life\'s beautiful moments. Let\'s create memories together!'
];

// Use pravatar.cc avatars for profile photos
const avatarPhotos = Array.from({ length: 10 }, (_, i) => `https://i.pravatar.cc/400?img=${i + 1}`);

// In the dummyUsers and generated users, use avatarPhotos for the photo URLs
// Replace all Unsplash URLs with avatarPhotos[i % 10]
// For the initial dummyUsers array:
dummyUsers.forEach((user, i) => {
  user.photos = [
    { url: avatarPhotos[i % 10], isPrimary: true },
    { url: avatarPhotos[(i + 1) % 10], isPrimary: false }
  ];
});

// Generate additional 40 users
for (let i = 0; i < 40; i++) {
  const isFemale = Math.random() > 0.5;
  const name = names[Math.floor(Math.random() * names.length)];
  const age = Math.floor(Math.random() * 15) + 22; // 22-37
  const city = cities[Math.floor(Math.random() * cities.length)];
  const userInterests = interests[Math.floor(Math.random() * interests.length)];
  const bio = bios[Math.floor(Math.random() * bios.length)];
  const photo1 = avatarPhotos[i % avatarPhotos.length];
  const photo2 = avatarPhotos[(i + 1) % avatarPhotos.length];

  dummyUsers.push({
    name,
    age,
    gender: isFemale ? 'female' : 'male',
    lookingFor: isFemale ? 'male' : 'female',
    bio,
    interests: userInterests,
    location: { 
      city: city.city, 
      state: city.state, 
      coordinates: city.coords 
    },
    photos: [
      { url: photo1, isPrimary: true },
      { url: photo2, isPrimary: false }
    ],
    lastActive: new Date()
  });
}

function getDateOfBirth(age) {
  const now = new Date();
  return new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
}

dummyUsers.forEach((user, index) => {
  // Generate unique email from name with random number
  const baseEmail = user.name.toLowerCase().replace(/ /g, '.');
  user.email = `${baseEmail}${Math.floor(Math.random() * 1000)}@example.com`;
  user.password = 'dummy123';
  user.dateOfBirth = getDateOfBirth(user.age);
  user.isVerified = true;
  user.isOnline = false;
  user.createdAt = new Date();
  user.updatedAt = new Date();
});

async function createDummyUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    console.log('Clearing existing users...');
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Create new users
    console.log('Creating dummy users...');
    const createdUsers = await User.insertMany(dummyUsers);
    console.log(`Successfully created ${createdUsers.length} dummy users!`);

    console.log('Users are now available in your Discover page.');
    console.log('You can now test the Discover functionality.');

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
createDummyUsers(); 