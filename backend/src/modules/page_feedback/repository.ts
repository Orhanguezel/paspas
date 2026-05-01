import { randomUUID } from 'node:crypto';

import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';

import { pageFeedbackComments, pageFeedbackThreads } from './schema';
import type { PageFeedbackCommentRow, PageFeedbackThreadRow } from './schema';
import type {
  CreatePageFeedbackBody,
  CreatePageFeedbackCommentBody,
  ListPageFeedbackQuery,
  UpdatePageFeedbackBody,
} from './validation';

function buildWhere(query: ListPageFeedbackQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.pagePath) conditions.push(eq(pageFeedbackThreads.page_path, query.pagePath));
  if (query.status) conditions.push(eq(pageFeedbackThreads.status, query.status));
  if (conditions.length === 0) return undefined;
  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export async function repoListPageFeedback(query: ListPageFeedbackQuery): Promise<{
  items: PageFeedbackThreadRow[];
  comments: PageFeedbackCommentRow[];
  total: number;
}> {
  const where = buildWhere(query);
  const [items, counts] = await Promise.all([
    db
      .select()
      .from(pageFeedbackThreads)
      .where(where)
      .orderBy(desc(pageFeedbackThreads.last_comment_at), desc(pageFeedbackThreads.created_at))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(pageFeedbackThreads).where(where),
  ]);

  const ids = items.map((item) => item.id);
  const comments = ids.length
    ? await db
        .select()
        .from(pageFeedbackComments)
        .where(inArray(pageFeedbackComments.thread_id, ids))
        .orderBy(pageFeedbackComments.created_at)
    : [];

  return { items, comments, total: Number(counts[0]?.count ?? 0) };
}

export async function repoGetPageFeedback(id: string): Promise<{
  thread: PageFeedbackThreadRow | null;
  comments: PageFeedbackCommentRow[];
}> {
  const rows = await db.select().from(pageFeedbackThreads).where(eq(pageFeedbackThreads.id, id)).limit(1);
  const thread = rows[0] ?? null;
  if (!thread) return { thread: null, comments: [] };

  const comments = await db
    .select()
    .from(pageFeedbackComments)
    .where(eq(pageFeedbackComments.thread_id, id))
    .orderBy(pageFeedbackComments.created_at);

  return { thread, comments };
}

export async function repoCreatePageFeedback(
  body: CreatePageFeedbackBody,
  userId: string | null,
): Promise<{ thread: PageFeedbackThreadRow; comments: PageFeedbackCommentRow[] }> {
  const threadId = randomUUID();
  const commentId = randomUUID();

  await db.insert(pageFeedbackThreads).values({
    id: threadId,
    page_path: body.pagePath,
    page_title: body.pageTitle || null,
    subject: body.subject,
    priority: body.priority,
    created_by_user_id: userId,
  });

  await db.insert(pageFeedbackComments).values({
    id: commentId,
    thread_id: threadId,
    message_type: body.messageType,
    body: body.body,
    attachments: body.attachments,
    created_by_user_id: userId,
  });

  return repoGetPageFeedback(threadId) as Promise<{ thread: PageFeedbackThreadRow; comments: PageFeedbackCommentRow[] }>;
}

export async function repoCreatePageFeedbackComment(
  threadId: string,
  body: CreatePageFeedbackCommentBody,
  userId: string | null,
): Promise<{ thread: PageFeedbackThreadRow | null; comments: PageFeedbackCommentRow[] }> {
  const existing = await repoGetPageFeedback(threadId);
  if (!existing.thread) return { thread: null, comments: [] };

  await db.insert(pageFeedbackComments).values({
    id: randomUUID(),
    thread_id: threadId,
    message_type: body.messageType,
    body: body.body,
    attachments: body.attachments,
    created_by_user_id: userId,
  });

  await db
    .update(pageFeedbackThreads)
    .set({
      status: body.messageType === 'question'
        ? 'needs_info'
        : body.messageType === 'solution'
          ? 'planned'
          : existing.thread.status === 'resolved' || existing.thread.status === 'closed'
            ? 'open'
            : existing.thread.status,
      last_comment_at: sql`CURRENT_TIMESTAMP` as any,
      updated_at: sql`CURRENT_TIMESTAMP` as any,
    })
    .where(eq(pageFeedbackThreads.id, threadId));

  return repoGetPageFeedback(threadId);
}

export async function repoUpdatePageFeedback(
  id: string,
  body: UpdatePageFeedbackBody,
): Promise<{ thread: PageFeedbackThreadRow | null; comments: PageFeedbackCommentRow[] }> {
  const patch: Partial<typeof pageFeedbackThreads.$inferInsert> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.priority !== undefined) patch.priority = body.priority;
  if (body.assignedToUserId !== undefined) patch.assigned_to_user_id = body.assignedToUserId || null;
  patch.updated_at = sql`CURRENT_TIMESTAMP` as any;

  await db.update(pageFeedbackThreads).set(patch).where(eq(pageFeedbackThreads.id, id));
  return repoGetPageFeedback(id);
}
