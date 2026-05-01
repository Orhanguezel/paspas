import { z } from 'zod';

export const feedbackStatusSchema = z.enum(['open', 'needs_info', 'in_review', 'planned', 'resolved', 'closed']);
export const feedbackPrioritySchema = z.enum(['low', 'normal', 'high', 'critical']);
export const feedbackMessageTypeSchema = z.enum(['report', 'comment', 'question', 'answer', 'solution', 'system']);

export const attachmentSchema = z.object({
  assetId: z.string().trim().min(1).max(36),
  url: z.string().trim().min(1).max(2000),
  name: z.string().trim().min(1).max(255),
  mime: z.string().trim().min(1).max(127),
  size: z.coerce.number().int().min(0).max(25 * 1024 * 1024),
});

export const listPageFeedbackQuerySchema = z.object({
  pagePath: z.string().trim().min(1).max(512).optional(),
  status: feedbackStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createPageFeedbackSchema = z.object({
  pagePath: z.string().trim().min(1).max(512),
  pageTitle: z.string().trim().max(255).optional(),
  subject: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1).max(10000),
  priority: feedbackPrioritySchema.optional().default('normal'),
  messageType: feedbackMessageTypeSchema.optional().default('report'),
  attachments: z.array(attachmentSchema).max(10).optional().default([]),
});

export const createPageFeedbackCommentSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  messageType: feedbackMessageTypeSchema.optional().default('comment'),
  attachments: z.array(attachmentSchema).max(10).optional().default([]),
});

export const updatePageFeedbackSchema = z.object({
  status: feedbackStatusSchema.optional(),
  priority: feedbackPrioritySchema.optional(),
  assignedToUserId: z.string().trim().min(1).max(36).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'no_fields_to_update' });

export type ListPageFeedbackQuery = z.infer<typeof listPageFeedbackQuerySchema>;
export type CreatePageFeedbackBody = z.infer<typeof createPageFeedbackSchema>;
export type CreatePageFeedbackCommentBody = z.infer<typeof createPageFeedbackCommentSchema>;
export type UpdatePageFeedbackBody = z.infer<typeof updatePageFeedbackSchema>;
