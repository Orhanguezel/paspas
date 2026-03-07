# CLAUDE.md — Paspas Üretim ERP — Backend

Üst dizin kuralları: `../CLAUDE.md` — bu dosya yalnızca backend katmanına özgü kurallar içerir.

---

## Tech Stack

| Araç | Versiyon | Kullanım |
|------|----------|---------|
| Fastify | 5 | HTTP framework |
| Bun | latest | Runtime |
| TypeScript | 5 strict | Tip sistemi |
| Drizzle ORM | 0.44+ | Veritabanı sorguları |
| MySQL 2 | 3 | Veritabanı |
| Zod | 3 | Validasyon |
| @fastify/jwt | 10 | Auth |
| Argon2 | latest | Şifre hash |
| Cloudinary | 2 | Dosya yükleme |

---

## Modül Mimarisi

Her ERP modülü şu dosya yapısını izler:

```
src/modules/[modül]/
├── schema.ts           # Drizzle tablo tanımı + rowToDto dönüşümü
├── validation.ts       # Zod giriş şemaları
├── repository.ts       # Veritabanı sorguları (sadece DB mantığı)
├── controller.ts       # Sadece admin route handler'ları
└── router.ts           # Route kaydı
```

Servis mantığı gerektiren modüller için:
```
├── service.ts          # İş mantığı (controller'dan ayrı)
```

### Dosya Sorumlulukları

| Dosya | Sorumluluk | İçermez |
|-------|-----------|--------|
| `schema.ts` | Tablo sütunları, foreign keyler, `rowToDto` | Sorgu mantığı |
| `validation.ts` | Zod şemaları, TypeScript tipler | İş mantığı |
| `repository.ts` | Drizzle sorguları, join'ler | HTTP logic, Zod |
| `controller.ts` | Request parse → service/repo çağır → reply | DB query'leri |
| `router.ts` | Route kayıt, middleware atama | Her türlü mantık |

---

## ERP Modülleri ↔ Backend Route Eşleşmesi

| Modül | Route Prefix | Tablo Adı |
|-------|-------------|-----------|
| Ürünler | `GET/POST/PATCH/DELETE /admin/urunler` | `urunler` |
| Reçeteler | `/admin/receteler` | `receteler`, `recete_kalemleri` |
| Müşteriler | `/admin/musteriler` | `musteriler` |
| Satış Siparişleri | `/admin/satis-siparisleri` | `satis_siparisleri`, `siparis_kalemleri` |
| Üretim Emirleri | `/admin/uretim-emirleri` | `uretim_emirleri` |
| Makine Havuzu | `/admin/makine-havuzu` | `makineler`, `makine_kuyrugu` |
| Stoklar | `/admin/stoklar` | — (urunler.stok üzerinden) |
| Satın Alma | `/admin/satin-alma` | `satin_alma_siparisleri`, `satin_alma_kalemleri` |
| Hareketler | `/admin/hareketler` | `hareketler` |
| Tanımlar | `/admin/tanimlar` | `makineler`, `kaliplar`, `tatiller` |
| Dashboard | `/admin/dashboard` | — (aggregate query) |

---

## Kod Kuralları

### Schema (schema.ts)
```ts
// FILE: src/modules/musteriler/schema.ts
import { mysqlTable, char, varchar, decimal, tinyint, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const musteriler = mysqlTable('musteriler', {
  id:        char('id', { length: 36 }).primaryKey().notNull(),
  tur:       varchar('tur', { length: 32 }).notNull().default('musteri'), // musteri | tedarikci
  ad:        varchar('ad', { length: 255 }).notNull(),
  telefon:   varchar('telefon', { length: 32 }),
  adres:     varchar('adres', { length: 500 }),
  iskonto:   decimal('iskonto', { precision: 5, scale: 2 }),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type MusteriRow = typeof musteriler.$inferSelect;

// Her modül kendi DTO dönüşümünü burada sağlar
export function rowToDto(row: MusteriRow) {
  return {
    id:       row.id,
    tur:      row.tur,
    ad:       row.ad,
    telefon:  row.telefon ?? null,
    adres:    row.adres ?? null,
    iskonto:  row.iskonto ? Number(row.iskonto) : 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}
```

### Validation (validation.ts)
```ts
// FILE: src/modules/musteriler/validation.ts
import { z } from 'zod';

export const listQuerySchema = z.object({
  q:      z.string().trim().optional(),
  tur:    z.enum(['musteri', 'tedarikci']).optional(),
  limit:  z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort:   z.enum(['ad', 'created_at']).default('created_at'),
  order:  z.enum(['asc', 'desc']).default('desc'),
});

export const createSchema = z.object({
  tur:     z.enum(['musteri', 'tedarikci']).default('musteri'),
  ad:      z.string().trim().min(1).max(255),
  telefon: z.string().trim().max(32).optional(),
  adres:   z.string().trim().max(500).optional(),
  iskonto: z.coerce.number().min(0).max(100).optional(),
});

export const patchSchema = createSchema.partial();

export type ListQuery    = z.infer<typeof listQuerySchema>;
export type CreateBody   = z.infer<typeof createSchema>;
export type PatchBody    = z.infer<typeof patchSchema>;
```

