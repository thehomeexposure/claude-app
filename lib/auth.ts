import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';

export const getCurrentUser = async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
};

export const requireAuth = async () => {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error('Unauthorized');
  }

  let user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // Auto-create user if they don't exist in database
  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
      },
    });
  }

  return user;
};

export const getOrCreateUser = async () => {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error('Unauthorized');
  }

  let user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
      },
    });
  }

  return user;
};