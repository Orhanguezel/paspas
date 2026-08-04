import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

const api = (process.env.UAT_API_BASE || 'http://127.0.0.1:8078/api').replace(/\/+$/, '');
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error('ADMIN_CREDENTIALS_REQUIRED');

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});
const customerId = randomUUID();
const offerId = randomUUID();
const marker = `UAT-STATUS-${offerId.slice(0, 8)}`;

try {
  await db.execute(
    `INSERT INTO musteriler (id,tur,musteri_durumu,kod,ad,is_active)
     VALUES (?,'musteri','aday',?,?,1)`,
    [customerId, marker, marker],
  );
  await db.execute(
    `INSERT INTO teklifler (id,teklif_no,musteri_id,durum,dil,para_birimi)
     VALUES (?,?,?,'taslak','tr','TRY')`,
    [offerId, marker, customerId],
  );

  const login = await fetch(`${api}/auth/token`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!login.ok) throw new Error(`LOGIN_FAILED_${login.status}`);
  const auth = await login.json();
  const token = auth.access_token || auth.accessToken;
  if (!token) throw new Error('ACCESS_TOKEN_MISSING');

  const invalid = await fetch(`${api}/admin/teklifler/${offerId}/durum`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ durum: 'kabul' }),
  });
  const body = await invalid.json().catch(() => ({}));
  const [[stored]] = await db.execute('SELECT durum FROM teklifler WHERE id=?', [offerId]);
  if (invalid.status !== 409 || stored?.durum !== 'taslak') {
    throw new Error(`STATUS_GATE_FAILED http=${invalid.status} stored=${stored?.durum} body=${JSON.stringify(body)}`);
  }
  console.log(JSON.stringify({ ok: true, invalidTransition: 'taslak->kabul', httpStatus: 409, stateUnchanged: true }));
} finally {
  await db.execute('DELETE FROM teklifler WHERE id=?', [offerId]);
  await db.execute('DELETE FROM musteriler WHERE id=?', [customerId]);
  await db.end();
}