### Repository (repository.ts)
```ts
// FILE: src/modules/musteriler/repository.ts
import { db } from '@/db/client';
import { eq, like, and, asc, desc, sql } from 'drizzle-orm';
import { musteriler, type MusteriRow } from './schema';
import { randomUUID } from 'node:crypto';
import type { ListQuery, CreateBody, PatchBody } from './validation';

export async function repoList(q: ListQuery): Promise<{ items: MusteriRow[]; total: number }> {
  const conditions = [];
  if (q.q)   conditions.push(like(musteriler.ad, `%${q.q}%`));
  if (q.tur) conditions.push(eq(musteriler.tur, q.tur));

  const where = conditions.length ? and(...conditions) : undefined;
  const orderCol = q.sort === 'ad' ? musteriler.ad : musteriler.created_at;
  const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [items, countResult] = await Promise.all([
    db.select().from(musteriler).where(where).orderBy(orderDir).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(musteriler).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<MusteriRow | null> {
  const rows = await db.select().from(musteriler).where(eq(musteriler.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreate(data: CreateBody): Promise<MusteriRow> {
  const id = randomUUID();
  await db.insert(musteriler).values({ id, ...data });
  const row = await repoGetById(id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<MusteriRow | null> {
  await db.update(musteriler).set(patch).where(eq(musteriler.id, id));
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.delete(musteriler).where(eq(musteriler.id, id));
}
```

### Controller (controller.ts)
```ts
// FILE: src/modules/musteriler/controller.ts
import type { RouteHandler } from 'fastify';
import { listQuerySchema, createSchema, patchSchema } from './validation';
import { repoList, repoGetById, repoCreate, repoUpdate, repoDelete } from './repository';
import { rowToDto } from './schema';

/** GET /admin/musteriler */
export const listMusteriler: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const { items, total } = await repoList(parsed.data);
  reply.header('x-total-count', String(total));
  return items.map(rowToDto);
};

/** GET /admin/musteriler/:id */
export const getMusteri: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await repoGetById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return rowToDto(row);
};

/** POST /admin/musteriler */
export const createMusteri: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const row = await repoCreate(parsed.data);
  return reply.code(201).send(rowToDto(row));
};

/** PATCH /admin/musteriler/:id */
export const updateMusteri: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const row = await repoUpdate(req.params.id, parsed.data);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return rowToDto(row);
};

/** DELETE /admin/musteriler/:id */
export const deleteMusteri: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await repoDelete(req.params.id);
  return reply.code(204).send();
};
```

### Router (router.ts)
```ts
// FILE: src/modules/musteriler/router.ts
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '@/common/middleware/auth';
import { listMusteriler, getMusteri, createMusteri, updateMusteri, deleteMusteri } from './controller';

export async function registerMusteriler(app: FastifyInstance) {
  const BASE = '/admin/musteriler';
  const pre  = [requireAdmin];

  app.get(`${BASE}`,      { preHandler: pre }, listMusteriler);
  app.get(`${BASE}/:id`,  { preHandler: pre }, getMusteri);
  app.post(`${BASE}`,     { preHandler: pre }, createMusteri);
  app.patch(`${BASE}/:id`,{ preHandler: pre }, updateMusteri);
  app.delete(`${BASE}/:id`,{ preHandler: pre }, deleteMusteri);
}
```

---

## Genel Kurallar

### Hata Yanıtı Formatı
Her hata yanıtı aynı yapıyı izler:
```ts
reply.code(400).send({ error: { message: 'invalid_body', issues: ... } });
reply.code(404).send({ error: { message: 'not_found' } });
reply.code(401).send({ error: { message: 'unauthorized' } });
```

### UUID
- Tüm primary key'ler UUID: `char(36)` + `randomUUID()` from `'node:crypto'`
- Auto-increment kullanılmaz

### Decimal Alanlar
- Decimal DB'den string gelir → `Number(row.price)` ile dönüştür
- Para birimi: `decimal(12, 2)` — miktar: `decimal(12, 4)`

### Tarih Alanları
- Tüm tablolarda `created_at` + `updated_at` (datetime, NOT NULL)
- `updated_at` → `ON UPDATE CURRENT_TIMESTAMP`

### Şablondan Kaldırılacak Modüller
E-ticaret'e özgü; ERP'de kullanılmaz:
`myListings` `proporties` `cart` `coupons` `flashSale` `popups` `slider` `banner`
`newsletter` `newsAggregator` `telegram` `chat` `ai_chat` `seller`
`subscription` `wallet` `reviews` `contact` `faqs`

### Korunacak Şablon Modülleri
- `auth/` — JWT login/logout/refresh
- `profiles/` — kullanıcı profili
- `storage/` — Cloudinary dosya yükleme
- `siteSettings/` → `appSettings/` olarak sadeleştirilecek
- `dashboard/` — aggregate istatistikler (yeniden yazılacak)
- `db_admin/` — DB backup (tutulabilir)
- `notifications/` — bildirim sistemi (opsiyonel)

---

## Komutlar

```bash
bun run dev           # Hot reload (port 8078)
bun run build         # TypeScript derleme
bun run db:seed       # Veritabanı başlangıç verisi
```
