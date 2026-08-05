const crypto = require('node:crypto');
const mysql = require('mysql2/promise');

const tasks = [
  ['Kaynak–hedef uyumluluk matrisi', 'Transpalet teklif tabloları, servisleri, endpointleri ve admin bileşenlerini Paspas müşteri, ürün, satış siparişi, storage, kullanıcı ve rol yapılarıyla eşleştir; taşınacak, uyarlanacak ve çıkarılacak alanları belgeleyin.', 'critical', 'Analiz'],
  ['Promats teklif kapsamını Fuar Teklif Modülü’nden ayır', 'Promats web teklif modülü web lead ve standart satış teklifine odaklanacak; Fuar modülündeki palet, koli, CBM, konteyner, proforma ve çeki listesi V1 zorunlu kapsamına alınmayacak.', 'high', 'Analiz'],
  ['Teklif durum makinesi ve geçiş kuralları', 'Talep, taslak, onay bekliyor, gönderildi, görüntülendi, revizyon, kabul, red ve süresi doldu durumlarını; izin verilen geçişleri backend doğrulamasıyla uygula.', 'critical', 'Analiz'],
  ['Teklif şeması migrationı', 'Sayaç, teklifler, kalemler, revizyonlar, gönderimler ve şablonları Paspas foreign keyleriyle oluşturan tekrar çalıştırılabilir migration hazırla.', 'critical', 'Backend'],
  ['Web teklif talepleri veri modeli', 'Kaynak sayfa, dil, kişi/şirket, iletişim, konu, mesaj, ürünler, UTM/referrer, KVKK, durum, sorumlu, müşteri ve teklif bağlantılarını saklayan lead tablosu oluştur.', 'critical', 'Backend'],
  ['Public teklif talebi endpointi', 'Yapısal payload, Zod doğrulama, boyut sınırı, rate-limit, anti-spam, IP hash ve çift kayıt korumasıyla kalıcı web teklif talebi endpointi geliştir.', 'critical', 'Backend'],
  ['İletişim ve teklif talebi ayrımı', 'Genel iletişim/destek mesajlarını iletişim akışında; Teklif Talebi ve OEM fiyat taleplerini teklif gelen kutusunda işle.', 'high', 'Backend'],
  ['Teklif CRUD ve filtreleme API’leri', 'Teklif liste, detay, oluşturma, yalnız taslakta güncelleme/silme; teklif no, müşteri, durum, tarih, sorumlu ve para birimi filtrelerini taşı.', 'critical', 'Backend'],
  ['Teklif kalemleri ve ürün snapshotı', 'Ürün ve manuel açıklama kalemlerini destekle; ürün kodu/adı/birimi/açıklaması/fiyatını teklif anında dondur.', 'critical', 'Backend'],
  ['Merkezi toplam hesaplama motoru', 'Miktar, satır/genel indirim, nakliye, KDV dahil/haric ve toplamları decimal politikasıyla yalnız backendde hesapla; UI/PDF aynı sonucu kullansın.', 'critical', 'Backend'],
  ['Teklif numaralandırması', 'Yıllık sayacı transaction/lock ile yarış koşuluna dayanıklı taşı; Promats teklif numarası formatını uygula.', 'high', 'Backend'],
  ['R0/R1/R2 revizyon snapshotı', 'Müşteri, kalem, fiyat, toplam, koşul, dil ve şablon verisini değişmez revizyon snapshotlarında sakla; eski PDF yeniden üretilebilsin.', 'critical', 'Backend'],
  ['İskonto onay ve teklif izinleri', 'Görüntüleme, düzenleme, onay ve gönderim izinlerini; rol bazlı iskonto limitlerini Paspas yetki sistemine bağla.', 'high', 'Backend'],
  ['Promats markalı teklif PDF’i', 'Transpalet/Daima alanlarını çıkar; Promats firma/müşteri/ürün/toplam/koşul/geçerlilik/revizyon bilgileriyle TR/EN yönetilebilir A4 PDF üret.', 'critical', 'Backend'],
  ['Gönderim ve public görüntülenme takibi', 'E-posta, WhatsApp linki ve manuel gönderimleri sonuç/hata ile kaydet; süreli ve iptal edilebilir tokenla PDF görüntülenmesini izle.', 'critical', 'Backend'],
  ['Kabul, red ve siparişe dönüştürme', 'Kabul/red geçmişini sakla; kabul edilmiş teklifin seçili kalemlerini Paspas satış siparişine yalnız bir kez dönüştür.', 'critical', 'Backend'],
  ['Audit, bildirim ve süre sonu işleri', 'Teklif yaşam döngüsü auditlerini, yeni talep/onay bildirimlerini ve geçerliliği geçen tekliflerin zamanlanmış durum güncellemesini ekle.', 'high', 'Backend'],
  ['Teklif Talepleri admin gelen kutusu', 'Yeni/inceleniyor/dönüştürüldü/spam durumları ve arama/tarih/dil/konu/sorumlu filtreleriyle web lead yönetim ekranı oluştur.', 'critical', 'Admin Panel'],
  ['Talebi müşteri ve taslak teklife dönüştürme', 'E-posta/telefonla müşteri eşleştir; mevcut veya yeni müşteri seç; web ürünlerini fiyatı doğrulanacak taslak kalemlere aktar.', 'critical', 'Admin Panel'],
  ['Teklif liste ekranı', 'Teklif no, revizyon, müşteri, durum, toplam, para birimi, geçerlilik, sorumlu ve son işlem tarihiyle backend sayfalı liste oluştur.', 'high', 'Admin Panel'],
  ['Teklif editörü', 'Paspas müşteri/ürün seçicileriyle kalem, fiyat, indirim, KDV, nakliye, para birimi, dil, ödeme/teslim ve geçerlilik alanlarını yönet.', 'critical', 'Admin Panel'],
  ['PDF, gönderim ve revizyon geçmişi arayüzü', 'Önizleme/indir, e-posta, WhatsApp linki, onay, revizyon, kabul/red ve anlaşılır gönderim hata akışlarını oluştur.', 'high', 'Admin Panel'],
  ['Müşteri ve sipariş teklif sekmeleri', 'Müşteri detayına talep/teklif geçmişi; sipariş detayına kaynak teklif ve revizyon bağlantısı ekle.', 'high', 'Admin Panel'],
  ['Admin menü ve rol görünürlükleri', 'Teklif Talepleri ve Teklifler menülerini ekle; route ve API’de görüntüleme, düzenleme, onay ve gönderim yetkilerini ayır.', 'high', 'Admin Panel'],
  ['Frontend teklif payload sözleşmesi', 'Konu, ürünler ve OEM alanlarını mesaj metnine gömmek yerine dil, kaynak, ürün ID/slug, UTM ve KVKK ile yapısal JSON gönder.', 'critical', 'Frontend'],
  ['İletişim ve OEM formlarını yeni akışa bağla', 'Teklif/OEM konularını teklif endpointine, diğer konuları iletişim endpointine gönder; bütün özgün form alanlarını koru.', 'critical', 'Frontend'],
  ['Ürün detayından teklif isteme', 'Teklif al CTA’sını ilgili ürün kimliği seçili aç; kompakt çoklu ürün seçimi ve mobil uyum sağla.', 'high', 'Frontend'],
  ['Frontend form UX, spam ve analitik', 'Çift gönderim engeli, alan hataları, kayıt referansı, yeniden deneme, anti-spam ve kişisel verisiz analitik olaylarını tamamla.', 'high', 'Frontend'],
  ['Backend birim ve entegrasyon testleri', 'Toplam, KDV, iskonto, durum, snapshot, sayaç yarışı, izin, gönderim, token ve sipariş dönüşümü testlerini taşı.', 'critical', 'Test'],
  ['Uçtan uca web–teklif–sipariş testi', 'Web talebi → gelen kutusu → müşteri → taslak → PDF → gönderim → görüntüleme → kabul → sipariş akışını Playwright ile doğrula.', 'critical', 'Test'],
  ['Eski contact endpointi için geriye uyum', 'Yeni teklif endpointi canlıya çıkana kadar genel iletişimi koru; geçişte yalnız teklif konularını yeni kalıcı akışa yönlendir.', 'high', 'Canlıya Geçiş'],
  ['Genel İletişim Mesajları gelen kutusu', 'Teklif dışındaki destek, soru/bilgi, işbirliği ve diğer mesajlarını ayrı kalıcı tabloda sakla; public kayıt referansı, idempotency/spam koruması, admin liste-detay-durum-sorumlu-not API ve İletişim Mesajları gelen kutusunu ekle. Bildirim ve Telegram ikincil kanal olarak sürsün.', 'critical', 'Frontend'],
  ['Tüm public URL segmentlerini dile göre yerelleştir', 'TR/EN bütün statik ve dinamik public sayfalar için merkezi locale-route sözlüğü kur; örneğin İngilizcede /products, /contact ve /resources kullan. Ürün/içerik slugları, dil değiştirici, menüler, sitemap, canonical ve hreflang aynı eşlemeyi kullansın; eski veya yanlış dildeki adresleri sorgu parametrelerini koruyan 301 ile doğru URL’ye yönlendir ve route matrisini otomatik test et.', 'critical', 'Frontend'],
  ['Production migration, smoke ve izleme', 'Yedek, deploy sırası, rollback, işaretli UAT talebi ve talep/teklif/dönüşüm metrikleriyle canlı geçişi doğrula.', 'critical', 'Canlıya Geçiş'],
  ['CRM kaynak–hedef uyumluluk matrisi', 'Transpalet CRM, talepler, iletişim, otomasyon, servis ve rapor bağımlılıklarını Paspas müşteri, kullanıcı, görev, bildirim, sipariş, üretim ve sevkiyat yapılarıyla eşleştir.', 'critical', 'CRM Analiz'],
  ['CRM pipeline ve aşama şeması', 'Pipeline, aşama sırası, olasılık, kazanıldı/kaybedildi işaretleri, renk ve bekleme uyarılarını migration ve başlangıç Promats pipeline verisiyle taşı.', 'critical', 'CRM Backend'],
  ['CRM talep/lead modelini web talepleriyle birleştir', 'Kaynak, kanal, ürün ilgisi, UTM, sorumlu, öncelik, durum, müşteri/fırsat bağlantısı ve dönüşüm zamanını tek CRM zincirinde sakla.', 'critical', 'CRM Backend'],
  ['CRM fırsat modeli ve API’leri', 'Pipeline/aşama, müşteri, talep, yetkili, tutar, para birimi, sorumlu, olasılık, kapanış ve kaybetme nedeni alanlarıyla CRUD ve aşama taşıma API’lerini kur.', 'critical', 'CRM Backend'],
  ['Talep–müşteri–fırsat transaction dönüşümü', 'Talebi mevcut/yeni müşteriye bağlayıp fırsat ve ilk aktiviteyi tek transaction ile oluştur; çift dönüşümü engelle.', 'critical', 'CRM Backend'],
  ['Fırsat ürünleri ve ihtiyaç bilgileri', 'Promats ürünleri, miktar, tahmini fiyat ve serbest ihtiyaç notlarını fırsata bağla; taslak teklife snapshot aktarımını sağla.', 'high', 'CRM Backend'],
  ['CRM aktiviteleri ve zaman çizelgesi', 'Arama, toplantı, e-posta, WhatsApp, not ve görev aktivitelerini müşteri/talep/fırsat/teklif/siparişe bağla; sonuç ve sonraki işlemi izle.', 'critical', 'CRM Backend'],
  ['CRM hatırlatmalar ve geciken takip', 'Kullanıcı, kaynak kayıt, zaman ve kanal bazlı tek seferlik hatırlatma; teklif sonrası ve aşamada bekleme takip görevleri ekle.', 'high', 'CRM Backend'],
  ['CRM iletişim geçmişi', 'Gelen/giden e-posta, WhatsApp linki, telefon notu ve manuel iletişimi müşteri/fırsat zaman çizelgesine ve Paspas mail kayıtlarına bağla.', 'high', 'CRM Backend'],
  ['Kaybedilme nedenleri ve kapanış kuralları', 'Yönetilebilir nedenler ekle; kazanıldı/kaybedildi aşama geçişlerinde zorunlu alanları doğrula ve raporlara yansıt.', 'high', 'CRM Backend'],
  ['CRM otomasyon motoru', 'Talep, fırsat, aşama, teklif, takip, sipariş ve sevkiyat tetikleyicileriyle idempotent görev oluşturma, bildirim ve sorumlu atama eylemlerini taşı.', 'high', 'CRM Backend'],
  ['CRM dashboard özet servisi', 'Talep, fırsat, pipeline tutarı, teklifler, geciken takip, kazanma oranı ve beklenen gelir KPI’larını ortak durum tanımlarıyla üret.', 'high', 'CRM Backend'],
  ['CRM rapor servisleri', 'Dönüşüm, aşama bekleme, kullanıcı/kaynak performansı, teklif kabul, kaybetme nedenleri, ürün satışı ve satış döngüsü raporlarını taşı.', 'normal', 'CRM Backend'],
  ['Kaydedilmiş CRM görünümleri', 'Kullanıcıya özel fırsat ve aktivite filtrelerini adlandırma, varsayılan yapma ve silme işlevlerini taşı.', 'normal', 'CRM Backend'],
  ['CRM audit olayları', 'Talep dönüşümü, fırsat/aşama/ürün, teklif ve sipariş dönüşümü işlemlerini eski/yeni değer ve kullanıcıyla Paspas audit sistemine yaz.', 'critical', 'CRM Backend'],
  ['CRM rol ve izinleri', 'Dashboard, talep, fırsat, aktivite, pipeline, teklif/onay, rapor ve otomasyon izinleri ile satış temsilcisi/yönetici veri kapsamını uygula.', 'critical', 'CRM Backend'],
  ['CRM–ERP çapraz bağlantıları', 'Fırsat → teklif → sipariş zincirini ve CRM detayındaki üretim/sevkiyat salt-okunur durumlarını çift yönlü ve tekrarsız bağla.', 'critical', 'CRM Backend'],
  ['CRM backend test paketi', 'Pipeline, dönüşüm transactionı, aktivite, hatırlatma, otomasyon, yetki/RLS, dashboard, rapor ve ERP çapraz akış testlerini Paspas’a uyarla.', 'critical', 'CRM Test'],
  ['CRM dashboard admin ekranı', 'KPI, satış hunisi, geciken takip, yaklaşan aktivite ve sorumlu özetlerini Paspas tasarım sistemiyle taşı.', 'high', 'CRM Admin'],
  ['CRM Pipeline/Kanban admin ekranı', 'Fırsatları aşama sütunlarında göster; güvenli sürükle-bırak, kaybetme nedeni ve eşzamanlı güncelleme kontrolü ekle.', 'critical', 'CRM Admin'],
  ['CRM talep ve fırsat ekranları', 'Filtre, sorumlu, müşteri eşleme, ürünler, teklif geçmişi, aktivite zaman çizelgesi ve dönüşüm eylemlerini liste/detay ekranlarında taşı.', 'critical', 'CRM Admin'],
  ['CRM aktivite panosu ve takvimi', 'Bugün, geciken, yaklaşan ve tamamlanan aktiviteleri liste/takvim görünümünde yönet.', 'high', 'CRM Admin'],
  ['CRM ayar ekranları', 'Pipeline/aşama, kaybetme nedenleri, bildirim tercihleri, otomasyonlar ve kaydedilmiş görünümleri yönet.', 'high', 'CRM Admin'],
  ['Müşteri detayında CRM sekmeleri', 'CRM özeti, talepler, fırsatlar, aktiviteler, teklifler, siparişler ve sevkiyatları müşteri detayında birleştir.', 'critical', 'CRM Admin'],
  ['CRM rapor ekranları', 'Dönüşüm, bekleme, ekip/kaynak, teklif kabul, kayıp, ürün ve satış döngüsü raporlarını filtrelenebilir göster.', 'normal', 'CRM Admin'],
  ['CRM admin E2E testleri', 'Talep dönüşümü, Kanban, aktivite, fırsattan teklif, tekliften sipariş ve rol bazlı görünürlük senaryolarını doğrula.', 'critical', 'CRM Test'],
];

