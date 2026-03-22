import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, gte, inArray, like, lte, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { musteriler } from '@/modules/musteriler/schema';
import { urunler } from '@/modules/urunler/schema';
import { hareketler } from '@/modules/hareketler/schema';
import { satinAlmaSiparisleri, satinAlmaKalemleri } from '@/modules/satin_alma/schema';

import { malKabulKayitlari, type MalKabulDto, type MalKabulOzetDto, type MalKabulRow, rowToDto } from './schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

type ListResult = { items: MalKabulDto[]; total: number; summary: MalKabulOzetDto };

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.dateFrom) {
    conditions.push(gte(malKabulKayitlari.kabul_tarihi, new Date(`${query.dateFrom}T00:00:00`)));
  }
  if (query.dateTo) {
    conditions.push(lte(malKabulKayitlari.kabul_tarihi, new Date(`${query.dateTo}T23:59:59`)));
  }
  if (query.kaynakTipi) {
    conditions.push(eq(malKabulKayitlari.kaynak_tipi, query.kaynakTipi));
  }
  if (query.urunId) {
    conditions.push(eq(malKabulKayitlari.urun_id, query.urunId));
  }
  if (query.tedarikciId) {
    conditions.push(eq(malKabulKayitlari.tedarikci_id, query.tedarikciId));
  }
  if (query.kaliteDurumu) {
    conditions.push(eq(malKabulKayitlari.kalite_durumu, query.kaliteDurumu));
  }
  if (query.q) {
    conditions.push(
      or(
        like(urunler.ad, `%${query.q}%`),
        like(urunler.kod, `%${query.q}%`),
        like(malKabulKayitlari.parti_no, `%${query.q}%`),
        like(malKabulKayitlari.notlar, `%${query.q}%`),
      ) as SQL,
    );
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderCol = query.sort === 'gelen_miktar' ? malKabulKayitlari.gelen_miktar : malKabulKayitlari.kabul_tarihi;
  const orderBy = query.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [items, countResult, summaryRows] = await Promise.all([
    db
      .select({
        id: malKabulKayitlari.id,
        kaynak_tipi: malKabulKayitlari.kaynak_tipi,
        satin_alma_siparis_id: malKabulKayitlari.satin_alma_siparis_id,
        satin_alma_kalem_id: malKabulKayitlari.satin_alma_kalem_id,
        urun_id: malKabulKayitlari.urun_id,
        urun_kod: urunler.kod,
        urun_ad: urunler.ad,
        urun_birim: urunler.birim,
        tedarikci_id: malKabulKayitlari.tedarikci_id,
        tedarikci_ad: musteriler.ad,
        gelen_miktar: malKabulKayitlari.gelen_miktar,
        parti_no: malKabulKayitlari.parti_no,
        operator_user_id: malKabulKayitlari.operator_user_id,
        operator_name: sql<string | null>`coalesce(${users.full_name}, ${users.email})`,
        kabul_tarihi: malKabulKayitlari.kabul_tarihi,
        notlar: malKabulKayitlari.notlar,
        kalite_durumu: malKabulKayitlari.kalite_durumu,
        kalite_notu: malKabulKayitlari.kalite_notu,
        created_at: malKabulKayitlari.created_at,
      })
      .from(malKabulKayitlari)
      .innerJoin(urunler, eq(urunler.id, malKabulKayitlari.urun_id))
      .leftJoin(musteriler, eq(musteriler.id, malKabulKayitlari.tedarikci_id))
      .leftJoin(users, eq(users.id, malKabulKayitlari.operator_user_id))
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(malKabulKayitlari)
      .innerJoin(urunler, eq(urunler.id, malKabulKayitlari.urun_id))
      .where(where),

    db
      .select({
        toplam_kayit: sql<number>`count(*)`,
        toplam_miktar: sql<number>`coalesce(sum(${malKabulKayitlari.gelen_miktar}), 0)`,
        satin_alma_adet: sql<number>`sum(case when ${malKabulKayitlari.kaynak_tipi} = 'satin_alma' then 1 else 0 end)`,
        satin_alma_miktar: sql<number>`coalesce(sum(case when ${malKabulKayitlari.kaynak_tipi} = 'satin_alma' then ${malKabulKayitlari.gelen_miktar} else 0 end), 0)`,
        fason_adet: sql<number>`sum(case when ${malKabulKayitlari.kaynak_tipi} = 'fason' then 1 else 0 end)`,
        fason_miktar: sql<number>`coalesce(sum(case when ${malKabulKayitlari.kaynak_tipi} = 'fason' then ${malKabulKayitlari.gelen_miktar} else 0 end), 0)`,
        diger_adet: sql<number>`sum(case when ${malKabulKayitlari.kaynak_tipi} not in ('satin_alma', 'fason') then 1 else 0 end)`,
        diger_miktar: sql<number>`coalesce(sum(case when ${malKabulKayitlari.kaynak_tipi} not in ('satin_alma', 'fason') then ${malKabulKayitlari.gelen_miktar} else 0 end), 0)`,
      })
      .from(malKabulKayitlari)
      .innerJoin(urunler, eq(urunler.id, malKabulKayitlari.urun_id))
      .where(where),
  ]);

  const s = summaryRows[0];
  return {
    items: (items as MalKabulRow[]).map(rowToDto),
    total: Number(countResult[0]?.count ?? 0),
    summary: {
      toplamKayit: Number(s?.toplam_kayit ?? 0),
      toplamMiktar: Number(s?.toplam_miktar ?? 0),
      satinAlmaAdet: Number(s?.satin_alma_adet ?? 0),
      satinAlmaMiktar: Number(s?.satin_alma_miktar ?? 0),
      fasonAdet: Number(s?.fason_adet ?? 0),
      fasonMiktar: Number(s?.fason_miktar ?? 0),
      digerAdet: Number(s?.diger_adet ?? 0),
      digerMiktar: Number(s?.diger_miktar ?? 0),
    },
  };
}

