import type { RouteHandler, FastifyRequest } from 'fastify';
import '@fastify/jwt';
import { db } from '@/db/client';
import { eq } from 'drizzle-orm';
import { profiles, type ProfileRow, type ProfileInsert } from './schema';
import { profileUpsertSchema, type ProfileUpsertInput } from './validation';
import { ZodError } from 'zod';

export type ProfileUpsertRequest = { profile: ProfileUpsertInput };

type JwtUser = { sub?: unknown };

function getUserId(req: FastifyRequest): string {
  // requireAuth sonrası fastify-jwt payload'ını req.user'a yazar.
  const payload = (req as unknown as { user?: JwtUser }).user;
  const subVal = payload?.sub;
  if (typeof subVal !== 'string' || subVal.length === 0) {
    throw new Error('unauthorized');
  }
  return subVal; // UUID
}

/** GET /profiles/v1/me */
export const getMyProfile: RouteHandler = async (req, reply) => {
  try {
    const userId = getUserId(req);
    const rows = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    const row: ProfileRow | undefined = rows[0];
    return reply.send(row ?? null);
  } catch (e: unknown) {
    req.log.error(e);
    if (e instanceof Error && e.message === 'unauthorized') {
      return reply.status(401).send({ error: { message: 'unauthorized' } });
    }
    return reply.status(500).send({ error: { message: 'profile_fetch_failed' } });
  }
};

/** PUT /profiles/v1/me (upsert) */
export const upsertMyProfile: RouteHandler<{ Body: ProfileUpsertRequest }> = async (req, reply) => {
  try {
    const userId = getUserId(req);
    const input = profileUpsertSchema.parse(req.body?.profile ?? {});

    const set: Partial<ProfileInsert> = {
      ...(input.full_name !== undefined ? { full_name: input.full_name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatar_url !== undefined ? { avatar_url: input.avatar_url } : {}),
      ...(input.address_line1 !== undefined ? { address_line1: input.address_line1 } : {}),
      ...(input.address_line2 !== undefined ? { address_line2: input.address_line2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.postal_code !== undefined ? { postal_code: input.postal_code } : {}),
      // wallet_balance bu tabloda YOK; users tablosunda tutuluyor.
    };

    const existing = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

    if (existing.length > 0) {
      await db
        .update(profiles)
        .set({ ...set, updated_at: new Date() })
        .where(eq(profiles.id, userId));
    } else {
      const insertValues: ProfileInsert = {
        id: userId,
        ...set,
      };
      await db.insert(profiles).values(insertValues);
    }

    const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    return reply.send(row);
  } catch (e: unknown) {
    req.log.error(e);
    if (e instanceof ZodError) {
      return reply.status(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e instanceof Error && e.message === 'unauthorized') {
      return reply.status(401).send({ error: { message: 'unauthorized' } });
    }
    return reply.status(500).send({ error: { message: 'profile_upsert_failed' } });
  }
};
