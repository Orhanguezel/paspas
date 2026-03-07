import { toBool, toNumber, toStr, type BoolLike } from '@/integrations/shared';

export type CouponDiscountType = 'percent' | 'amount';

export type CouponView = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  max_uses: number | null;
  uses_count: number;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CouponListQuery = {
  q?: string;
  is_active?: BoolLike;
  active_now?: BoolLike;
  sort?: 'created_at' | 'updated_at' | 'uses_count' | 'end_at';
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export type CouponCreatePayload = {
  code: string;
  title: string;
  description?: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_amount?: number | null;
  max_discount?: number | null;
  max_uses?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  is_active?: BoolLike;
  image_url?: string | null;
};

export type CouponUpdatePayload = Partial<CouponCreatePayload>;

export function normalizeCoupon(row: unknown): CouponView {
  const r = (row ?? {}) as Record<string, unknown>;
  return {
    id: toStr(r.id),
    code: toStr(r.code),
    title: toStr(r.title),
    description: toStr(r.description) || null,
    discount_type: toStr(r.discount_type) === 'amount' ? 'amount' : 'percent',
    discount_value: toNumber(r.discount_value, 0),
    min_order_amount: r.min_order_amount != null ? toNumber(r.min_order_amount, 0) : null,
    max_discount: r.max_discount != null ? toNumber(r.max_discount, 0) : null,
    max_uses: r.max_uses != null ? toNumber(r.max_uses, 0) : null,
    uses_count: toNumber(r.uses_count, 0),
    start_at: toStr(r.start_at) || null,
    end_at: toStr(r.end_at) || null,
    is_active: toBool(r.is_active, false),
    image_url: toStr(r.image_url) || null,
    created_at: toStr(r.created_at),
    updated_at: toStr(r.updated_at),
  };
}

export function normalizeCouponList(res: unknown): CouponView[] {
  const arr = Array.isArray(res) ? res : [];
  return arr.map(normalizeCoupon);
}