export async function repoGetById(id: string): Promise<MalKabulDto | null> {
  const rows = await db
    .select({
      id: malKabulKayitlari.id,
      kaynak_tipi: malKabulKayitlari.kaynak_tipi,
      satin_alma_siparis_id: malKabulKayitlari.satin_alma_siparis_id,
      satin_alma_kalem_id: malKabulKayitlari.satin_alma_kalem_id,
      urun_id: malKabulKayitlari.urun_id,
      urun_kod: urunler.kod,
      urun_ad: urunler.ad,
      urun_birim: urunler.birim,
      tedarikci_id: malKabulKayitlari.tedarikci_id,
      tedarikci_ad: musteriler.ad,
      gelen_miktar: malKabulKayitlari.gelen_miktar,
      parti_no: malKabulKayitlari.parti_no,
      operator_user_id: malKabulKayitlari.operator_user_id,
      operator_name: sql<string | null>`coalesce(${users.full_name}, ${users.email})`,
      kabul_tarihi: malKabulKayitlari.kabul_tarihi,
      notlar: malKabulKayitlari.notlar,
      kalite_durumu: malKabulKayitlari.kalite_durumu,
      kalite_notu: malKabulKayitlari.kalite_notu,
      created_at: malKabulKayitlari.created_at,
    })
    .from(malKabulKayitlari)
    .innerJoin(urunler, eq(urunler.id, malKabulKayitlari.urun_id))
    .leftJoin(musteriler, eq(musteriler.id, malKabulKayitlari.tedarikci_id))
    .leftJoin(users, eq(users.id, malKabulKayitlari.operator_user_id))
    .where(eq(malKabulKayitlari.id, id))
    .limit(1);

  if (!rows[0]) return null;
  return rowToDto(rows[0] as MalKabulRow);
}

