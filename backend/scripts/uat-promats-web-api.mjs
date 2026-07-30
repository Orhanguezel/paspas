const apiBase = (process.env.UAT_API_BASE || 'https://panel.avrasyaotomotiv.net/api').replace(/\/+$/, '');
const siteUrl = process.env.UAT_SITE_URL || 'https://panel.avrasyaotomotiv.net/promats/tr';
const imageUrl = process.env.UAT_IMAGE_URL || '';
const token = process.env.UAT_TOKEN;
if (!token) throw new Error('UAT_TOKEN zorunludur');

const created = [];
const restored = [];

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let body = text;
  try { body = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${text.slice(0, 300)}`);
  }
  return body;
}

async function publicRequest(path) {
  const response = await fetch(`${apiBase}/web/promats${path}`);
  if (!response.ok) throw new Error(`PUBLIC ${path} -> ${response.status}`);
  return response.json();
}

async function assertSite() {
  const response = await fetch(siteUrl);
  if (!response.ok) throw new Error(`SITE -> ${response.status}`);
}

function jsonBody(value) {
  return JSON.stringify(value);
}

async function createCms(table, body) {
  const item = await request(`/admin/web/promats/${table}`, {
    method: 'POST',
    body: jsonBody(body),
  });
  created.push({ kind: 'cms', table, id: item.id });
  return item;
}

try {
  const product = await createCms('products', {
    language_id: 1,
    source_language_id: 0,
    sort_order: 9999,
    name: '[Codex UAT] Ürün',
    slug: 'codex-uat-urun',
    s1_4_image: imageUrl || null,
    status: 1,
    features: [{ type: 1, feature: 'UAT özellik', status: 0 }],
  });
  await request(`/admin/web/promats/products/${product.id}`, {
    method: 'PATCH',
    body: jsonBody({ status: 0, name: '[Codex UAT] Ürün Güncel' }),
  });
  const products = await publicRequest('/products?lang=tr');
  if (!products.data.some((item) => item.slug === 'codex-uat-urun')) {
    throw new Error('UAT ürün public API sonucunda bulunamadı');
  }
  const publicProduct = products.data.find((item) => item.slug === 'codex-uat-urun');
  if (imageUrl) {
    if (publicProduct.hero.image !== imageUrl) throw new Error('UAT ürün görsel URL eşleşmedi');
    const imageResponse = await fetch(new URL(imageUrl, siteUrl));
    if (!imageResponse.ok) throw new Error(`UAT ürün görseli -> ${imageResponse.status}`);
    const productPage = await fetch(`${siteUrl.replace(/\/+$/, '')}/urunler/codex-uat-urun`);
    if (!productPage.ok) throw new Error(`UAT ürün sayfası -> ${productPage.status}`);
  }
  await assertSite();

  const page = await createCms('pages', {
    language_id: 1,
    source_language_id: 0,
    sort_order: 9999,
    position: 99,
    original_title: 'Codex UAT Sayfa',
    title: '[Codex UAT] Sayfa',
    slug: 'codex-uat-sayfa',
    status: 0,
    gallery: imageUrl ? [{ image: imageUrl, status: 0 }] : [],
  });
  await request(`/admin/web/promats/pages/${page.id}`, {
    method: 'PATCH',
    body: jsonBody({ title: '[Codex UAT] Sayfa Güncel' }),
  });
  const pages = await publicRequest('/content?lang=tr&position=99');
  if (!pages.data.some((item) => item.slug === 'codex-uat-sayfa')) {
    throw new Error('UAT sayfa public API sonucunda bulunamadı');
  }
  await assertSite();

  const article = await createCms('articles', {
    language_id: 1,
    source_language_id: 0,
    sort_order: 9999,
    title: '[Codex UAT] Makale',
    slug: 'codex-uat-makale',
    content: 'Geçici canlı UAT kaydı.',
    status: 0,
  });
  await request(`/admin/web/promats/articles/${article.id}`, {
    method: 'PATCH',
    body: jsonBody({ title: '[Codex UAT] Makale Güncel', status: 1 }),
  });
  await publicRequest('/articles?lang=tr');
  await assertSite();

  const textTr = await createCms('texts', {
    language_id: 1,
    source_language_id: 0,
    original_text: '__codex_uat_tr__',
    title: 'Türkçe UAT',
    status: 0,
  });
  const textEn = await createCms('texts', {
    language_id: 2,
    source_language_id: 0,
    original_text: '__codex_uat_en__',
    title: 'English UAT',
    status: 0,
  });
  const [settingsTr, settingsEn] = await Promise.all([
    publicRequest('/settings?lang=tr'),
    publicRequest('/settings?lang=en'),
  ]);
  if (settingsTr.data.__codex_uat_tr__ !== 'Türkçe UAT'
    || settingsEn.data.__codex_uat_en__ !== 'English UAT') {
    throw new Error('TR/EN sabit yazı public API doğrulaması başarısız');
  }
  await request(`/admin/web/promats/texts/${textTr.id}`, {
    method: 'PATCH',
    body: jsonBody({ title: 'Türkçe UAT Güncel' }),
  });
  await assertSite();

  const menu = (await request('/admin/web/promats/menu?languageId=1'))[0];
  if (!menu) throw new Error('Güncellenecek menü kaydı yok');
  restored.push({
    path: `/admin/web/promats/menu/${menu.id}`,
    body: { title: menu.title, url: menu.url, sort_order: menu.sort_order },
  });
  await request(`/admin/web/promats/menu/${menu.id}`, {
    method: 'PATCH',
    body: jsonBody({ title: `${menu.title} [UAT]`, url: menu.url, sort_order: menu.sort_order }),
  });
  await publicRequest('/menu?lang=tr');
  await assertSite();

  const settings = await request('/admin/web/promats/settings');
  const adminSetting = settings.find((item) => item.key.startsWith('web.promats.admin.'));
  if (!adminSetting) throw new Error('Geri alınabilir admin web ayarı bulunamadı');
  restored.push({
    path: `/admin/web/promats/settings/${encodeURIComponent(adminSetting.key)}`,
    method: 'PUT',
    body: { value: adminSetting.value },
  });
  await request(`/admin/web/promats/settings/${encodeURIComponent(adminSetting.key)}`, {
    method: 'PUT',
    body: jsonBody({ value: `${adminSetting.value}-uat` }),
  });

  const theme = await request('/admin/web/promats/theme');
  restored.push({ path: '/admin/web/promats/theme', method: 'PUT', body: theme });
  await request('/admin/web/promats/theme', {
    method: 'PUT',
    body: jsonBody({ ...theme, __uat: '#123456' }),
  });
  const publicTheme = await publicRequest('/theme');
  if (publicTheme.__uat !== '#123456') throw new Error('Tema public API doğrulaması başarısız');
  await assertSite();

  const home = await request('/admin/web/promats/home-sections', {
    method: 'POST',
    body: jsonBody({
      slug: 'codex-uat-home',
      label: '[Codex UAT] Ana Sayfa',
      component_key: 'CodexUatSection',
      order_index: 9999,
      is_active: 0,
      config: { uat: true },
    }),
  });
  created.push({ kind: 'home', id: home.id });
  await request(`/admin/web/promats/home-sections/${home.id}`, {
    method: 'PATCH',
    body: jsonBody({ is_active: 1 }),
  });
  const layout = await publicRequest('/home/layout');
  if (!layout.data.some((item) => item.slug === 'codex-uat-home')) {
    throw new Error('Ana sayfa bölümü public API sonucunda bulunamadı');
  }
  await assertSite();

  console.log(JSON.stringify({
    ok: true,
    tested: [
      'products', 'pages', 'articles', 'texts-tr-en', 'menu',
      'site-setting', 'theme', 'home-section', 'public-api', 'real-page',
    ],
  }));
} finally {
  for (const item of restored.reverse()) {
    try {
      await request(item.path, {
        method: item.method || 'PATCH',
        body: jsonBody(item.body),
      });
    } catch (error) {
      console.error(`RESTORE_FAILED ${item.path}:`, error.message);
    }
  }
  for (const item of created.reverse()) {
    const path = item.kind === 'home'
      ? `/admin/web/promats/home-sections/${item.id}`
      : `/admin/web/promats/${item.table}/${item.id}`;
    try {
      await request(path, { method: 'DELETE' });
    } catch (error) {
      console.error(`CLEANUP_FAILED ${path}:`, error.message);
    }
  }
}
