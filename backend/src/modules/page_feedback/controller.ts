import type { FastifyReply, RouteHandler } from 'fastify';

import { createAdminNotification } from '@/modules/notifications/controller';

import { threadRowToDto } from './schema';
import {
  repoCreatePageFeedback,
  repoCreatePageFeedbackComment,
  repoGetPageFeedback,
  repoListPageFeedback,
  repoUpdatePageFeedback,
} from './repository';
import {
  createPageFeedbackCommentSchema,
  createPageFeedbackSchema,
  listPageFeedbackQuerySchema,
  updatePageFeedbackSchema,
} from './validation';

function getUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

async function notifyAdmins(input: { title: string; message: string }) {
  try {
    await createAdminNotification({
      title: input.title,
      message: input.message,
      type: 'page_feedback',
    });
  } catch {
    // Feedback kaydini bildirim hatasi yuzunden bozma.
  }
}

export const listPageFeedback: RouteHandler = async (req, reply) => {
  try {
    const parsed = listPageFeedbackQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    }
    const { items, comments, total } = await repoListPageFeedback(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send({
      items: items.map((row) => threadRowToDto(row, comments.filter((comment) => comment.thread_id === row.id))),
      total,
    });
  } catch (error) {
    req.log.error({ error }, 'list_page_feedback_failed');
    return sendInternalError(reply);
  }
};

export const getPageFeedback: RouteHandler = async (req, reply) => {
  try {
    const id = String((req.params as { id?: string }).id || '');
    const { thread, comments } = await repoGetPageFeedback(id);
    if (!thread) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    return reply.send(threadRowToDto(thread, comments));
  } catch (error) {
    req.log.error({ error }, 'get_page_feedback_failed');
    return sendInternalError(reply);
  }
};

export const createPageFeedback: RouteHandler = async (req, reply) => {
  try {
    const parsed = createPageFeedbackSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const { thread, comments } = await repoCreatePageFeedback(parsed.data, getUserId(req));
    await notifyAdmins({
      title: 'Yeni yazilimci notu',
      message: `${parsed.data.pagePath}: ${parsed.data.subject}`,
    });
    return reply.code(201).send(threadRowToDto(thread, comments));
  } catch (error) {
    req.log.error({ error }, 'create_page_feedback_failed');
    return sendInternalError(reply);
  }
};

export const addPageFeedbackComment: RouteHandler = async (req, reply) => {
  try {
    const id = String((req.params as { id?: string }).id || '');
    const parsed = createPageFeedbackCommentSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const { thread, comments } = await repoCreatePageFeedbackComment(id, parsed.data, getUserId(req));
    if (!thread) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    await notifyAdmins({
      title: parsed.data.messageType === 'question' ? 'Netlestirme sorusu eklendi' : parsed.data.messageType === 'solution' ? 'Cozum notu eklendi' : 'Yazilimci notuna yorum eklendi',
      message: `${thread.page_path}: ${thread.subject}`,
    });
    return reply.code(201).send(threadRowToDto(thread, comments));
  } catch (error) {
    req.log.error({ error }, 'add_page_feedback_comment_failed');
    return sendInternalError(reply);
  }
};

export const updatePageFeedback: RouteHandler = async (req, reply) => {
  try {
    const id = String((req.params as { id?: string }).id || '');
    const parsed = updatePageFeedbackSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const { thread, comments } = await repoUpdatePageFeedback(id, parsed.data);
    if (!thread) return reply.code(404).send({ error: { message: 'not_bulunamadi' } });
    return reply.send(threadRowToDto(thread, comments));
  } catch (error) {
    req.log.error({ error }, 'update_page_feedback_failed');
    return sendInternalError(reply);
  }
};