export async function repoCreate(body: CreateBody, operatorUserId: string | null): Promise<MalKabulDto> {
  const id = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    // 1. Insert mal kabul record
    await tx.insert(malKabulKayitlari).values({
      id,
      kaynak_tipi: body.kaynakTipi,
      satin_alma_siparis_id: body.satinAlmaSiparisId ?? null,
      satin_alma_kalem_id: body.satinAlmaKalemId ?? null,
      urun_id: body.urunId,
      tedarikci_id: body.tedarikciId ?? null,
      gelen_miktar: body.gelenMiktar.toFixed(4),
      parti_no: body.partiNo ?? null,
      operator_user_id: operatorUserId ?? null,
      kabul_tarihi: now,
      notlar: body.notlar ?? null,
      kalite_durumu: body.kaliteDurumu,
      kalite_notu: body.kaliteNotu ?? null,
    });

    // 2. Update product stock (only if accepted)
    if (body.kaliteDurumu !== 'red') {
      await tx
        .update(urunler)
        .set({ stok: sql`${urunler.stok} + ${body.gelenMiktar.toFixed(4)}` })
        .where(eq(urunler.id, body.urunId));
    }

    // 3. Create movement record
    await tx.insert(hareketler).values({
      id: randomUUID(),
      urun_id: body.urunId,
      hareket_tipi: 'giris',
      referans_tipi: 'mal_kabul',
      referans_id: id,
      miktar: body.gelenMiktar.toFixed(4),
      aciklama: `Mal kabul (${body.kaynakTipi})`,
      created_by_user_id: operatorUserId ?? null,
    });

    // 4. Auto-update satin alma siparis status (only for satin_alma type)
    if (body.kaynakTipi === 'satin_alma' && body.satinAlmaSiparisId) {
      await updateSatinAlmaDurum(tx, body.satinAlmaSiparisId);
    }
  });

  const result = await repoGetById(id);
  if (!result) throw new Error('insert_failed');
  return result;
}

async function updateSatinAlmaDurum(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], siparisId: string) {
  const kalemleri = await tx
    .select({ id: satinAlmaKalemleri.id, miktar: satinAlmaKalemleri.miktar })
    .from(satinAlmaKalemleri)
    .where(eq(satinAlmaKalemleri.siparis_id, siparisId));

  if (kalemleri.length === 0) return;

  const kalemIds = kalemleri.map((k) => k.id);
  const kabulTotals = await tx
    .select({
      kalemId: malKabulKayitlari.satin_alma_kalem_id,
      totalKabul: sql<string>`COALESCE(SUM(${malKabulKayitlari.gelen_miktar}), 0)`,
    })
    .from(malKabulKayitlari)
    .where(inArray(malKabulKayitlari.satin_alma_kalem_id, kalemIds))
    .groupBy(malKabulKayitlari.satin_alma_kalem_id);

  const kabulMap = new Map(kabulTotals.map((r) => [r.kalemId, Number(r.totalKabul)]));
  const allDone = kalemleri.every((k) => (kabulMap.get(k.id) ?? 0) >= Number(k.miktar));
  const anyKabul = kalemleri.some((k) => (kabulMap.get(k.id) ?? 0) > 0);

  const yeniDurum = allDone ? 'tamamlandi' : anyKabul ? 'kismen_teslim' : undefined;
  if (yeniDurum) {
    await tx
      .update(satinAlmaSiparisleri)
      .set({ durum: yeniDurum })
      .where(
        and(
          eq(satinAlmaSiparisleri.id, siparisId),
          sql`${satinAlmaSiparisleri.durum} != 'iptal'`,
        ),
      );
  }
}

