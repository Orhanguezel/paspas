import mysql from 'mysql2/promise';

const api = (process.env.UAT_API_BASE || 'http://127.0.0.1:8078/api').replace(/\/+$/, '');
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('ADMIN_CREDENTIALS_REQUIRED');
const db = await mysql.createConnection({ host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME });
let offerId; let customerId;

async function call(path, { method='GET', body, token, expected=200 } = {}) {
  const response = await fetch(`${api}${path}`, {
    method, headers:{ ...(token ? { authorization:`Bearer ${token}` } : {}), ...(body ? {'content-type':'application/json'} : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.status !== expected) throw new Error(`${method} ${path} expected=${expected} actual=${response.status} body=${JSON.stringify(payload)}`);
  return { payload, headers:response.headers };
}

try {
  await call('/admin/teklifler', { expected:401 });
  const login = await call('/auth/token', { method:'POST', body:{ email:process.env.ADMIN_EMAIL, password:process.env.ADMIN_PASSWORD } });
  const token = login.payload.access_token;
  const marker = `E2E-TEKLIF-CRUD-${Date.now()}`;
  const created = await call('/admin/teklifler', { method:'POST', token, expected:201, body:{ yeniMusteri:{ ad:marker }, paraBirimi:'EUR', dil:'en', gecerlilikTarihi:'2026-12-31' } });
  offerId = created.payload.id; customerId = created.payload.musteriId;
  if (created.payload.durum !== 'taslak' || !created.payload.teklifNo) throw new Error('CREATE_CONTRACT_FAILED');

  const detail = await call(`/admin/teklifler/${offerId}`, { token });
  if (detail.payload.id !== offerId) throw new Error('DETAIL_FAILED');
  const today = new Date().toISOString().slice(0, 10);
  const filters = [
    `q=${encodeURIComponent(created.payload.teklifNo)}`,
    `q=${encodeURIComponent(marker)}`,
    `musteriId=${customerId}`,
    'durum=taslak&paraBirimi=EUR&dil=en',
    `ownerUserId=${created.payload.ownerUserId}`,
    `dateFrom=${today}&dateTo=${today}&gecerlilikFrom=2026-12-31&gecerlilikTo=2026-12-31`,
  ];
  for (const query of filters) {
    const listed = await call(`/admin/teklifler?${query}`, { token });
    if (!listed.payload.some((item) => item.id === offerId) || Number(listed.headers.get('x-total-count')) < 1) throw new Error(`FILTER_FAILED ${query}`);
  }
  const updated = await call(`/admin/teklifler/${offerId}`, { method:'PATCH', token, body:{ aciklama:'CRUD UAT güncellendi', nakliye:25 } });
  if (updated.payload.aciklama !== 'CRUD UAT güncellendi' || updated.payload.nakliye !== 25) throw new Error('PATCH_FAILED');

  await db.execute("UPDATE teklifler SET durum='gonderildi' WHERE id=?", [offerId]);
  await call(`/admin/teklifler/${offerId}`, { method:'PATCH', token, expected:409, body:{ aciklama:'engellenmeli' } });
  await call(`/admin/teklifler/${offerId}`, { method:'DELETE', token, expected:409 });
  await db.execute("UPDATE teklifler SET durum='taslak' WHERE id=?", [offerId]);
  await call(`/admin/teklifler/${offerId}`, { method:'DELETE', token, expected:204 });
  offerId = undefined;
  console.log(JSON.stringify({ ok:true, unauthorized:401, create:201, detail:true, filters:filters.length, patch:true, nonDraftGuards:409, delete:204 }));
} finally {
  if (offerId) await db.execute('DELETE FROM teklifler WHERE id=?', [offerId]);
  if (customerId) await db.execute('DELETE FROM musteriler WHERE id=?', [customerId]);
  await db.end();
}