const webTitles = new Set([
  'Web teklif talepleri veri modeli',
  'Public teklif talebi endpointi',
  'İletişim ve teklif talebi ayrımı',
  'Frontend teklif payload sözleşmesi',
  'İletişim ve OEM formlarını yeni akışa bağla',
  'Ürün detayından teklif isteme',
  'Frontend form UX, spam ve analitik',
  'Eski contact endpointi için geriye uyum',
  'Genel İletişim Mesajları gelen kutusu',
  'Tüm public URL segmentlerini dile göre yerelleştir',
]);

function moduleFor(title, phase) {
  if (phase.startsWith('CRM')) return 'CRM';
  if (webTitles.has(title)) return 'Web';
  return 'Teklif';
}

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const results = [];
  await db.beginTransaction();
  try {
    for (const [title, body, priority, phase] of tasks) {
      const module = moduleFor(title, phase);
      const subject = `[${module}] ${title}`;
      const [found] = await db.query(
        'SELECT id,status FROM page_feedback_threads WHERE source_app=? AND subject=? LIMIT 1',
        ['paspas', subject],
      );
      if (found.length) {
        results.push({ subject, action: 'kept', status: found[0].status });
        continue;
      }
      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO page_feedback_threads (id,page_path,page_title,source_app,subject,status,priority,created_by_name) VALUES (?,?,?,?,?,?,?,?)',
        [id, '/admin/teklifler', `${module} — ${phase}`, 'paspas', subject, 'open', priority, 'Transpalet Teklif Aktarım Planı'],
      );
      await db.query(
        'INSERT INTO page_feedback_comments (id,thread_id,message_type,body,attachments,created_by_name) VALUES (?,?,?,?,?,?)',
        [crypto.randomUUID(), id, 'report', `${body}\n\nKaynak: transpalet-crm teklif modülü.\nDetaylı çeklist: CEKLIST-PROMATS-TEKLIF-MODULU-TRANSPALET-AKTARIMI-2026-07-30.md`, '[]', 'Transpalet Teklif Aktarım Planı'],
      );
      results.push({ subject, action: 'inserted', status: 'open' });
    }
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    await db.end();
  }
  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
