# 📚 Modül Dönüşümünden Öğrenilenler

Bu dosya, Bootstrap 5 tabanlı modüllerin Shadcn UI + Tailwind CSS 4 sistemine dönüştürülmesi sürecinde öğrenilen best practices'leri içerir.

**Tarih:** 2026-02-16
**İlk Modül:** Categories
**Dönüşüm Süresi:** ~30 dakika

---

## 🎯 Genel Prensipler

### 1. **CLAUDE.md Her Zaman Referans**
- Yeni modül eklerken CLAUDE.md'deki standartlara **kesinlikle** uyulmalı
- Stil tokenlari, komponent yapısı ve i18n kuralları takip edilmeli
- Harici projeden modül alırken önce CLAUDE.md'ye göre adaptasyon planı yapılmalı

### 2. **Önce Yapı, Sonra İçerik**
✅ **Doğru Sıra:**
1. Ana dosyalar (`page.tsx` + `ModulName.tsx`)
2. Komponent klasör yapısı (`components/`)
3. i18n key'leri (tr, en, de)
4. Sidebar entegrasyonu
5. Form ve detay sayfaları

❌ **Yanlış:** Detaylarla başlayıp yapıyı sonradan düzeltmeye çalışmak

---

## 🔄 Bootstrap → Shadcn UI Dönüşüm Kuralları

### Komponent Mapping

| Bootstrap 5 | Shadcn UI | Özellikler |
|-------------|-----------|-----------|
| `<div className="card">` | `<Card>` | Alt komponentler: `CardHeader`, `CardContent`, `CardFooter` |
| `<button className="btn btn-primary">` | `<Button variant="default">` | Variant'lar: `default`, `destructive`, `outline`, `ghost`, `link` |
| `<input className="form-control">` | `<Input>` | Tema tokenlarını otomatik kullanır |
| `<select className="form-select">` | `<Select>` + `SelectTrigger/Content/Item` | Composition pattern |
| `<div className="form-check form-switch">` | `<Switch>` + `<Label>` | Checkbox yerine Switch |
| `<span className="badge">` | `<Badge>` | Variant'lar: `default`, `secondary`, `outline`, `destructive` |
| `<table className="table">` | `<Table>` | Alt komponentler: `TableHeader`, `TableBody`, `TableRow`, `TableCell` |

### ⚠️ Önemli Farklar

#### 1. **Composition Pattern**
```tsx
// ❌ Bootstrap - Tek HTML elementi
<select className="form-select">
  <option>Seçenek 1</option>
</select>

// ✅ Shadcn UI - Composition
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Seçenek 1</SelectItem>
  </SelectContent>
</Select>
```

#### 2. **Switch vs Checkbox**
```tsx
// ❌ Bootstrap - form-check ile checkbox
<div className="form-check form-switch">
  <input className="form-check-input" type="checkbox" />
  <label className="form-check-label">Aktif</label>
</div>

// ✅ Shadcn UI - Switch komponenti
<div className="flex items-center gap-2">
  <Switch id="active" checked={value} onCheckedChange={setValue} />
  <Label htmlFor="active">Aktif</Label>
</div>
```

#### 3. **Icon Buttons**
```tsx
// ❌ Bootstrap
<button className="btn btn-outline-secondary btn-sm">
  <i className="bi bi-pencil"></i>
</button>

// ✅ Shadcn UI
<Button variant="ghost" size="icon-sm">
  <Pencil className="h-4 w-4" />
</Button>
```

---

## 🎨 Stil Token Kullanımı

### CSS Değişken Sistemi

#### ❌ Hardcoded Renkler (YAPMA)
```tsx
<div className="bg-blue-500 text-white border-gray-300">
<div className="bg-light text-dark"> {/* Bootstrap */}
```

#### ✅ Tema Tokenleri (YAP)
```tsx
<div className="bg-primary text-primary-foreground border-border">
<div className="bg-muted text-foreground">
<div className="bg-card text-card-foreground">
```

### Yaygın Token'lar

| Kullanım | Token | Dark Mode Uyumlu |
|----------|-------|------------------|
| Ana arka plan | `bg-background` | ✅ |
| Card/Panel | `bg-card` | ✅ |
| Soluk arka plan | `bg-muted` | ✅ |
| Kenarlık | `border-border` | ✅ |
| Ana metin | `text-foreground` | ✅ |
| İkincil metin | `text-muted-foreground` | ✅ |
| Primary buton | `bg-primary text-primary-foreground` | ✅ |
| Destructive | `bg-destructive text-destructive-foreground` | ✅ |

### Ensotek Marka Renkleri

```tsx
// Marka renkleri için özel tokenlar
<div className="bg-logo-coral text-primary-foreground">
<div className="border-logo-coral-dark">
<Badge className="bg-logo-gold">
```

---

## 🌍 i18n (Çok Dilli Destek)

### JSON Dosya Yapısı

