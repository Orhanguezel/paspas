import mysql from 'mysql2/promise';

const hours = Number(process.argv[2] ?? 24);
if (!Number.isInteger(hours) || hours < 1 || hours > 24 * 31) throw new Error('HOURS_1_TO_744_REQUIRED');

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});
try {
  const [[leads], [offers], [conversions]] = await Promise.all([
    db.execute(`SELECT COUNT(*) kaydedilenTalep,
      SUM(durum='teklife_donustu') teklifeDonusenTalep
      FROM teklif_talepleri WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`, [hours]),
    db.execute(`SELECT COUNT(*) olusturulanTeklif,
      SUM(gonderim_at IS NOT NULL) gonderilenTeklif,
      SUM(ilk_goruntuleme_at IS NOT NULL) goruntulenenTeklif,
      SUM(durum='kabul') kabulEdilenTeklif
      FROM teklifler WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`, [hours]),
    db.execute(`SELECT COUNT(*) sipariseDonusenTeklif FROM teklifler
      WHERE donusen_siparis_id IS NOT NULL AND updated_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`, [hours]),
  ]);
  const output = { checkedAt: new Date().toISOString(), hours, ...leads, ...offers, ...conversions };
  const sent = Number(output.gonderilenTeklif || 0);
  output.kabulOrani = sent ? Number((Number(output.kabulEdilenTeklif || 0) * 100 / sent).toFixed(2)) : 0;
  console.log(JSON.stringify(output));
} finally {
  await db.end();
}
