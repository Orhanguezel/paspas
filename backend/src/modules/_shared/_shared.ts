// =============================================================
// FILE: src/modules/auth/_shared.ts
// FINAL — Shared helpers for auth module
// =============================================================
import type { users } from '@/modules/auth/schema';
import { z } from 'zod';

type UserRow = typeof users.$inferSelect;

export const toBool01 = (v: unknown): boolean => (typeof v === 'boolean' ? v : Number(v) === 1);

/** Admin/FE DTO tek yerde */
export function pickUserDto(u: UserRow, role: string) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? null,
    phone: u.phone ?? null,
    email_verified: u.email_verified,
    is_active: u.is_active,
    created_at: u.created_at,
    last_login_at: u.last_sign_in_at,

    // ✅ profil resmi
    profile_image: (u as any).profile_image ?? null,
    profile_image_asset_id: (u as any).profile_image_asset_id ?? null,
    profile_image_alt: (u as any).profile_image_alt ?? null,

    role,
  };
}


export type Id36 = string;

export type LocaleCode = string;
export type Ymd = string; // YYYY-MM-DD
export type Hm = string; // HH:mm


export const safeTrim = (v: unknown) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim());
export const uuid36Schema = z
  .string()
  .trim()
  .length(36, 'id must be 36 chars')
  .transform((v) => safeTrim(v));

  export function toActive01(v: unknown): 0 | 1 | undefined {
    if (v === true || v === 1 || v === '1' || v === 'true') return 1;
    if (v === false || v === 0 || v === '0' || v === 'false') return 0;
    return undefined;
  }


export type safeText = (v: unknown) => string;

/**
 * Çeşitli boolean-like değerleri boolean'a çevir
 * true, 1, "1", "true" → true
 * false, 0, "0", "false" → false
 */
export function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true';
}

/**
 * QueryString için boolean parser (undefined korumalı)
 * undefined → undefined
 * true/1/"1"/"true" → true
 * false/0/"0"/"false" → false
 */
export function toBoolOrUndefined(v: unknown): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return undefined;
}

/**
 * Boş string, null veya undefined → null
 * Diğer değerler → string
 */
export function nullIfEmpty(v: unknown): string | null {
  if (v === '' || v === null || v === undefined) return null;
  return String(v);
}

/**
 * MySQL duplicate entry hatası kontrolü
 */
export function isDuplicateError(err: any): boolean {
  const code = err?.code ?? err?.errno;
  return code === 'ER_DUP_ENTRY' || code === 1062;
}

/**
 * Güvenli integer parse
 */
export function toInt(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export const hmSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm')
  .transform((v) => safeTrim(v));

export const ymdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
  .transform((v) => safeTrim(v));

export const dowSchema = z.coerce.number().int().min(1).max(7) as any;