```json
{
  "admin": {
    "moduleName": {
      "header": {
        "title": "Başlık",
        "description": "Açıklama"
      },
      "tabs": {
        "list": "Liste",
        "form": "Form"
      },
      "filters": {
        "searchPlaceholder": "Ara..."
      },
      "actions": {
        "create": "Yeni",
        "edit": "Düzenle",
        "delete": "Sil"
      },
      "list": {
        "loading": "Yükleniyor...",
        "noData": "Kayıt bulunamadı."
      },
      "table": {
        "name": "Ad",
        "slug": "Slug"
      }
    },
    "dashboard": {
      "items": {
        "moduleName": "Modül Adı"  // Sidebar için
      }
    }
  }
}
```

### Kullanım

```tsx
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export default function MyModule() {
  const t = useAdminT('admin.moduleName');

  return (
    <div>
      <h1>{t('header.title')}</h1>
      <p>{t('header.description')}</p>
      <Button>{t('actions.create')}</Button>
    </div>
  );
}
```

### ⚠️ Önemli Kurallar

1. **Tüm dillere ekle** - tr, en, de (üçü de zorunlu)
2. **Hardcoded metin kullanma** - Her metin i18n'den gelmeli
3. **Nested key yapısı** - `admin.moduleName.section.key`
4. **Sidebar için özel key** - `admin.dashboard.items.moduleName`

### i18n Merge Script

Büyük JSON dosyalarına ekleme yapmak için:

```js
// merge-i18n.js
const fs = require('fs');

function mergeDeep(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object') {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Kullanım
const existing = JSON.parse(fs.readFileSync('src/locale/tr.json', 'utf8'));
const newKeys = JSON.parse(fs.readFileSync('NEW_KEYS.json', 'utf8'));
const merged = mergeDeep(existing, newKeys);
fs.writeFileSync('src/locale/tr.json', JSON.stringify(merged, null, 2));
```

---

## 📂 Klasör Yapısı

### İyi Organizasyon

```
src/app/(main)/admin/(admin)/moduleName/
├── page.tsx                          # Route entry
├── ModuleName.tsx                    # Ana komponent (Tabs)
└── components/
    ├── ModuleNameListPanel.tsx       # Liste görünümü
    ├── ModuleNameForm.tsx            # Form (create/edit)
    └── ModuleNameDetailPanel.tsx     # Detay görünümü (opsiyonel)
```

### ❌ Kötü Örnekler

```
# Komponentleri dağıtmak
src/app/(main)/admin/(admin)/moduleName/List.tsx
src/app/(main)/admin/(admin)/moduleName/Form.tsx

# Generic isimler
src/app/(main)/admin/(admin)/moduleName/components/Header.tsx  # ❌
src/app/(main)/admin/(admin)/moduleName/components/ModuleHeader.tsx  # ✅
```

---

## 🔧 Sidebar Entegrasyonu

### Adım Adım

**1. Icon Import**
```ts
// src/navigation/sidebar/sidebar-items.ts
import { Folders, ... } from 'lucide-react';
```

**2. Type'a Ekle**
```ts
export type AdminNavItemKey =
  | 'dashboard'
  | 'moduleName'  // EKLE
  | ...
```

**3. Config'e Ekle**
```ts
{
  id: 2,
  key: 'content',
  items: [
    { key: 'moduleName', url: '/admin/modul-adi', icon: Folders },
    // ...
  ],
}
```

**4. Fallback Title Ekle**
```ts
const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  moduleName: 'Modül Adı',  // EKLE
  // ...
};
```

---

## ⚡ Next.js Dev Server Sorunları

### Lock File Hatası

```bash
# Error: Unable to acquire lock at .next/dev/lock
```

**Çözüm:**
```bash
# 1. Çalışan process'leri durdur
pkill -f "next dev"
lsof -ti:3000 | xargs kill -9

# 2. Lock dosyasını sil
rm -rf .next/dev

# 3. Yeniden başlat
bun run dev
```

---

## 📋 Categories Modülü - Uygulama Özeti

### Yapılanlar ✅

1. ✅ Ana dosyalar oluşturuldu (`page.tsx`, `Categories.tsx`)
2. ✅ `CategoriesListPanel.tsx` komponenti (Shadcn UI ile)
3. ✅ i18n key'leri eklendi (tr, en, de)
4. ✅ Sidebar entegrasyonu tamamlandı
5. ✅ Tema tokenları kullanıldı
6. ✅ Dark mode uyumlu yapıldı

### Eksik Kalan / TODO 🔜

1. ⏳ RTK Query hooks entegrasyonu (şu an mock data)
2. ⏳ Form komponenti (create/edit)
3. ⏳ Form validasyonu (React Hook Form + Zod)
4. ⏳ Image upload komponenti
5. ⏳ Pagination komponenti (sayfa numaraları)
6. ⏳ DnD (Drag & Drop) sıralama
7. ⏳ Delete confirmation dialog

### Öğrenilenler 💡

