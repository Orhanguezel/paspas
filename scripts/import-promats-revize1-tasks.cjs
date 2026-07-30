const crypto = require('node:crypto');
const fs = require('node:fs');
const mysql = require('mysql2/promise');

const publicBase = '/uploads/page-feedback/promats-revize1-2026-07-30';
const diskBase = '/var/www/paspas/uploads/page-feedback/promats-revize1-2026-07-30';

function attachments(names) {
  return names.map((name) => ({
    assetId: crypto.randomUUID(),
    url: `${publicBase}/${name}`,
    name,
    mime: name.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'image/png',
    size: fs.statSync(`${diskBase}/${name}`).size,
  }));
}

const tasks = [
  ['Genel revize dokümanı ve takip', 'İkinci değerlendirme turunun kaynak DOCX kaydıdır. Bölüm işleri ayrı kartlarda izlenir.', '/promats/tr', 'Promats Web Genel', 'high', ['promats-revize1.docx']],
  ['Site genelinde Türkçe karakter ve font tutarlılığı', 'Tüm TR sayfalarında font ailesi ve ağırlıkları taranacak; özellikle İ/ı/Ş/ş/Ğ/ğ/Ç/ç/Ö/ö/Ü/ü glifleri ürün adları, başlıklar ve büyük harfli metinlerde tutarlı ve bozulmadan gösterilecek.', '/promats/tr', 'Site Geneli Tipografi', 'critical', ['image3.png', 'image8.png', 'image9.png']],
  ['Anasayfa ürün vitrini kompozisyonunu referansa yaklaştır', 'Mevcut ve yeni site ekran görüntülerindeki ürün görseli, başlık, ürün adı ve CTA oranları karşılaştırılarak yeni yerleşim mevcut site kompozisyonuna yaklaştırılacak.', '/promats/tr', 'Anasayfa Ürün Vitrini', 'high', ['image1.png', 'image2.png']],
  ['Neden Promats bölümünün kompozisyonunu düzenle', 'Referans yerleşime yaklaş; uygun boşluk varsa araç içindeki paspası büyüt. Arka plandaki yinelenen Neden Promats yazısını okunurluğu bozmayacak şekilde düzenle veya tasarım tercihi değilse kaldır.', '/promats/tr', 'Anasayfa Neden Promats', 'high', ['image4.png', 'image5.png', 'image6.png', 'image7.png']],
  ['Özellikler metin ve Türkçe İ gliflerini düzelt', 'Metin “1. SINIF KALİTE PVC” olacak. Özellikler, Derin Havuzlu, Yıkanabilir ve Kalite metinlerindeki İ karakterleri aynı tipografik biçimde görünecek.', '/promats/tr', 'Anasayfa Özellikler', 'critical', ['image8.png', 'image9.png']],
  ['Footer sosyal medya ikonlarını marka renkleriyle göster', 'Sayfa altındaki renksiz sosyal medya ikonlarını üst bölümde kullanılan renkli ikon standardıyla eşleştir.', '/promats/tr', 'Footer Sosyal Medya', 'normal', ['image10.png', 'image11.png']],
  ['E-Katalog menüsü ve etkileşimini yenile', 'Üst E-Katalog düğmesinde katalog ikonu kullan. Tıklayınca yan yana Katalog Görüntüle ve PDF İndir seçenekleri açılsın; dışarı tıklayınca kapansın. Alt bölümdeki ayrı katalog düğmesini kaldır. Katalog Görüntüle seçeneği sayfa sayfa çevrimiçi katalog deneyimi sunsun.', '/promats/tr', 'Header / E-Katalog', 'high', ['image12.png', 'image13.png', 'image14.png', 'image15.png']],
  ['Kurumsal sayfasını verilen referans tasarıma yaklaştır', 'Sayfa https://claude.ai/public/artifacts/32c583b0-85ec-45c4-ad51-bea235a74891 referansına göre yeniden ele alınacak. Üst blok sağında ekteki geçici görsel kullanılacak ve sonra yönetilebilir biçimde değiştirilebilecek.', '/promats/tr/hakkimizda', 'Kurumsal Sayfası', 'critical', ['image16.png']],
  ['Kurumsal yetkinlik başlığı ve süreç görselleri', '“Dört Temel Yetkinlik” yerine “Temel Yetkinliklerimiz” kullan. Sistematik Bir Süreç Anlayışı altına ayrı blok olarak ekteki dört görseli ekle.', '/promats/tr/hakkimizda', 'Kurumsal Yetkinlikler', 'high', ['image17.png', 'image18.png', 'image19.png', 'image20.png']],
  ['Ürünler sayfası grafikçi revizesini bekliyor', 'Ana yapı olumlu bulundu. Grafikçiden gelecek küçük tasarım revizeleri alınmadan kapsam genişletilmemeli; görseller gelince kabul kriterleri güncellenecek.', '/promats/tr/urunler', 'Ürünler Sayfası', 'normal', []],
  ['Ürün detayında rozet kırpılması ve renk bütünlüğü', 'First Class PVC Material damgasını kesilmeden tam göster. Ürün görselinin altındaki rengi sola kesintisiz devam ettir ve mevcut sayfadaki referans renkle eşleştir. Bu sayfada Türkçe fontları da doğrula.', '/promats/tr/urunler/maximum-serisi', 'Ürün Detay Görsel Tasarım', 'critical', ['image21.png', 'image22.png', 'image23.png', 'image24.png', 'image25.png']],
  ['İletişim sayfası yerleşimini ve giriş metnini yenile', 'Sayfa açılışında önce iletişim kutusunu göster; harita merkezdeki ana öğe olmasın. Referans tasarıma yakın yerleşim kullan. TR başlıkları “BİZE ULAŞIN” ve “DOĞRU ÇÖZÜM İÇİN BURADAYIZ”; açıklama ve üç fayda maddesi kaynak DOCX içeriğine göre uygulanacak. EN sayfada görseldeki İngilizce metin kullanılacak.', '/promats/tr/iletisim', 'İletişim Sayfası', 'critical', ['image26.png']],
  ['İlgilenilen ürün grubunu kompakt çoklu seçime dönüştür', 'Alan birden fazla seçime izin versin. Tüm seçenekleri sürekli açık göstermek yerine kapalı dropdown, checkbox veya eşdeğer kompakt çoklu seçim bileşeni kullan.', '/promats/tr/iletisim', 'İletişim Formu', 'high', ['image26.png']],
  ['OEM bilgi bloğunu tek satıra indir', 'Bilgi kartlarını iki satır yerine tek satır yap. Alan yetmezse OEM & PRIVATE LABEL tek kartta birleşebilir; responsive görünüm korunacak.', '/promats/en/oem-manufacturing', 'OEM Bilgi Bloğu', 'high', ['image27.png']],
  ['OEM sayfası başlık hiyerarşisini standartlaştır', 'Tüm bölüm başlıklarında ilk satır küçük fontlu ve farklı renkli, ikinci satır büyük fontlu olacak; belgedeki örnek bütün OEM başlıklarına uygulanacak.', '/promats/en/oem-manufacturing', 'OEM Başlık Tasarımı', 'high', ['image28.png', 'image29.png']],
].map(([title, ...rest]) => [`[Web] ${title}`, ...rest]);

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const results = [];
  await connection.beginTransaction();
  try {
    for (const [subject, body, pagePath, pageTitle, priority, names] of tasks) {
      const [existing] = await connection.query(
        'SELECT id,status FROM page_feedback_threads WHERE source_app=? AND subject=? LIMIT 1',
        ['paspas', subject],
      );
      if (existing.length) {
        results.push({ id: existing[0].id, subject, status: existing[0].status, action: 'kept' });
        continue;
      }
      const id = crypto.randomUUID();
      await connection.query(
        'INSERT INTO page_feedback_threads (id,page_path,page_title,source_app,subject,status,priority,created_by_name) VALUES (?,?,?,?,?,?,?,?)',
        [id, pagePath, `Web — ${pageTitle}`, 'paspas', subject, 'open', priority, 'Promats Revize 1 Dokümanı'],
      );
      await connection.query(
        'INSERT INTO page_feedback_comments (id,thread_id,message_type,body,attachments,created_by_name) VALUES (?,?,?,?,?,?)',
        [crypto.randomUUID(), id, 'report', body, JSON.stringify(attachments(names)), 'Promats Revize 1 Dokümanı'],
      );
      results.push({ id, subject, status: 'open', action: 'inserted' });
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
