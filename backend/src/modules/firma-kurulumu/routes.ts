import type { FastifyInstance } from 'fastify';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { pool } from '@/db/client';
import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import { writeCrmAudit } from '@/modules/crm/audit';

type Row = RowDataPacket & { son_no: number };

export async function registerFirmaKurulumu(app: FastifyInstance) {
  const admin = makeAdminPermissionGuard('admin.app_settings');
  app.get('/firma-kurulumu/numara-serisi', { preHandler: admin }, async () => {
    const year = new Date().getFullYear();
    const [rows] = await pool.execute<Row[]>('SELECT son_no FROM teklif_no_sayaclari WHERE yil=?', [year]);
    const lastUsed = Number(rows[0]?.son_no ?? 0);
    return { year, series: [{ type: 'teklif', lastUsed, next: lastUsed + 1 }] };
  });
  app.post('/firma-kurulumu/numara-serisi/devir', { preHandler: admin }, async (req, reply) => {
    const parsed = z.object({ year: z.number().int(), lastUsed: z.number().int().min(0).max(999999) }).safeParse(req.body);
    if (!parsed.success || parsed.data.year !== new Date().getFullYear()) return reply.code(400).send({ error: { message: 'gecersiz_numara_devri' } });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute<Row[]>('SELECT son_no FROM teklif_no_sayaclari WHERE yil=? FOR UPDATE', [parsed.data.year]);
      const current = Number(rows[0]?.son_no ?? 0);
      if (parsed.data.lastUsed < current) { await conn.rollback(); return reply.code(409).send({ error: { message: 'sayac_geri_alinamaz', current } }); }
      if (rows.length) await conn.execute('UPDATE teklif_no_sayaclari SET son_no=? WHERE yil=?', [parsed.data.lastUsed, parsed.data.year]);
      else await conn.execute('INSERT INTO teklif_no_sayaclari (yil,son_no) VALUES (?,?)', [parsed.data.year, parsed.data.lastUsed]);
      await conn.commit();
      await writeCrmAudit({ actorUserId: (req as typeof req & { user?: { sub?: string } }).user?.sub ?? null, action: 'QUOTE_NUMBER_SERIES_ADVANCED', resource: 'quote-number-series', resourceId: String(parsed.data.year), before: { lastUsed: current }, after: { lastUsed: parsed.data.lastUsed } }).catch((error) => req.log.warn({ error }, 'quote_number_audit_failed'));
      return { year: parsed.data.year, lastUsed: parsed.data.lastUsed, next: parsed.data.lastUsed + 1 };
    } catch (error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
  });
}