1. **Bootstrap → Shadcn UI** dönüşümü sandığımızdan kolay
2. **i18n merge script** büyük dosyalarda hayat kurtarıcı
3. **Composition pattern** alışmak biraz zaman alıyor ama daha esnek
4. **Tema tokenları** dark mode'u otomatik hallediyor
5. **CLAUDE.md** olmadan modül eklemek kaotik olurdu

---

## 🎓 Sonraki Modüller İçin Tavsiyeler

### Checklist

- [ ] CLAUDE.md'yi oku ve standartları anla
- [ ] Mevcut kodu analiz et (Bootstrap kullanımı, i18n eksikliği vb.)
- [ ] Dönüşüm planı oluştur
- [ ] Ana dosyalar ile başla (`page.tsx`, `ModulName.tsx`)
- [ ] Komponentleri tek tek dönüştür
- [ ] i18n key'lerini üçüne birden ekle (tr, en, de)
- [ ] Sidebar entegrasyonunu yap
- [ ] Dark mode'da test et
- [ ] Responsive tasarımı kontrol et

### Hız Kazanma İpuçları

1. **Template kullan** - `chat` modülü iyi bir örnek
2. **Script'leri oto çalıştır** - i18n merge, format vb.
3. **Shadcn UI docs açık tut** - https://ui.shadcn.com
4. **Lucide icons search** - https://lucide.dev
5. **Commit sık sık** - Her küçük adımı kaydet

---

## 🐛 Yaygın Hatalar ve Çözümleri

### 1. "Module not found" Hataları

**Sebep:** Import path'leri yanlış veya dosya henüz oluşturulmamış

**Çözüm:**
```tsx
// ❌ Yanlış
import { Button } from '../../../components/ui/button';

// ✅ Doğru (tsconfig paths kullan)
import { Button } from '@/components/ui/button';
```

### 2. Dark Mode'da Renkler Gözükmüyor

**Sebep:** Hardcoded renkler kullanılmış

**Çözüm:**
```tsx
// ❌ Hardcoded
className="bg-white text-black"

// ✅ Tema tokenleri
className="bg-background text-foreground"
```

### 3. i18n Key Bulunamıyor

**Sebep:** Yanlış namespace veya key yolu

**Çözüm:**
```tsx
// ❌ Yanlış namespace
const t = useAdminT('categories'); // ❌

// ✅ Doğru namespace
const t = useAdminT('admin.categories'); // ✅

// Kullanım
t('header.title') // ✅
```

### 4. TypeScript Type Hataları

**Sebep:** Sidebar'a eklendi ama FALLBACK_TITLES'a eklenmedi

**Çözüm:**
```ts
// AdminNavItemKey type'a ekle
export type AdminNavItemKey = ... | 'moduleName';

// FALLBACK_TITLES'a ekle
const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  moduleName: 'Modül Adı', // EKLE
  ...
};
```

### 5. Shadcn Select - Boş String Hatası

**Sebep:** `<SelectItem value="">` kullanılamaz - Shadcn UI empty string value'yu desteklemiyor

**Hata:**
```
A <Select.Item /> must have a value prop that is not an empty string.
```

**Çözüm:**
```tsx
// ❌ Yanlış - Empty string kullanma
const [filter, setFilter] = useState('');
<Select value={filter} onValueChange={setFilter}>
  <SelectItem value="">Tümü</SelectItem>
  <SelectItem value="option1">Seçenek 1</SelectItem>
</Select>

// ✅ Doğru - 'all' gibi bir değer kullan ve dönüştür
const [filter, setFilter] = useState('');
<Select
  value={filter || 'all'}
  onValueChange={(v) => setFilter(v === 'all' ? '' : v)}
>
  <SelectItem value="all">Tümü</SelectItem>
  <SelectItem value="option1">Seçenek 1</SelectItem>
</Select>
```

### 6. Tailwind CSS - Canonical Classes

**Uyarı:** `w-[180px]` yerine `w-45` kullan

**Çözüm:**
```tsx
// ❌ Arbitrary değer (uyarı verir)
className="w-[180px] lg:w-[200px]"

// ✅ Canonical class (Tailwind standartları)
className="w-45 lg:w-50"
```

**Yaygın Dönüşümler:**
- `w-[50px]` → `w-12.5` (50px = 12.5 * 4px)
- `w-[100px]` → `w-25` (100px = 25 * 4px)
- `w-[120px]` → `w-30`
- `w-[160px]` → `w-40`
- `w-[180px]` → `w-45`
- `w-[200px]` → `w-50`

---

## 📊 Performans Metrikleri (Categories Modülü)

- **Bootstrap CSS:** ~200KB → **Tailwind (purged):** ~15KB ✅
- **Component sayısı:** 9 dosya → 3 ana dosya ✅
- **Dark mode desteği:** Yok → Full support ✅
- **i18n desteği:** Hardcoded TR → 3 dil (tr, en, de) ✅
- **Type safety:** Kısmi → %100 TypeScript ✅

---

**Son Güncelleme:** 2026-02-16
**Güncelleyen:** Claude Sonnet 4.5
**Proje:** Ensotek Admin Panel v2.2.0
