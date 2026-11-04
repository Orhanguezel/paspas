import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';

import { pool } from '@/db/client';
import type { PageFeedbackThreadDto } from './schema';

const idSchema = z.object({ id: z.string().uuid() });
const watcherSchema = z.object({ id: z.string().uuid(), userId: z.string().uuid() });
const actionSchema = z.object({
  party: z.enum(['biz', 'talep_sahibi', 'baska', 'kimse']),
  workPhase: z.enum(['ongoing', 'approval']).nullable().optional(),
  expectedAction: z.string().trim().max(1000).nullable().optional(),
});
const releaseSchema = z.object({
  releaseState: z.enum(['deployed', 'not_deployed', 'withdrawn']),
  evidence: z.string().trim().min(10).max(1000),
});

function actor(req: FastifyRequest) {
  const user = (req as { user?: { sub?: string; id?: string } }).user;
  return user?.sub ?? user?.id ?? null;
}

async function actorName(userId: string | null) {
  if (!userId) return null;
  const [rows] = await pool.query<(RowDataPacket & { name: string })[]>(
    'SELECT COALESCE(NULLIF(TRIM(full_name), ?), email) AS name FROM users WHERE id=? LIMIT 1', ['', userId]);
  return rows[0]?.name ?? null;
}

async function exists(threadId: string) {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM page_feedback_threads WHERE id=? LIMIT 1', [threadId]);
  return rows.length > 0;
}

type ActionRow = RowDataPacket & {
  id: string; thread_id: string; party: string; work_phase: string | null;
  expected_action: string | null; changed_by_name: string | null; created_at: string;
};
type ReleaseRow = RowDataPacket & {
  id: string; thread_id: string; release_state: string; evidence: string;
  changed_by_name: string | null; created_at: string;
};

export async function hydrateDesk(items: PageFeedbackThreadDto[]) {
  if (!items.length) return items;
  const ids = items.map((item) => item.id);
  const marks = ids.map(() => '?').join(',');
  const [actionsResult, releasesResult, watchersResult] = await Promise.all([
    pool.query<ActionRow[]>(`SELECT * FROM page_feedback_actions WHERE thread_id IN (${marks}) ORDER BY created_at DESC, id DESC`, ids),
    pool.query<ReleaseRow[]>(`SELECT * FROM page_feedback_releases WHERE thread_id IN (${marks}) ORDER BY created_at DESC, id DESC`, ids),
    pool.query<(RowDataPacket & { thread_id: string; total: number })[]>(`SELECT thread_id,COUNT(*) AS total FROM page_feedback_watchers WHERE thread_id IN (${marks}) GROUP BY thread_id`, ids),
  ]);
  const actions = new Map<string, ActionRow>();
  const releases = new Map<string, ReleaseRow>();
  for (const row of actionsResult[0]) if (!actions.has(row.thread_id)) actions.set(row.thread_id, row);
  for (const row of releasesResult[0]) if (!releases.has(row.thread_id)) releases.set(row.thread_id, row);
  const watcherCounts = new Map(watchersResult[0].map((row) => [row.thread_id, Number(row.total)]));
  return items.map((item) => {
    const action = actions.get(item.id);
    const release = releases.get(item.id);
    return {
      ...item,
      nextAction: action ? { party: action.party, workPhase: action.work_phase, expectedAction: action.expected_action, changedAt: action.created_at } : null,
      release: release ? { state: release.release_state, evidence: release.evidence, changedAt: release.created_at } : null,
      watcherCount: watcherCounts.get(item.id) ?? 0,
    };
  });
}

