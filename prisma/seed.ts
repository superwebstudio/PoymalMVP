import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Clean up existing data
  await prisma.reaction.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.like.deleteMany();
  await prisma.catch.deleteMany();
  await prisma.user.deleteMany();

  console.log('Deleted existing data.');

  // 2. Create Mock Users
  // These auth IDs are placeholders for local seed data.
  const user1 = await prisma.user.create({
    data: {
      authId: 'seed-alex',
      email: 'alex@example.com',
      firstName: 'Alex',
      username: 'alex_angler',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      isPro: true,
      isAdmin: true,
      language: 'en',
      aiUsageCount: 5,
      catchViewMode: 'grid',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      authId: 'seed-ivan',
      email: 'ivan@example.com',
      firstName: 'Ivan',
      username: 'ivan_fish',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan',
      isPro: false,
      language: 'ru',
      aiUsageCount: 0,
      catchViewMode: 'list',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      authId: 'seed-maria',
      email: 'maria@example.com',
      firstName: 'Maria',
      username: 'maria_fishing',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      isPro: false,
      language: 'ru',
      aiUsageCount: 1,
      catchViewMode: 'grid',
    },
  });

  console.log('Created mock users:', user1.username, user2.username, user3.username);

  // 3. Create Mock Catches
  const catch1 = await prisma.catch.create({
    data: {
      userId: user1.id,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Esox_lucius_ZOO_2.jpg/640px-Esox_lucius_ZOO_2.jpg',
      species: 'Northern Pike',
      description: 'Caught this beauty early morning near the reeds. Put up a great fight!',
      weight: 4.5,
      length: 85,
      location: 'Volga River',
      latitude: 56.8389,
      longitude: 60.6057,
      isPublic: true,
      locationPrivate: false,
      depth: 3.5,
      waterTemp: 18.5,
      bait: 'Spinnerbait',
      method: 'Spinning',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
  });

  const catch2 = await prisma.catch.create({
    data: {
      userId: user2.id,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Perca_fluviatilis_Prague_Vltava_4.jpg/640px-Perca_fluviatilis_Prague_Vltava_4.jpg',
      species: 'European Perch',
      description: 'Nice perch from Lake Ladoga. Perfect size!',
      weight: 0.8,
      length: 25,
      location: 'Lake Ladoga',
      isPublic: true,
      locationPrivate: false,
      bait: 'Worm',
      method: 'Bottom fishing',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  });

  const catch3 = await prisma.catch.create({
    data: {
      userId: user1.id,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Zander_file.jpg/640px-Zander_file.jpg',
      species: 'Zander',
      description: 'Caught at dusk using a jig. Great evening session!',
      weight: 2.1,
      length: 55,
      location: 'Moscow Canal',
      isPublic: true,
      locationPrivate: true,
      depth: 5.0,
      waterTemp: 16.0,
      bait: 'Jig',
      method: 'Jigging',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
  });

  const catch4 = await prisma.catch.create({
    data: {
      userId: user3.id,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Carp_bream1.jpg/640px-Carp_bream1.jpg',
      species: 'Common Bream',
      description: 'Peaceful morning catch',
      weight: 1.2,
      length: 35,
      location: 'Don River',
      isPublic: true,
      locationPrivate: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    },
  });

  console.log('Created mock catches.');

  // 4. Create Reactions
  await prisma.reaction.createMany({
    data: [
      { userId: user2.id, catchId: catch1.id, emoji: '🔥' },
      { userId: user3.id, catchId: catch1.id, emoji: '💪' },
      { userId: user1.id, catchId: catch2.id, emoji: '👍' },
      { userId: user3.id, catchId: catch3.id, emoji: '🎣' },
    ],
  });

  console.log('Created mock reactions.');

  // 5. Create Follows
  await prisma.follow.createMany({
    data: [
      { followerId: user2.id, followingId: user1.id },
      { followerId: user3.id, followingId: user1.id },
      { followerId: user1.id, followingId: user2.id },
    ],
  });

  console.log('Created mock follows.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
