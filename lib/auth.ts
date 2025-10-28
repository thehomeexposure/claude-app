import { auth, clerkClient, getAuth } from '@clerk/nextjs/server';
import { db } from './db';
import type { NextRequest } from 'next/server';

type AuthRequest = NextRequest | Request;

const resolveAuth = async (req?: AuthRequest) => {
  if (req) {
    const result = await getAuth(req);
    return { userId: result?.userId ?? null };
  }

  return await auth();
};

const ensureDbUser = async (clerkId: string) => {
  const existing = await db.user.findUnique({
    where: { clerkId },
  });

  if (existing) {
    return existing;
  }

  let email: string | null = null;
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
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

export const getCurrentUser = async (req?: AuthRequest) => {
  const { userId } = await resolveAuth(req);

  if (!userId) {
    return null;
  }

  return db.user.findUnique({
    where: { clerkId: userId },
  });
};

export const requireAuth = async (req?: AuthRequest) => {
  const { userId } = await resolveAuth(req);

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return ensureDbUser(userId);
};

export const getOrCreateUser = async (req?: AuthRequest) => {
  const { userId } = await resolveAuth(req);

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return ensureDbUser(userId);
};