function bad(reply: FastifyReply, message = 'gecersiz_istek') { return reply.code(400).send({ error: { message } }); }
function fail(req: FastifyRequest, reply: FastifyReply, error: unknown) {
  req.log.error({ error }, 'page_feedback_desk_failed');
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export async function listActions(req: FastifyRequest, reply: FastifyReply) {
  const params = idSchema.safeParse(req.params); if (!params.success) return bad(reply);
  try {
    if (!(await exists(params.data.id))) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    const [rows] = await pool.query<ActionRow[]>('SELECT * FROM page_feedback_actions WHERE thread_id=? ORDER BY created_at DESC,id DESC', [params.data.id]);
    return { items: rows.map((r) => ({ id: r.id, party: r.party, workPhase: r.work_phase, expectedAction: r.expected_action, changedByName: r.changed_by_name, changedAt: r.created_at })) };
  } catch (error) { return fail(req, reply, error); }
}

export async function setAction(req: FastifyRequest, reply: FastifyReply) {
  const params = idSchema.safeParse(req.params); const body = actionSchema.safeParse(req.body);
  if (!params.success || !body.success) return bad(reply);
  try {
    if (!(await exists(params.data.id))) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    const userId = actor(req);
    await pool.query('INSERT INTO page_feedback_actions (id,thread_id,party,work_phase,expected_action,changed_by_user_id,changed_by_name) VALUES (?,?,?,?,?,?,?)',
      [randomUUID(), params.data.id, body.data.party, body.data.workPhase ?? null, body.data.expectedAction ?? null, userId, await actorName(userId)]);
    return { ok: true };
  } catch (error) { return fail(req, reply, error); }
}

export async function listReleases(req: FastifyRequest, reply: FastifyReply) {
  const params = idSchema.safeParse(req.params); if (!params.success) return bad(reply);
  try {
    if (!(await exists(params.data.id))) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    const [rows] = await pool.query<ReleaseRow[]>('SELECT * FROM page_feedback_releases WHERE thread_id=? ORDER BY created_at DESC,id DESC', [params.data.id]);
    return { items: rows.map((r) => ({ id: r.id, state: r.release_state, evidence: r.evidence, changedByName: r.changed_by_name, changedAt: r.created_at })) };
  } catch (error) { return fail(req, reply, error); }
}

export async function setRelease(req: FastifyRequest, reply: FastifyReply) {
  const params = idSchema.safeParse(req.params); const body = releaseSchema.safeParse(req.body);
  if (!params.success || !body.success) return bad(reply);
  try {
    if (!(await exists(params.data.id))) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    const userId = actor(req);
    await pool.query('INSERT INTO page_feedback_releases (id,thread_id,release_state,evidence,changed_by_user_id,changed_by_name) VALUES (?,?,?,?,?,?)',
      [randomUUID(), params.data.id, body.data.releaseState, body.data.evidence, userId, await actorName(userId)]);
    return { ok: true };
  } catch (error) { return fail(req, reply, error); }
}

export async function listWatchers(req: FastifyRequest, reply: FastifyReply) {
  const params = idSchema.safeParse(req.params); if (!params.success) return bad(reply);
  try {
    if (!(await exists(params.data.id))) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    const [rows] = await pool.query<(RowDataPacket & { userId: string; name: string })[]>(
      'SELECT u.id AS userId,COALESCE(NULLIF(TRIM(u.full_name), ?),u.email) AS name FROM page_feedback_watchers w JOIN users u ON u.id=w.user_id WHERE w.thread_id=? ORDER BY name', ['', params.data.id]);
    return { items: rows };
  } catch (error) { return fail(req, reply, error); }
}

export async function listWatcherCandidates(req: FastifyRequest, reply: FastifyReply) {
  try {
    const [rows] = await pool.query<(RowDataPacket & { userId: string; name: string })[]>(
      'SELECT id AS userId,COALESCE(NULLIF(TRIM(full_name), ?),email) AS name FROM users WHERE is_active=1 ORDER BY name LIMIT 500', ['']);
    return { items: rows };
  } catch (error) { return fail(req, reply, error); }
}

export async function addWatcher(req: FastifyRequest, reply: FastifyReply) {
  const params = idSchema.safeParse(req.params); const body = z.object({ userId: z.string().uuid() }).safeParse(req.body);
  if (!params.success || !body.success) return bad(reply);
  try {
    if (!(await exists(params.data.id))) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    const [users] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE id=? AND is_active=1 LIMIT 1', [body.data.userId]);
    if (!users.length) return bad(reply, 'kullanici_bulunamadi');
    await pool.query('INSERT IGNORE INTO page_feedback_watchers (thread_id,user_id) VALUES (?,?)', [params.data.id, body.data.userId]);
    return { ok: true };
  } catch (error) { return fail(req, reply, error); }
}

export async function removeWatcher(req: FastifyRequest, reply: FastifyReply) {
  const params = watcherSchema.safeParse(req.params); if (!params.success) return bad(reply);
  try {
    await pool.query('DELETE FROM page_feedback_watchers WHERE thread_id=? AND user_id=?', [params.data.id, params.data.userId]);
    return { ok: true };
  } catch (error) { return fail(req, reply, error); }
}
