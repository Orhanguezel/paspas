import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineler, makineKuyrugu } from '@/modules/makine_havuzu/schema';
import { kaliplar, kalipUyumluMakineler } from '@/modules/tanimlar/schema';
import { uretimEmirleri, uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';

import { repoList, repoUpdate } from '../repository';

const describeIntegration = process.env.RUN_DB_INTEGRATION === '1' ? describe : describe.skip;
const ids = {
  sourceMachine: 'v21-r3-source-machine-000000000001',
  targetMachine: 'v21-r3-target-machine-000000000001',
  mold: 'v21-r3-mold-000000000000000000001',
  order: 'v21-r3-order-00000000000000000001',
  operation: 'v21-r3-operation-00000000000000001',
  queue: 'v21-r3-queue-000000000000000000001',
  product: 'v21-r3-product-0000000000000000001',
  compatibility: 'v21-r3-compat-0000000000000000001',
} as const;

async function cleanup(): Promise<void> {
  await db.delete(makineKuyrugu).where(eq(makineKuyrugu.id, ids.queue));
  await db.delete(uretimEmriOperasyonlari).where(eq(uretimEmriOperasyonlari.id, ids.operation));
  await db.delete(uretimEmirleri).where(eq(uretimEmirleri.id, ids.order));
  await db.delete(urunler).where(eq(urunler.id, ids.product));
  await db.delete(kalipUyumluMakineler).where(eq(kalipUyumluMakineler.kalip_id, ids.mold));
  await db.delete(kaliplar).where(eq(kaliplar.id, ids.mold));
  await db.delete(makineler).where(inArray(makineler.id, [ids.sourceMachine, ids.targetMachine]));
}

async function seed(options: { compatible: boolean | null; status?: string; assembly?: boolean }): Promise<void> {
  await db.insert(makineler).values([
    { id: ids.sourceMachine, kod: 'V21-R3-A', ad: 'V21 R3 Kaynak', durum: 'aktif', is_active: 1 },
    { id: ids.targetMachine, kod: 'V21-R3-B', ad: 'V21 R3 Hedef', durum: 'aktif', is_active: 1 },
  ]);
  await db.insert(kaliplar).values({ id: ids.mold, kod: 'V21-R3-K', ad: 'V21 R3 Kalıp' });
  // uretim_emirleri.urun_id foreign key'i icin urun kaydi zorunlu
  await db.insert(urunler).values({ id: ids.product, kod: 'V21-R3-U', ad: 'V21 R3 Ürün', kategori: 'urun' });
  if (options.compatible !== null) {
    await db.insert(kalipUyumluMakineler).values({
      id: ids.compatibility,
      kalip_id: ids.mold,
      makine_id: options.compatible ? ids.targetMachine : ids.sourceMachine,
    });
  }
  await db.insert(uretimEmirleri).values({
    id: ids.order,
    emir_no: 'UE-V21-R3',
    urun_id: ids.product,
    mamul_urun_id: ids.product,
    planlanan_miktar: '10.0000',
    durum: 'planlandi',
  });
  await db.insert(uretimEmriOperasyonlari).values({
    id: ids.operation,
    uretim_emri_id: ids.order,
    operasyon_adi: 'V21 R3 Operasyon',
    kalip_id: ids.mold,
    makine_id: ids.sourceMachine,
    montaj: options.assembly ? 1 : 0,
    montaj_makine_id: options.assembly ? ids.sourceMachine : null,
    planlanan_miktar: '10.0000',
  });
  await db.insert(makineKuyrugu).values({
    id: ids.queue,
    makine_id: ids.sourceMachine,
    uretim_emri_id: ids.order,
    emir_operasyon_id: ids.operation,
    sira: 1,
    durum: options.status ?? 'bekliyor',
  });
}

describeIntegration('V21/R3 güvenli makineler arası aktarma', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('uyumlu hedefe taşır ve montaj makinesini senkronlar', async () => {
    await seed({ compatible: true, assembly: true });
    await repoUpdate(ids.queue, { makineId: ids.targetMachine, sira: 1 });

    const [queue] = await db.select().from(makineKuyrugu).where(eq(makineKuyrugu.id, ids.queue));
    const [operation] = await db
      .select()
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.id, ids.operation));
    expect(queue?.makine_id).toBe(ids.targetMachine);
    expect(operation?.makine_id).toBe(ids.targetMachine);
    expect(operation?.montaj_makine_id).toBe(ids.targetMachine);
  });

  it('uyumsuz hedefi reddeder ve kayıtları değiştirmez', async () => {
    await seed({ compatible: false });
    expect(repoUpdate(ids.queue, { makineId: ids.targetMachine })).rejects.toThrow('kalip_makine_uyumsuz');

    const [queue] = await db.select().from(makineKuyrugu).where(eq(makineKuyrugu.id, ids.queue));
    expect(queue?.makine_id).toBe(ids.sourceMachine);
  });

  it('çalışan işi başka makineye taşımaz', async () => {
    await seed({ compatible: true, status: 'calisiyor' });
    expect(repoUpdate(ids.queue, { makineId: ids.targetMachine })).rejects.toThrow('calisan_is_tasinamaz');
  });

  it('kalıbın uyumluluk kaydı yoksa aktarmaya izin verir', async () => {
    await seed({ compatible: null });
    await repoUpdate(ids.queue, { makineId: ids.targetMachine });
    const [queue] = await db.select().from(makineKuyrugu).where(eq(makineKuyrugu.id, ids.queue));
    expect(queue?.makine_id).toBe(ids.targetMachine);
  });

  it('R1: görünür boş makineyi listeler, görünmez olanı listelemez', async () => {
    await db.insert(makineler).values([
      {
        id: ids.sourceMachine,
        kod: 'V21-R1-A',
        ad: 'V21 R1 Görünür',
        durum: 'aktif',
        is_active: 1,
        is_yuklerinde_goster: 1,
      },
      {
        id: ids.targetMachine,
        kod: 'V21-R1-B',
        ad: 'V21 R1 Gizli',
        durum: 'aktif',
        is_active: 1,
        is_yuklerinde_goster: 0,
      },
    ]);

    const rows = await repoList({ tamamlananlariGoster: false, limit: 50, offset: 0 });
    expect(rows.some((row) => row.bosMakine && row.makineId === ids.sourceMachine)).toBe(true);
    expect(rows.some((row) => row.makineId === ids.targetMachine)).toBe(false);
  });
});
