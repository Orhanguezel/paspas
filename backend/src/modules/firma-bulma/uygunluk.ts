export type UygunlukGirdisi = {
  hsKodlari: string[];
  profilHsKodlari: string[];
  ulke?: string | null;
  hedefUlkeler: string[];
  sevkiyat: number;
  tedarikci: number;
  sonSevkiyat?: string | Date | null;
  epostaSayisi?: number;
};

const kod = (deger: string) => deger.replace(/\D/g, '').slice(0, 12);
const metin = (deger: string | null | undefined) => String(deger ?? '').trim().toLocaleUpperCase('tr-TR');

/**
 * Radar'daki firma uygunluğu yaklaşımının ERP karşılığı.
 *
 * Puan yalnız kanıtlanabilen eksenlerden oluşur: ürün kodu, hedef pazar,
 * sevkiyat yoğunluğu/güncelliği ve iletişim bulunabilirliği. Sıfır puan
 * "kötü firma" değil, mevcut kanıtla önceliklendirilemedi demektir.
 */
export function uygunlukHesapla(girdi: UygunlukGirdisi) {
  let puan = 0;
  const nedenler: string[] = [];
  const profil = [...new Set(girdi.profilHsKodlari.map(kod).filter((item) => item.length >= 3))];
  const firma = [...new Set(girdi.hsKodlari.map(kod).filter((item) => item.length >= 3))];
  const tam = profil.find((wanted) => firma.some((actual) => actual.startsWith(wanted) || wanted.startsWith(actual)));
  if (tam) { puan += 45; nedenler.push(`HS Code ${tam} için doğrulanmış alım kaydı`); }

  const hedefler = new Set(girdi.hedefUlkeler.map(metin).filter(Boolean));
  if (girdi.ulke && hedefler.has(metin(girdi.ulke))) { puan += 15; nedenler.push('Hedef pazarda'); }

  const sevkiyat = Math.max(0, Number(girdi.sevkiyat) || 0);
  if (sevkiyat >= 20) { puan += 15; nedenler.push(`${sevkiyat} kaynak sevkiyat kaydı`); }
  else if (sevkiyat >= 5) { puan += 10; nedenler.push(`${sevkiyat} kaynak sevkiyat kaydı`); }
  else if (sevkiyat > 0) { puan += 5; nedenler.push(`${sevkiyat} kaynak sevkiyat kaydı`); }

  const son = girdi.sonSevkiyat ? new Date(girdi.sonSevkiyat) : null;
  if (son && !Number.isNaN(son.getTime())) {
    const ay = Math.max(0, (Date.now() - son.getTime()) / 2_629_746_000);
    if (ay <= 12) { puan += 15; nedenler.push('Son 12 ayda sevkiyat'); }
    else if (ay <= 36) { puan += 8; nedenler.push('Son 36 ayda sevkiyat'); }
  }

  if (Number(girdi.tedarikci) >= 2) { puan += 5; nedenler.push('Birden fazla tedarikçiyle çalışıyor'); }
  if (Number(girdi.epostaSayisi) > 0) { puan += 5; nedenler.push('Doğrulanabilir e-posta bulundu'); }
  return { puan: Math.min(100, puan), nedenler };
}

export function uygunlukEtiketi(puan: number) {
  if (puan >= 75) return 'Yüksek potansiyel';
  if (puan >= 50) return 'Potansiyel müşteri';
  if (puan >= 30) return 'İncelenecek';
  return 'Kanıt sınırlı';
}
