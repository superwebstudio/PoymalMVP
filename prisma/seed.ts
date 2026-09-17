import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';
import seedData from './seed-data.json';

const prisma = new PrismaClient();

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'fishing pics');
const PUBLIC_DIR = path.join(ROOT, 'public', 'seed-catches');

type SeedUser = (typeof seedData.users)[number];
type SeedCatch = (typeof seedData.catches)[number];

function slugifyFilename(filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const slug = base
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}${ext.toLowerCase()}`;
}

function copySeedImages(): Map<string, string> {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Missing image folder: ${SOURCE_DIR}`);
  }

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const imageMap = new Map<string, string>();
  const files = fs.readdirSync(SOURCE_DIR);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.avif', '.webp'].includes(ext)) {
      continue;
    }

    const slug = slugifyFilename(file);
    fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(PUBLIC_DIR, slug));
    imageMap.set(file, `/seed-catches/${slug}`);
  }

  return imageMap;
}

function hoursAgoDate(hoursAgo: number): Date {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

function weatherPayload(catchItem: SeedCatch): Prisma.InputJsonValue | undefined {
  if (!catchItem.weather) {
    return undefined;
  }

  return {
    weather: catchItem.weather,
    marine: catchItem.marine ?? null,
    locationName: catchItem.location,
    fetchedAt: hoursAgoDate(catchItem.hoursAgo).toISOString(),
  };
}

async function main(): Promise<void> {
  const imageMap = copySeedImages();
  console.log(`Copied ${imageMap.size} seed images to public/seed-catches.`);

  await prisma.user.deleteMany({
    where: { authId: { startsWith: 'seed-' } },
  });
  console.log('Removed previous seed users and related rows.');

  const usersByKey = new Map<string, { id: string; username: string | null }>();

  for (const user of seedData.users as SeedUser[]) {
    const created = await prisma.user.create({
      data: {
        authId: user.authId,
        email: user.email,
        firstName: user.firstName,
        username: user.username,
        photoUrl: user.photoUrl,
        isPro: user.isPro,
        language: user.language,
        country: user.country,
        catchViewMode: user.catchViewMode,
        showCountryBadge: true,
        notificationsEnabled: true,
      },
      select: { id: true, username: true },
    });
    usersByKey.set(user.key, created);
  }

  console.log(`Created ${usersByKey.size} seed anglers.`);

  const catchesByKey = new Map<string, { id: string }>();

  for (const catchItem of seedData.catches as SeedCatch[]) {
    const user = usersByKey.get(catchItem.userKey);
    if (!user) {
      throw new Error(`Unknown userKey on catch ${catchItem.key}: ${catchItem.userKey}`);
    }

    const imageUrl = imageMap.get(catchItem.imageFile);
    if (!imageUrl) {
      throw new Error(`Missing image file for catch ${catchItem.key}: ${catchItem.imageFile}`);
    }

    const created = await prisma.catch.create({
      data: {
        userId: user.id,
        imageUrl,
        species: catchItem.species,
        scientificName: catchItem.scientificName,
        description: catchItem.description,
        weight: catchItem.weight,
        length: catchItem.length,
        location: catchItem.location,
        latitude: catchItem.latitude,
        longitude: catchItem.longitude,
        depth: catchItem.depth,
        waterTemp: catchItem.waterTemp,
        bait: catchItem.bait,
        method: catchItem.method,
        rating: catchItem.rating,
        isPublic: true,
        locationPrivate: catchItem.locationPrivate,
        isTextOnly: false,
        postType: 'catch',
        weatherData: weatherPayload(catchItem),
        createdAt: hoursAgoDate(catchItem.hoursAgo),
      },
      select: { id: true },
    });
    catchesByKey.set(catchItem.key, created);
  }

  console.log(`Created ${catchesByKey.size} seed catches.`);

  const followRows = seedData.follows.flatMap(([followerKey, followingKey]) => {
    const follower = usersByKey.get(followerKey);
    const following = usersByKey.get(followingKey);
    if (!follower || !following || follower.id === following.id) {
      return [];
    }
    return [{ followerId: follower.id, followingId: following.id }];
  });

  if (followRows.length > 0) {
    await prisma.follow.createMany({ data: followRows, skipDuplicates: true });
  }

  const reactionRows = seedData.reactions.flatMap((row) => {
    const user = usersByKey.get(row.userKey);
    const catchRow = catchesByKey.get(row.catchKey);
    if (!user || !catchRow) {
      return [];
    }
    return [{ userId: user.id, catchId: catchRow.id, emoji: row.emoji }];
  });

  if (reactionRows.length > 0) {
    await prisma.reaction.createMany({ data: reactionRows, skipDuplicates: true });
  }

  const likeRows = seedData.likes.flatMap((row) => {
    const user = usersByKey.get(row.userKey);
    const catchRow = catchesByKey.get(row.catchKey);
    if (!user || !catchRow) {
      return [];
    }
    return [{ userId: user.id, catchId: catchRow.id }];
  });

  if (likeRows.length > 0) {
    await prisma.like.createMany({ data: likeRows, skipDuplicates: true });
  }

  for (const comment of seedData.comments) {
    const user = usersByKey.get(comment.userKey);
    const catchRow = catchesByKey.get(comment.catchKey);
    if (!user || !catchRow) {
      continue;
    }
    await prisma.comment.create({
      data: {
        userId: user.id,
        catchId: catchRow.id,
        content: comment.content,
      },
    });
  }

  console.log(
    `Seeded ${followRows.length} follows, ${reactionRows.length} reactions, ${likeRows.length} likes, ${seedData.comments.length} comments.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
