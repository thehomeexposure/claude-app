import { auth, clerkClient, getAuth } from '@clerk/nextjs/server';
import { db } from './db';
import type { NextRequest } from 'next/server';

type AuthRequest = NextRequest;

const isProd = process.env.NODE_ENV === 'production';
const allowDevAuth = !isProd || process.env.ALLOW_DEV_AUTH === 'true';
const fallbackUserId = () =>
  process.env.DEV_CLERK_USER_ID?.trim() || 'local-dev-user';

const resolveAuth = async (req?: AuthRequest) => {
  if (req) {
    try {
      const result = await getAuth(req);
      if (result?.userId) {
        return { userId: result.userId };
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('getAuth failed for request', error);
      }
    }
  }

  const { userId } = await auth();
  if (userId) {
    return { userId };
  }

  if (allowDevAuth) {
    return { userId: fallbackUserId() };
  }

  return { userId: null };
};

const ensureDbUser = async (clerkId: string) => {
  const existing = await db.user.findUnique({
    where: { clerkId },
  });

  if (existing) {
    return existing;
  }

  let email: string | null = null;
  const isFallbackUser = clerkId === fallbackUserId();
  const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY);

  if (clerkConfigured && !isFallbackUser) {
    try {
      const client =
        typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
      const clerkUser = await client.users.getUser(clerkId);
      email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        null;
    } catch (err) {
      if (!isProd) {
        console.error('Failed to load Clerk user profile', err);
      }
    }
  } else if (allowDevAuth) {
    email = 'dev-user@example.com';
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