export async function repoUpdate(id: string, patch: PatchBody, operatorUserId?: string | null): Promise<MalKabulDto | null> {
  const existing = await db.select().from(malKabulKayitlari).where(eq(malKabulKayitlari.id, id)).limit(1);
  if (!existing[0]) return null;

  const updateData: Record<string, unknown> = {};
  if (patch.notlar !== undefined) updateData.notlar = patch.notlar;
  if (patch.kaliteNotu !== undefined) updateData.kalite_notu = patch.kaliteNotu;
  if (patch.partiNo !== undefined) updateData.parti_no = patch.partiNo;
  if (patch.gelenMiktar !== undefined) updateData.gelen_miktar = patch.gelenMiktar.toFixed(4);
  // Onaylayan operatoru kaydet
  if (operatorUserId) updateData.operator_user_id = operatorUserId;

  // Handle kalite durumu change — may need stock adjustment
  if (patch.kaliteDurumu !== undefined && patch.kaliteDurumu !== existing[0].kalite_durumu) {
    // bekliyor = henuz kabul edilmemis, stok eklenmemis
    const wasAccepted = existing[0].kalite_durumu === 'kabul' || existing[0].kalite_durumu === 'kosullu';
    const willBeAccepted = patch.kaliteDurumu === 'kabul' || patch.kaliteDurumu === 'kosullu';
    const miktar = Number(existing[0].gelen_miktar);

    // gelenMiktar degistiyse guncellenmis miktari kullan
    const effectiveMiktar = patch.gelenMiktar !== undefined ? patch.gelenMiktar : miktar;

    if (wasAccepted && !willBeAccepted) {
      // Was accepted, now rejected → remove from stock
      await db
        .update(urunler)
        .set({ stok: sql`${urunler.stok} - ${miktar.toFixed(4)}` })
        .where(eq(urunler.id, existing[0].urun_id));

      await db.insert(hareketler).values({
        id: randomUUID(),
        urun_id: existing[0].urun_id,
        hareket_tipi: 'cikis',
        referans_tipi: 'mal_kabul',
        referans_id: id,
        miktar: miktar.toFixed(4),
        aciklama: `Mal kabul reddedildi — stok düşüldü`,
        created_by_user_id: operatorUserId ?? null,
      });
    } else if (!wasAccepted && willBeAccepted) {
      // Was rejected/bekliyor, now accepted → add to stock
      await db
        .update(urunler)
        .set({ stok: sql`${urunler.stok} + ${effectiveMiktar.toFixed(4)}` })
        .where(eq(urunler.id, existing[0].urun_id));

      await db.insert(hareketler).values({
        id: randomUUID(),
        urun_id: existing[0].urun_id,
        hareket_tipi: 'giris',
        referans_tipi: 'mal_kabul',
        referans_id: id,
        miktar: effectiveMiktar.toFixed(4),
        aciklama: `Mal kabul onaylandı — ${patch.kaliteDurumu === 'kosullu' ? 'koşullu kabul' : 'kabul'}`,
        created_by_user_id: operatorUserId ?? null,
      });
    }

    updateData.kalite_durumu = patch.kaliteDurumu;
  }

  if (Object.keys(updateData).length > 0) {
    await db.transaction(async (tx) => {
      await tx.update(malKabulKayitlari).set(updateData).where(eq(malKabulKayitlari.id, id));
      
      // Re-evaluate SA status if linked
      if (existing[0].satin_alma_siparis_id) {
        await updateSatinAlmaDurum(tx, existing[0].satin_alma_siparis_id);
      }
    });
  }

  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<boolean> {
  const existing = await db.select().from(malKabulKayitlari).where(eq(malKabulKayitlari.id, id)).limit(1);
  if (!existing[0]) return false;

  await db.transaction(async (tx) => {
    // Reverse stock if was accepted
    if (existing[0].kalite_durumu !== 'red') {
      const miktar = Number(existing[0].gelen_miktar);
      await tx
        .update(urunler)
        .set({ stok: sql`${urunler.stok} - ${miktar.toFixed(4)}` })
        .where(eq(urunler.id, existing[0].urun_id));
    }

    // Delete related movement
    await tx.delete(hareketler).where(eq(hareketler.referans_id, id));

    // Delete the record
    await tx.delete(malKabulKayitlari).where(eq(malKabulKayitlari.id, id));

    // Re-evaluate SA status if linked
    if (existing[0].satin_alma_siparis_id) {
      await updateSatinAlmaDurum(tx, existing[0].satin_alma_siparis_id);
    }
  });

  return true;
}
