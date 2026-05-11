# Market Pulse — Ürün Geliştirme Checklist

Kaynak: Müşteri geri bildirimi (Veri Kazıma ve Pazarlama Otomasyonu.docx) + mimari analiz.
Bu dosya tartışıldıkça güncellenir. Tamamlananlar ✅, bekleyenler ⬜ olarak işaretlenir.

---

## 1. UX / Sidebar Sadeleştirmesi

> "Menüler biraz kalabalık, aradığını bulmak zorlaşıyor."

- [ ] Sistem & Ayarlar grubunu sidebar'dan kaldır → sağ üst köşe ⚙️ ikonuna taşı
- [ ] Genel/Yönetim grubunu sidebar'dan kaldır → aynı ikon altında
- [ ] Test Merkezi, Yazılımcı Notları, Dokümantasyon → gizli "geliştirici modu" veya sadece ikon
- [ ] Sidebar sıralamasını iş akışına göre yeniden düzenle (bkz. Bölüm 2)
- [ ] Menü etiketlerini gözden geçir: "Market Pulse" → "Özet / Ana Ekran" vb.

---

## 2. Menü / Navigasyon Yeniden Düzeni

> "Menüleri iş akışına göre düzenleyelim."

Hedef sıralama:

- [ ] Ana Ekran (mevcut Market dashboard)
- [ ] İdeal Müşteri Profilleri (ICP)
- [ ] Lead Tarama (Fuar + B2B + Amazon birleşik giriş)
- [ ] Lead Adayları (Potansiyel Müşteriler)
- [ ] Lead Pipeline (Müşteri Adayı Takibi)
- [ ] Hedef Firmalar
- [ ] Sinyaller
- [ ] Raporlar

---

## 3. ICP Ekranı Yeniden Tasarımı

> "Yazmak yerine seçim yaptırabiliriz. Çok daha doğru lead getirir."

- [ ] Sektör dropdown (çoklu seçim)
- [ ] Alt sektör — seçilen sektöre bağlı dinamik liste
- [ ] Firma tipi seçimi (Distributor / Wholesaler / Manufacturer / Retailer / E-commerce vb.)
- [ ] Hedef bölge / ülke seçimi
- [ ] Firma büyüklüğü (çalışan sayısı aralığı)
- [ ] Lead tipi seçimi: **Fuar / B2B / Amazon** (ICP hangi kanala yönelik)
- [ ] Serbest açıklama alanı (keyword, özel notlar) — en sona
- [ ] Mevcut serbest metin formunu kaldır veya "gelişmiş" toggle altına al

---

## 4. Lead Tarama — Birleşik Ekran

> "Fuar, B2B, Amazon'u birleştirirsek nasıl olur?"

- [ ] Tek "Lead Tarama" giriş ekranı oluştur
- [ ] Kaynak seçimi: Fuar / B2B / Amazon (ilk adım)
- [ ] Kaynağa göre dinamik form alanları
- [ ] Kayıtlı ICP listesi — seçilen kaynakla eşleşen profiller gelsin
- [ ] ICP seçilince tarama parametreleri otomatik dolsun
- [ ] Backend ayrı kalsın (scraper logic değişmez), sadece UI birleşir
- [ ] Fuar, B2B, Amazon mevcut ayrı sayfaları silinebilir (birleşik ekran tamamlanınca)

---

## 5. B2B Lead Tarama — Tam Senaryo Implementasyonu

> Detaylı B2B kullanım senaryosu (bkz. doküman)

### 5a. Veri Toplama
- [ ] Firma web sitesi scraping (ürün kategorileri, hakkımızda, iletişim)
- [ ] İthalat kaydı entegrasyonu (varsa — ImportYeti / Panjiva API veya scraper)
- [ ] Çalışan sayısı tahmini (LinkedIn veya site ipuçları)
- [ ] Karar verici kişi tespiti (LinkedIn scraper veya Apollo entegrasyonu)
- [ ] AI match score hesaplama — ICP'ye ne kadar uyduğunu puanla

### 5b. Lead Listesi Gösterimi
- [ ] Her firma için kart: neden eşleşti / hangi ürünler / tahmini yapı / karar verici / match score
- [ ] Kaynak etiketi (Fuar / B2B / Amazon) her adayda görünsün
- [ ] "Zenginleştir" butonu — tekli ve toplu

### 5c. Kullanıcı Değerlendirmesi
- [ ] Onayla / Reddet / Favorile aksiyonları (mevcut var, iyileştirilecek)
- [ ] Reddetme sebebi zorunlu tag seçimi (ör: "Kendi üretimi var", "Çok küçük", "Yanlış sektör")
- [ ] Reddetme sebebi sisteme kaydedilsin (feedback öğrenme için temel)

---

## 6. Lead Adayları (Potansiyel Müşteriler) İyileştirmeleri

- [ ] Hangi kaynaktan geldiği (Fuar/B2B/Amazon) filtresi ve etiketi
- [ ] ICP profili etiketi (hangi tarama ile geldi)
- [ ] Reddetme sonrası "bu profili bir daha getirme" kural tanımlama

---

## 7. Feedback Öğrenme Sistemi (Basit Kural Tabanlı)

> "Sistem gün geçtikçe öğrenecek ve manuel işlem azalacak."

- [ ] Reddedilen adayların sebeplerini tag'li sakla (DB şeması)
- [ ] Aynı ICP + aynı red sebebi → sonraki taramalarda düşük puan ver
- [ ] "Bu profil tipini bir daha getirme" kuralı arayüzden tanımlanabilsin
- [ ] Red pattern'leri raporunda göster (hangi sebepler en çok tekrar ediyor)
- [ ] Onaylanan/dönüşen adayların ortak özelliklerini tespit et (basit istatistik)

---

## 8. Outreach Kişiselleştirme

> "Firmaya özel mail. Standart mail işe yaramıyor."

- [ ] Firma detay sayfasında özelleştirilmiş outreach taslağı
- [ ] Prompt'a beslenen bağlam: web sitesi içeriği + ürün kategorileri + enrichment verisi
- [ ] Taslak oluştururken "firma hakkında öğrenilen" veriler görünür olsun
- [ ] Mail konu başlığı ve gövde ayrı düzenlenebilsin
- [ ] Gönderim sonrası "yanıt aldı / yanıt vermedi" takibi

---

## 9. Lead Pipeline (Müşteri Adayı Takibi)

- [ ] Kanban veya liste görünümü: İletişim Kurulmadı → Yazıştık → Görüşme → Teklif → Müşteri / Kayıp
- [ ] Müşteri olarak işaretlenince "dönüşüm" kaydı oluşsun
- [ ] Dönüşen müşterilerin ICP eşleşme oranı istatistiği

---

## 10. Hedef Firmalar Modülü — Kullanıcıya Açıklama

- [ ] Modül açıklaması ekle: "Rakip ve potansiyel müşterilerin periyodik izleme tahtası"
- [ ] Onboarding / boş durum ekranına "nasıl kullanılır" metni
- [ ] Firmaya sinyal bağlantısı: fiyat değişikliği, yeni ürün, sosyal medya aktivitesi

---

## Notlar

- Backend scraping mantığı değişmez; UX ve iş akışı katmanı öncelikli.
- Her bölüm bağımsız tamamlanabilir — önce UX (1-2), sonra ICP (3), sonra B2B (5).
- Öğrenme sistemi (7) basit kural tabanlı başlar, ML ikinci faz.
- Yeni talepler bu dosyanın altına eklenir.
