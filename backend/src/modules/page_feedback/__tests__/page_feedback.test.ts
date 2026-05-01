import { describe, expect, it } from 'bun:test';

import {
  createPageFeedbackCommentSchema,
  createPageFeedbackSchema,
  listPageFeedbackQuerySchema,
  updatePageFeedbackSchema,
} from '../validation';

const attachment = {
  assetId: 'asset-1',
  url: '/storage/page-feedback/test.png',
  name: 'test.png',
  mime: 'image/png',
  size: 1024,
};

describe('page feedback validation', () => {
  it('accepts a page note with multiple image attachments', () => {
    const result = createPageFeedbackSchema.safeParse({
      pagePath: '/admin/urunler',
      pageTitle: 'Urunler',
      subject: 'Tablo filtre problemi',
      body: 'Filtre acilinca sonuclar gec geliyor.',
      priority: 'high',
      messageType: 'report',
      attachments: [attachment, { ...attachment, assetId: 'asset-2', name: 'ikinci.png' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty note body', () => {
    expect(createPageFeedbackSchema.safeParse({
      pagePath: '/admin/urunler',
      subject: 'Eksik',
      body: ' ',
    }).success).toBe(false);
  });

  it('accepts comment payload', () => {
    expect(createPageFeedbackCommentSchema.safeParse({
      body: 'Bu sorun tekrar goruldu.',
      messageType: 'question',
      attachments: [attachment],
    }).success).toBe(true);
  });

  it('accepts needs_info status', () => {
    expect(updatePageFeedbackSchema.safeParse({ status: 'needs_info' }).success).toBe(true);
  });

  it('accepts list filters', () => {
    const parsed = listPageFeedbackQuerySchema.parse({
      pagePath: '/admin/sistem',
      status: 'open',
      limit: '10',
      offset: '0',
    });
    expect(parsed.limit).toBe(10);
    expect(parsed.status).toBe('open');
  });

  it('rejects empty update payload', () => {
    const result = updatePageFeedbackSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
