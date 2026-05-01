import { sql } from 'drizzle-orm';
import { char, datetime, index, json, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';

export type PageFeedbackAttachment = {
  assetId: string;
  url: string;
  name: string;
  mime: string;
  size: number;
};

export const pageFeedbackThreads = mysqlTable(
  'page_feedback_threads',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    page_path: varchar('page_path', { length: 512 }).notNull(),
    page_title: varchar('page_title', { length: 255 }),
    subject: varchar('subject', { length: 255 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('open'),
    priority: varchar('priority', { length: 32 }).notNull().default('normal'),
    created_by_user_id: char('created_by_user_id', { length: 36 }),
    assigned_to_user_id: char('assigned_to_user_id', { length: 36 }),
    last_comment_at: datetime('last_comment_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    idx_page_status: index('idx_page_feedback_page_status').on(t.page_path, t.status),
    idx_status_updated: index('idx_page_feedback_status_updated').on(t.status, t.updated_at),
  }),
);

export const pageFeedbackComments = mysqlTable(
  'page_feedback_comments',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    thread_id: char('thread_id', { length: 36 }).notNull(),
    message_type: varchar('message_type', { length: 32 }).notNull().default('comment'),
    body: text('body').notNull(),
    attachments: json('attachments').$type<PageFeedbackAttachment[] | null>().default(null),
    created_by_user_id: char('created_by_user_id', { length: 36 }),
    created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    idx_thread_created: index('idx_page_feedback_comments_thread').on(t.thread_id, t.created_at),
  }),
);

export type PageFeedbackThreadRow = typeof pageFeedbackThreads.$inferSelect;
export type PageFeedbackCommentRow = typeof pageFeedbackComments.$inferSelect;

export type PageFeedbackCommentDto = {
  id: string;
  threadId: string;
  messageType: string;
  body: string;
  attachments: PageFeedbackAttachment[];
  createdByUserId: string | null;
  createdAt: Date | string;
};

export type PageFeedbackThreadDto = {
  id: string;
  pagePath: string;
  pageTitle: string | null;
  subject: string;
  status: string;
  priority: string;
  createdByUserId: string | null;
  assignedToUserId: string | null;
  lastCommentAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  comments: PageFeedbackCommentDto[];
};

function parseAttachments(value: unknown): PageFeedbackAttachment[] {
  if (Array.isArray(value)) return value as PageFeedbackAttachment[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function commentRowToDto(row: PageFeedbackCommentRow): PageFeedbackCommentDto {
  return {
    id: row.id,
    threadId: row.thread_id,
    messageType: row.message_type,
    body: row.body,
    attachments: parseAttachments(row.attachments),
    createdByUserId: row.created_by_user_id ?? null,
    createdAt: row.created_at,
  };
}

export function threadRowToDto(
  row: PageFeedbackThreadRow,
  comments: PageFeedbackCommentRow[] = [],
): PageFeedbackThreadDto {
  return {
    id: row.id,
    pagePath: row.page_path,
    pageTitle: row.page_title ?? null,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    createdByUserId: row.created_by_user_id ?? null,
    assignedToUserId: row.assigned_to_user_id ?? null,
    lastCommentAt: row.last_comment_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comments: comments.map(commentRowToDto),
  };
}
