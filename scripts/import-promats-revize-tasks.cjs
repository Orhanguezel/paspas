const crypto = require('node:crypto');
const fs = require('node:fs');
const mysql = require('mysql2/promise');

const publicBase = '/uploads/page-feedback/promats-revize-2026-07-28';
const diskBase = '/var/www/paspas/uploads/page-feedback/promats-revize-2026-07-28';

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
  ['Genel revize dokümanı ve takip', 'Kaynak DOCX içindeki tüm maddelerin ana takip kaydıdır. Bölüm işleri ayrıca oluşturulmuştur.', '/promats/tr', 'Promats Web Genel', 'high', ['promats-revize.docx']],
  ['Tarayıcı başlığını Universal paspaslar olarak değiştir', '“Araca özel otomobil paspasları” yerine “Promats Universal paspaslar” kullanılacak. SEO title veritabanı ve admin panelinden yönetilmeli.', '/promats/tr', 'Ana Sayfa / SEO', 'high', []],
  ['Anasayfa ürün vitrini ölçü ve CTA düzeni', 'Ürünler başlık fontunu büyüt; Ürüne Git butonunu referans konuma taşı; ana paspas görselini bir miktar küçült.', '/promats/tr', 'Anasayfa Ürün Vitrini', 'high', ['image1.png', 'image2.png', 'image3.png', 'image4.png']],
  ['Anasayfa ürün kartlarında Türkçe karakter sorunu', 'Ürün görselleri altındaki seri adlarında Türkçe karakter ve font bozulmalarını düzelt.', '/promats/tr', 'Anasayfa Ürün Listesi', 'high', ['image5.png']],
  ['Neden Promats bölümünü orantılı ve daha kısa yap', 'Gold bandı kısalt; yinelenen alttaki 5 değerini kaldır; şeridi daralt; yan görsel ve arka plan yazısını dengeli kompozisyona getir.', '/promats/tr', 'Anasayfa Neden Promats', 'high', ['image6.png']],
  ['Özellikler bölümünde font ve Türkçe İ düzeltmesi', 'Özellikler, Derin Havuzlu, Yıkanabilir ve Kalite metinlerindeki İ gliflerini düzelt. Metin “1. SINIF KALİTE PVC” olacak. Site geneli Türkçe font kontrolü yap.', '/promats/tr', 'Anasayfa Özellikler', 'critical', ['image7.png', 'image8.png']],
  ['Footer menü ve E-Katalog erişimini düzenle', 'Footer yazım biçimini tek standarda getir. E-Katalog bağlantısını menü yanına taşı; PDF İndir ve Katalog Görüntüle seçenekleri sun.', '/promats/tr', 'Header / Footer / Katalog', 'high', ['image9.png']],
  ['Instagram ve LinkedIn bağlantılarını düzelt', 'Instagram: https://www.instagram.com/promats_carmats/; LinkedIn: https://www.linkedin.com/company/promats-car-mats/. İkonları görünür ve platform renklerinde yap.', '/promats/tr', 'Sosyal Medya', 'high', []],
  ['Kurumsal sayfasını referans tasarıma yaklaştır', 'Kurumsal sayfasını dokümandaki Claude artifact referansına yaklaştır. Üst blok sağında ekteki geçici görseli kullan; medya admin panelinden değiştirilebilsin.', '/promats/tr/hakkimizda', 'Kurumsal Sayfası', 'high', ['image10.png']],
  ['Kurumsal yetkinlik başlığı ve süreç galerisi', '“Dört Temel Yetkinlik” yerine “Temel Yetkinliklerimiz” kullan. Sistematik Bir Süreç Anlayışı altına dört görsellik, admin yönetimli blok ekle.', '/promats/tr/hakkimizda', 'Kurumsal Yetkinlikler', 'high', ['image11.png', 'image12.png', 'image13.png', 'image14.png']],
  ['Ürün detay görsel ve renk bütünlüğü', 'First Class PVC Material damgasını tam göster; arka plan rengini sola kesintisiz devam ettir; referansla renk farkını ve Türkçe font sorunlarını gider.', '/promats/tr/urunler/maximum-serisi', 'Ürün Detay Görsel Tasarım', 'critical', ['image15.png', 'image16.png', 'image17.png', 'image18.png', 'image19.png']],
  ['Ürün detaylarına GEO/SEO akordeon içerikleri ekle', 'Ürün Açıklaması, Teknik Özellikler, Kullanım Alanları, Avantajları, Malzeme ve Dayanıklılık, Universal Tasarım akordeonları ürün bazında DB/admin yönetimli olsun. İsteğe bağlı Devamını Oku bağlantısı ekle.', '/promats/tr/urunler/maximum-serisi', 'Ürün Detay GEO / SEO', 'critical', []],
  ['Ürünle ilgileniyorum iletişim CTA bloğu', 'Ürün detayının sonuna CTA ekle. İletişim formu açıldığında ilgili ürün grubu otomatik seçili gelsin.', '/promats/tr/urunler/maximum-serisi', 'Ürün Detay İletişim CTA', 'high', []],
  ['Üretim sayfası metin revizeleri', 'Belirtilen başlığın sondaki noktasını ve Ürün Geliştirme altındaki “araca özel” ifadelerini kaldır. DB Sayfa İçerikleri kaydını güncelle.', '/promats/tr/uretim', 'Üretim Sayfası', 'normal', ['image20.png', 'image21.png']],
  ['İletişim haritası ve form tasarımını yenile', 'Tam genişlik yerine kompakt/kare harita ve yol tarifi ekle. Formu OEM sayfasındaki tasarıma yaklaştır.', '/promats/tr/iletisim', 'İletişim Sayfası', 'high', ['image22.png']],
  ['İletişim formuna çoklu ürün ve konu alanı', 'Ürün grubunda çoklu seçim sağla. Konu alanı seçenekleri: Ürün Bilgisi, Teklif Talebi, OEM & Private Label, İş Ortaklığı.', '/promats/tr/iletisim', 'İletişim Formu Alanları', 'critical', []],
  ['OEM hero altındaki yinelenen rozetleri kaldır', 'Hemen aşağıda tekrar edilen hero üstü bilgi/rozet öğelerini kaldır.', '/promats/en/oem-manufacturing', 'OEM Hero', 'normal', ['image23.png']],
  ['OEM bilgi bloğunu tek satıra indir', 'İki satırlı bilgi bloğunu tek satıra indir; gerekirse OEM & PRIVATE LABEL tek kartta birleşsin; responsive yapı korunsun.', '/promats/en/oem-manufacturing', 'OEM Bilgi Bloğu', 'high', ['image24.png']],
  ['OEM sayfası başlık hiyerarşisini standartlaştır', 'Tüm bölüm başlıklarında ilk satır küçük ve farklı renk, ikinci satır büyük olacak şekilde Promats başlık standardını uygula.', '/promats/en/oem-manufacturing', 'OEM Başlık Tasarımı', 'high', ['image25.png', 'image26.png']],
  ['OEM ürün kartları, koyu tema ve Inquiry temizliği', 'Ürün kartlarına görselleri ekle; Send Your Inquiry bloğunu kaldır; sayfayı Promats koyu tasarım diliyle uyumlu yap.', '/promats/en/oem-manufacturing', 'OEM Ürünler ve Tema', 'high', ['image27.png']],
].map(([title, ...rest]) => [`[Promats Revize] ${title}`, ...rest]);

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
        ['promats-web', subject],
      );
      if (existing.length) {
        results.push({ id: existing[0].id, subject, status: existing[0].status, action: 'kept' });
        continue;
      }
      const id = crypto.randomUUID();
      await connection.query(
        'INSERT INTO page_feedback_threads (id,page_path,page_title,source_app,subject,status,priority,created_by_name) VALUES (?,?,?,?,?,?,?,?)',
        [id, pagePath, pageTitle, 'promats-web', subject, 'open', priority, 'Promats Revize Dokümanı'],
      );
      await connection.query(
        'INSERT INTO page_feedback_comments (id,thread_id,message_type,body,attachments,created_by_name) VALUES (?,?,?,?,?,?)',
        [crypto.randomUUID(), id, 'report', body, JSON.stringify(attachments(names)), 'Promats Revize Dokümanı'],
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
