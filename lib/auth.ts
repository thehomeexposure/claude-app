import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from './db';

const ensureDbUser = async (clerkId: string) => {
  const existing = await db.user.findUnique({
    where: { clerkId },
  });

  if (existing) {
    return existing;
  }

  let email: string | null = null;
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to load Clerk user profile', err);
    }
  }

  return db.user.create({
    data: {
      clerkId,
      email,
    },
  });
};

export const getCurrentUser = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  return db.user.findUnique({
    where: { clerkId: userId },
  });
};

export const requireAuth = async () => {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return ensureDbUser(userId);
};

export const getOrCreateUser = async () => {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return ensureDbUser(userId);
};
