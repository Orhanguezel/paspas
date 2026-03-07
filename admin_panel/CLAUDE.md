
# CLAUDE.md — Paspas Üretim ERP — Admin Panel

Üst dizin kuralları: `../CLAUDE.md` — bu dosya yalnızca admin panel katmanına özgü kurallar + teknik referans içerir.

---

## Proje Bağlamı

Bu, şablondan türetilmiş **Paspas Üretim ERP** admin panelidir.
ERP modülleri ve genel kurallar için: `../CLAUDE.md`

### ERP Modül ↔ Route Eşleşmesi

| Modül | Route | Endpoint Dosyası |
|-------|-------|-----------------|
| Dashboard | `/admin/dashboard` | `dashboard_admin.endpoints.ts` |
| Ürünler | `/admin/urunler` | `urunler_admin.endpoints.ts` |
| Reçeteler | `/admin/receteler` | `receteler_admin.endpoints.ts` |
| Müşteriler | `/admin/musteriler` | `musteriler_admin.endpoints.ts` |
| Satış Siparişleri | `/admin/satis-siparisleri` | `satis_siparisleri_admin.endpoints.ts` |
| Üretim Emirleri | `/admin/uretim-emirleri` | `uretim_emirleri_admin.endpoints.ts` |
| Makine Havuzu | `/admin/makine-havuzu` | `makine_admin.endpoints.ts` |
| İş Yükleri | `/admin/is-yukler` | `makine_admin.endpoints.ts` |
| Gantt | `/admin/gantt` | `makine_admin.endpoints.ts` |
| Stoklar | `/admin/stoklar` | `stoklar_admin.endpoints.ts` |
| Satın Alma | `/admin/satin-alma` | `satin_alma_admin.endpoints.ts` |
| Hareketler | `/admin/hareketler` | `hareketler_admin.endpoints.ts` |
| Operatör | `/admin/operator` | `operator_admin.endpoints.ts` |
| Tanımlar | `/admin/tanimlar` | `tanimlar_admin.endpoints.ts` |

### Şablondan Kaldırılan Modüller

Şu route/klasörler şablondan **silinecek** (e-ticaret'e özgü):
`slider` `banner` `popups` `flash-sale` `kuponlar` `newsletter` `email-templates`
`telegram` `cart` `wallet` `subscriptions` `seller` `news` `newsAggregator`
`reviews` `contacts` `faqs` `announcements` `chat` `audit`

### Şablondan Korunan Altyapı

Aşağıdakiler değiştirilmez, üzerine inşa edilir:
- `baseApi.ts` ve `tags.ts`
- `components/ui/` (Shadcn bileşenleri)
- Auth akışı (login / JWT refresh / logout)
- Theme sistemi (OKLCH + presets)
- i18n altyapısı (`locale/`)
- Sidebar layout bileşeni

### Dosya Adlandırma Kuralı (ERP modülleri)

```
sayfa:       src/app/(main)/admin/(admin)/urunler/page.tsx
panel:       src/app/(main)/admin/(admin)/urunler/_components/urunler-list-panel.tsx
form:        src/app/(main)/admin/(admin)/urunler/_components/urun-form.tsx
detay:       src/app/(main)/admin/(admin)/urunler/[id]/page.tsx
endpoint:    src/integrations/endpoints/admin/urunler_admin.endpoints.ts
```

---

## Aşağısı: Teknik Referans (Şablondan Gelen)

**Ensotek Admin Panel** - Next.js 16 tabanlı, dinamik tema desteği olan modern admin yönetim paneli.

- **Framework:** Next.js 16.1.1 (App Router)
- **UI Framework:** React 19.2.3
- **Stil:** Tailwind CSS 4.1.5 + CSS Variables (OKLCH color space)
- **Komponent Kütüphanesi:** Shadcn/UI + Radix UI primitives
- **State Management:** Redux Toolkit 2.11.2 + RTK Query
- **Form Yönetimi:** React Hook Form + Zod validation
- **İkonlar:** Lucide React
- **Dil Desteği:** i18n (tr, en, de)
- **Linter:** Biome 2.3.8
- **Runtime:** Node.js / Bun

---

## 🎨 Tema ve Stil Sistemi

### 1. Dinamik Tema Yapısı

Admin panel, **kullanıcı tercihlerine göre dinamik olarak değişen** bir tema sistemine sahiptir.

#### Tema Bileşenleri

1. **Theme Mode**: `light` | `dark`
2. **Theme Preset**: `default` | `brutalist` | `soft-pop` | `tangerine`
3. **Font Family**: `inter` | `roboto` | `poppins` | `geist` | `jakarta` vb.
4. **Content Layout**: `centered` | `full-width`
5. **Navbar Style**: `sticky` | `scroll`
6. **Sidebar Variant**: `sidebar` | `inset` | `floating`
7. **Sidebar Collapsible**: `icon` | `offcanvas`

#### Tema Dosya Yapısı

```
admin_panel/
├── src/
│   ├── app/
│   │   ├── globals.css                    # Ana stil dosyası
│   │   ├── PreferencesEffects.tsx         # Tema değişikliklerini DOM'a uygular
│   │   └── PreferencesBoot.tsx            # Sayfa yüklenirken DOM'dan tema okur
│   ├── styles/
│   │   └── presets/
│   │       ├── brutalist.css              # Brutalist tema
│   │       ├── soft-pop.css               # Soft Pop tema
│   │       └── tangerine.css              # Tangerine tema
│   ├── lib/
│   │   ├── preferences/
│   │   │   ├── theme.ts                   # Tema sabitleri
│   │   │   ├── theme-utils.ts             # Tema utility fonksiyonları
│   │   │   ├── layout.ts                  # Layout sabitleri
│   │   │   ├── layout-utils.ts            # Layout utility fonksiyonları
│   │   │   ├── preferences-config.ts      # Tercih varsayılanları ve persistence
│   │   │   └── preferences-storage.ts     # Cookie/localStorage yönetimi
│   │   └── fonts/
│   │       └── registry.ts                # Font registry
│   └── scripts/
│       ├── theme-boot.tsx                 # Pre-hydration boot script
│       └── generate-theme-presets.ts      # Tema preset generator
```

### 2. CSS Değişken Sistemi (Design Tokens)

#### Ensotek Marka Renkleri

```css
:root {
  /* Logo Primary Colors */
  --logo-coral-light: #F4BDB3;      /* Highlights, light bg text */
  --logo-coral: #E8A598;            /* Main brand color */
  --logo-coral-medium: #D88D7E;     /* Default logo on light */
  --logo-coral-dark: #C77665;       /* Logo on very light bg */
  --logo-coral-darkest: #A6604F;    /* Text, details */

  /* Background Colors for Logo */
  --logo-bg-light: #FDFCFB;         /* Light mode primary */
  --logo-bg-white: #FFFFFF;         /* Pure white */
  --logo-bg-dark: #1A1512;          /* Dark mode */
  --logo-bg-black: #0A0806;         /* Pure black */

  /* Logo Accents */
  --logo-gold: #E8C57A;             /* Accent touch */
  --logo-shadow: rgba(232, 165, 152, 0.15);  /* Soft glow */
}
```

#### Temel Tema Tokenleri (OKLCH format)

**Light Mode:**
```css
:root {
  --background: oklch(1 0 0);                    /* Beyaz */
  --foreground: oklch(0.141 0.005 285.823);      /* Koyu gri */
  --primary: var(--logo-coral);                  /* Ensotek Coral */
  --primary-foreground: oklch(0.985 0 0);        /* Açık metin */
  --muted: oklch(0.967 0.001 286.375);           /* Soluk arka plan */
  --border: oklch(0.92 0.004 286.32);            /* Kenarlık */
  --card: oklch(1 0 0);                          /* Card arka plan */
  --radius: 0.625rem;                            /* 10px border radius */
}
```

**Dark Mode:**
```css
.dark {
  --background: oklch(0.141 0.005 285.823);      /* Koyu gri */
  --foreground: oklch(0.985 0 0);                /* Açık beyaz */
  --primary: var(--logo-coral-medium);           /* Coral Medium */
  --primary-foreground: oklch(0.141 0.005 285.823); /* Koyu metin */
  --muted: oklch(0.274 0.006 286.033);           /* Koyu soluk */
  --border: oklch(1 0 0 / 10%);                  /* Yarı saydam */
}
```

#### Tailwind Tema Bağlantısı

Tailwind CSS, bu CSS değişkenlerini kullanır:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --radius-lg: var(--radius);
  /* ... */
}
```

**Kullanım:**
```tsx
<div className="bg-primary text-primary-foreground">
<div className="bg-background border-border">
<Button className="bg-logo-coral hover:bg-logo-coral-dark">
```

### 3. Tema Preset Sistemi

Her preset, `data-theme-preset` attribute ile aktif edilir ve kendi CSS değişkenlerini override eder.

**Örnek: Brutalist Theme**
```css
/* styles/presets/brutalist.css */
:root[data-theme-preset="brutalist"] {
  --radius: 0px;                              /* Keskin köşeler */
  --primary: oklch(0.6489 0.237 26.9728);     /* Kırmızımsı turuncu */
  --border: oklch(0 0 0);                     /* Siyah kenarlık */
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1); /* Brutalist gölge */
}
```

#### Yeni Tema Preset Ekleme

1. `src/styles/presets/yeni-tema.css` oluştur
2. `src/app/globals.css` içine import et:
   ```css
   @import "../styles/presets/yeni-tema.css";
   ```
3. `src/lib/preferences/theme.ts` içine ekle:
   ```ts
   export const THEME_PRESET_OPTIONS = [
     // ...
     {
       label: "Yeni Tema",
       value: "yeni-tema",
       primary: {
         light: "oklch(...)",
         dark: "oklch(...)",
       },
     },
   ] as const;
   ```
4. Script çalıştır: `npm run generate:presets`

---

## 🧩 Komponent Sistemi (Shadcn/UI)

### Komponent Yapısı

Tüm UI komponentleri `src/components/ui/` klasöründe ve **Radix UI primitives** üzerine kurulu.

#### Temel Komponent Şablonu

```tsx
// src/components/ui/button.tsx
import * as React from "react"
import { Slot as SlotPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

### Önemli Komponent Özellikleri

1. **CVA (Class Variance Authority)** kullanımı - variant ve size sistem
2. **cn() utility** - className birleştirme (`tailwind-merge` + `clsx`)
3. **data-slot** attribute - debugging ve styling için
4. **Radix UI Slot** - `asChild` prop ile kompozisyon
5. **TypeScript** - tam tip güvenliği

### Mevcut UI Komponentleri

```
src/components/ui/
├── accordion.tsx
├── alert-dialog.tsx
├── alert.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── carousel.tsx
├── chart.tsx
├── checkbox.tsx
├── command.tsx
├── dialog.tsx
├── drawer.tsx
├── dropdown-menu.tsx
├── empty.tsx
├── field.tsx
├── form.tsx
├── input.tsx
├── label.tsx
├── popover.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── sidebar.tsx
├── skeleton.tsx
├── sonner.tsx (toast)
├── spinner.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
└── tooltip.tsx
```

### Yeni Komponent Ekleme

Harici projeden komponent alırken:

1. **Stil Uyumu Kontrol Et**:
   - `bg-primary`, `text-foreground`, `border-border` gibi tema tokenleri kullanıyor mu?
   - OKLCH color space uyumlu mu?
   - Dark mode desteği var mı?

2. **CVA Variant Standardı**:
   ```tsx
   const variants = cva(
     "base-classes", // Hepsi için ortak
     {
       variants: {
         variant: { /* ... */ },
         size: { /* ... */ },
       },
       defaultVariants: { /* ... */ },
     }
   )
   ```

3. **data-slot Attribute Ekle**:
   ```tsx
   <div data-slot="komponent-name" className={...}>
   ```

4. **TypeScript Props**:
   ```tsx
   React.ComponentProps<"div"> & VariantProps<typeof variants>
   ```

---

## 🌍 Dil Desteği (i18n)

### Dil Dosyaları

```
src/locale/
├── tr.json    # Türkçe
├── en.json    # İngilizce
└── de.json    # Almanca
```

### JSON Yapısı

```json
{
  "admin": {
    "chat": {
      "header": {
        "title": "Chat & AI Destek",
        "description": "Müşteri mesajları, AI cevapları ve bilgi tabanı yönetimi."
      },
      "tabs": {
        "threads": "Konuşmalar",
        "knowledge": "Bilgi Tabanı",
        "settings": "Ayarlar"
      },
      "threads": {
        "title": "Aktif Konuşmalar",
        "noThreads": "Henüz konuşma yok.",
        "modeAdmin": "Admin",
        "modeAi": "AI",
        "takeover": "Devral",
        "releaseToAi": "AI'ya Bırak"
      },
      "messages": {
        "noMessages": "Henüz mesaj yok.",
        "placeholder": "Mesajınızı yazın...",
        "sendError": "Mesaj gönderilemedi."
      }
    }
  }
}
```

### Kullanım

```tsx
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export default function ChatPage() {
  const t = useAdminT('admin.chat');

  return (
    <div>
      <h1>{t('header.title')}</h1>
      <p>{t('header.description')}</p>
      <Button>{t('threads.takeover')}</Button>
    </div>
  );
}
```

### Yeni Dil Anahtarı Ekleme

1. **Tüm dil dosyalarına ekle** (tr.json, en.json, de.json)
2. **Nested key kullan** - `admin.moduleName.section.key`
3. **Dinamik değerler için placeholders**:
   ```json
   "description": "Toplam {count} kayıt bulundu."
   ```
   ```tsx
   t('description', { count: items.length })
   ```

---

## 📁 Modül Yapısı ve Organizasyon

### Admin Modül Klasör Yapısı

```
src/app/(main)/admin/(admin)/
├── chat/
│   ├── page.tsx                          # Route entry
│   ├── Chat.tsx                          # Main component
│   └── components/
│       ├── ChatThreadsPanel.tsx          # Alt panel
│       ├── ChatKnowledgePanel.tsx        # Alt panel
│       └── ChatSettingsPanel.tsx         # Alt panel
├── dashboard/
│   ├── page.tsx
│   └── Dashboard.tsx
├── contacts/
│   ├── page.tsx
│   └── Contacts.tsx
└── ...
```

### Yeni Modül Ekleme Checklist

#### 1. Klasör ve Dosya Oluşturma

```bash
src/app/(main)/admin/(admin)/yeni-modul/
├── page.tsx                    # Next.js route
├── YeniModul.tsx               # Ana komponent
└── components/                 # Alt komponentler (opsiyonel)
    ├── YeniModulList.tsx
    └── YeniModulForm.tsx
```

**page.tsx şablonu:**
```tsx
// src/app/(main)/admin/(admin)/yeni-modul/page.tsx
import YeniModul from './YeniModul';

export default function Page() {
  return <YeniModul />;
}
```

**Ana komponent şablonu:**
```tsx
// src/app/(main)/admin/(admin)/yeni-modul/YeniModul.tsx
'use client';

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export default function YeniModul() {
  const t = useAdminT('admin.yeniModul');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('header.title')}</CardTitle>
          <CardDescription>{t('header.description')}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">{t('tabs.list')}</TabsTrigger>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* İçerik */}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* İçerik */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 2. Sidebar'a Ekleme

**Dosya:** `src/navigation/sidebar/sidebar-items.ts`

3 yerde değişiklik gerekir:

```ts
// 1. Icon import ekle (üst kısım)
import { BookOpen, /* diğer ikonlar */ } from 'lucide-react';

// 2. AdminNavItemKey type'a ekle
export type AdminNavItemKey =
  | 'dashboard'
  | 'yeniModul'  // ← EKLE
  | ...

// 3. adminNavConfig içinde ilgili gruba ekle
export const adminNavConfig: AdminNavConfigGroup[] = [
  {
    id: 2,
    key: 'content',
    items: [
      { key: 'yeniModul', url: '/admin/yeni-modul', icon: FileText },  // ← EKLE
      // ...
    ],
  },
];

// 4. FALLBACK_TITLES'a ekle
const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  yeniModul: 'Yeni Modül',  // ← EKLE
  // ...
};
```

> **Önemli:** `AdminNavItemKey`'e eklenen her key `FALLBACK_TITLES`'a da eklenmek **zorunda** — aksi hâlde TypeScript hatası (`Property '...' is missing in type`) verir.

#### 3. Dil Dosyalarına Ekleme

**tr.json:**
```json
{
  "admin": {
    "yeniModul": {
      "header": {
        "title": "Yeni Modül",
        "description": "Yeni modül açıklaması."
      },
      "tabs": {
        "list": "Liste",
        "settings": "Ayarlar"
      }
    },
    "dashboard": {
      "items": {
        "yeniModul": "Yeni Modül"  // Sidebar için
      }
    }
  }
}
```

**en.json ve de.json'a da ekle!**

#### 4. Stil ve Tema Kuralları

- **Card** komponentini ana container olarak kullan
- **Tabs** çoklu içerik için
- **space-y-4** veya **space-y-6** ile boşluk ver
- **Responsive grid** için: `grid grid-cols-1 lg:grid-cols-2 gap-4`
- **Tema tokenları kullan**: `bg-primary`, `text-muted-foreground`, `border-border`
- **Dark mode uyumlu** olmalı

**İyi Örnek:**
```tsx
<div className="space-y-6">
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {/* İçerik */}
    </CardContent>
  </Card>
</div>
```

**Kötü Örnek (YAPMA):**
```tsx
<div style={{ marginTop: '20px' }}>  {/* inline style KULLANMA */}
  <div className="bg-blue-500">       {/* hardcoded renk KULLANMA */}
    <h1 className="text-white">        {/* tema token kullan! */}
```

---

## 🔧 State Management (Redux)

### Redux Store Yapısı

```
src/stores/
├── index.ts                # Store configuration
├── hooks.ts                # Typed hooks (useAppDispatch, useAppSelector)
├── preferencesSlice.ts     # Tema ve tercihler
└── ...
```

### Preferences State

```ts
interface PreferencesState {
  themeMode: 'light' | 'dark';
  themePreset: 'default' | 'brutalist' | 'soft-pop' | 'tangerine';
  font: FontKey;
  contentLayout: 'centered' | 'full-width';
  navbarStyle: 'sticky' | 'scroll';
  sidebarVariant: 'sidebar' | 'inset' | 'floating';
  sidebarCollapsible: 'icon' | 'offcanvas';
  isSynced: boolean;
}
```

### Kullanım

```tsx
import { useAppSelector, useAppDispatch } from '@/stores/hooks';
import { preferencesActions } from '@/stores/preferencesSlice';

function ThemeToggle() {
  const mode = useAppSelector((s) => s.preferences.themeMode);
  const dispatch = useAppDispatch();

  const toggle = () => {
    dispatch(preferencesActions.setThemeMode(
      mode === 'light' ? 'dark' : 'light'
    ));
  };

  return <Button onClick={toggle}>{mode}</Button>;
}
```

---

## 📡 API Entegrasyonu (RTK Query)

### Hooks Kullanımı

```tsx
import {
  useListChatThreadsAdminQuery,
  usePostChatMessageAdminMutation,
} from '@/integrations/hooks';

function ChatPanel() {
  // Query (GET)
  const { data, isLoading, refetch } = useListChatThreadsAdminQuery(
    { limit: 50 },
    { pollingInterval: 15000 }  // 15sn otomatik yenileme
  );

  // Mutation (POST/PUT/DELETE)
  const [postMsg, { isLoading: sending }] = usePostChatMessageAdminMutation();

  const handleSend = async () => {
    try {
      await postMsg({
        threadId: 'xxx',
        body: { text: 'Merhaba' }
      }).unwrap();
      toast.success('Gönderildi');
    } catch {
      toast.error('Hata!');
    }
  };

  return (
    <div>
      {isLoading ? <Spinner /> : <div>{data?.items.length} thread</div>}
      <Button onClick={handleSend} disabled={sending}>Gönder</Button>
    </div>
  );
}
```

---

## 🚀 Komutlar

```bash
# Development
npm run dev          # Dev server (http://localhost:3000)
bun dev              # Bun ile dev server

# Build
npm run build        # Production build
npm run start        # Production server

# Linting & Formatting
npm run lint         # Biome lint
npm run format       # Biome format
npm run check        # Biome check (lint + format)
npm run check:fix    # Auto-fix

# Theme Presets
npm run generate:presets  # Tema preset dosyalarını güncelle
```

---

## ✅ Yeni Modül Eklerken Dikkat Edilecekler

### 1. Stil Kuralları

- ✅ **Tema tokenlarını kullan** (`bg-primary`, `text-foreground`)
- ✅ **Dark mode uyumlu** olmalı
- ✅ **Responsive tasarım** (`grid-cols-1 lg:grid-cols-2`)
- ✅ **Tailwind utility classes** (inline style YOK)
- ✅ **CVA ile variant sistemi** (button, badge vb. için)
- ❌ **Hardcoded renkler** kullanma (`bg-blue-500` → `bg-primary`)
- ❌ **Inline style** kullanma (`style={{ ... }}`)
- ❌ **px/rem değerleri** direkt yazma (Tailwind spacing kullan)

### 2. Komponent Yapısı

- ✅ **Shadcn UI komponentlerini kullan** (`Button`, `Card`, `Tabs`)
- ✅ **Lucide React icons** kullan
- ✅ **TypeScript** tip güvenliği
- ✅ **'use client'** directive (client component ise)
- ✅ **data-slot** attribute ekle
- ❌ **HTML elemanları direkt kullanma** (`<button>` → `<Button>`)
- ❌ **Font Awesome, Material Icons** vb. kullanma

### 3. Dil Desteği

- ✅ **useAdminT** hook kullan
- ✅ **Tüm dillere ekle** (tr, en, de)
- ✅ **Nested key yapısı** (`admin.moduleName.section.key`)
- ✅ **Sidebar için `admin.dashboard.items.modulKey`** ekle
- ❌ **Hardcoded metin** yazma
- ❌ **Tek dile ekleme** (hepsi olmalı)

### 4. Sidebar ve Routing

- ✅ **sidebar-items.ts** içine ekle
- ✅ **AdminNavItemKey** type'a ekle
- ✅ **FALLBACK_TITLES** ekle
- ✅ **Route: `/admin/modul-adi`** formatı kullan
- ❌ **URL'de Türkçe karakter** kullanma

### 5. State ve API

- ✅ **RTK Query hooks** kullan
- ✅ **useAppSelector, useAppDispatch** kullan
- ✅ **Toast bildirimler** göster (sonner)
- ✅ **Loading states** kontrol et
- ❌ **Axios direkt** kullanma (RTK Query var)
- ❌ **useState ile API data** saklama (RTK Query cache kullan)

### 6. Form Yönetimi

- ✅ **React Hook Form** kullan
- ✅ **Zod validation** ekle
- ✅ **Form komponenti** (`src/components/ui/form.tsx`)
- ✅ **Field komponenti** (`src/components/ui/field.tsx`)
- ❌ **Native form validation** kullanma
- ❌ **Uncontrolled inputs** kullanma

### 7. Select / SelectItem Kuralı

Radix UI `<Select>` bileşeninde `<SelectItem value="">` **kesinlikle kullanma** — empty string value runtime hatası verir:

> _"A `<Select.Item />` must have a value prop that is not an empty string."_

**Doğru kalıp (sentinel value):**
```tsx
// State: '' = filtre yok
const [typeFilter, setTypeFilter] = React.useState('');

<Select
  value={typeFilter || 'all'}
  onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}
>
  <SelectContent>
    <SelectItem value="all">Tüm Tipler</SelectItem>  {/* ✅ 'all' kullan */}
    {TYPES.map((t) => (
      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

- ✅ "Tümü" seçeneği için `value="all"` veya başka anlamlı bir string kullan
- ❌ `value=""` KULLANMA — runtime hatası verir

### 8. Dil Dosyaları (Locale)

Her yeni modül için `src/locale/tr.json`, `en.json`, `de.json` dosyalarına `admin.<modülKey>` anahtarı eklenmelidir. Minimum yapı:

```json
{
  "admin": {
    "yeniModul": {
      "header": {
        "title": "Modül Başlığı",
        "description": "Modül açıklaması."
      },
      "filters": {
        "search": "Ara..."
      },
      "actions": {
        "create": "Yeni Ekle",
        "edit": "Düzenle",
        "save": "Kaydet",
        "cancel": "İptal"
      }
    }
  }
}
```

> **Kural:** `useAdminT('admin.yeniModul')` ile bağlanır. `t('header.title')` → `admin.yeniModul.header.title`.

---

## 📄 Detail Page Standartı (i18n Destekli Modüller)

Dil desteği (`locale`) olan her modülün detail/form sayfası bu kalıbı izler.

### Klasör Yapısı

```
src/app/(main)/admin/(admin)/modul-adi/
├── page.tsx                          # Route: /admin/modul-adi
├── [id]/
│   └── page.tsx                      # Route: /admin/modul-adi/[id]
├── _components/
│   └── modul-detail-client.tsx       # Ana form + JSON tab bileşeni
└── modul-list.tsx                    # Liste sayfası
```

### Zorunlu Tab Yapısı

Her detail sayfasında **iki tab** bulunur:

| Tab | İçerik |
|-----|--------|
| `form` | Standart form alanları + görsel (sidebar) |
| `json` | Tüm `formData` JSON olarak + görsel (sidebar) |

> **Kural:** Modül `locale` (dil) alanı içeriyorsa JSON tab **zorunludur**.

### Detail Client Bileşen Şablonu

```tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileJson } from 'lucide-react';
import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { toast } from 'sonner';

export default function ModulDetailClient({ id }: { id: string }) {
  const t = useAdminT('admin.modul');
  const router = useRouter();
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const isNew = id === 'new';
  const { localeOptions } = useAdminLocales();

  const [activeLocale, setActiveLocale] = React.useState(adminLocale || 'tr');
  const [activeTab, setActiveTab] = React.useState<'form' | 'json'>('form');

  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    locale: activeLocale,
    image_url: '',
    is_active: true,
    // ... modüle özgü alanlar
  });

  // RTK Query veri yüklenince formData'yı doldur
  // const { data } = useGetModulAdminQuery({ id, locale: activeLocale }, { skip: isNew });
  // React.useEffect(() => { if (data) setFormData({ ... }); }, [data]);

  // Form tab ve JSON tab için ortak handler'lar
  const handleChange = (field: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // JSON tab: tüm formData'yı günceller
  const handleJsonChange = (json: Record<string, any>) =>
    setFormData((prev) => ({ ...prev, ...json }));

  // Görsel upload (hem form hem JSON tab sidebar'ında kullanılır)
  const handleImageChange = (url: string) =>
    setFormData((prev) => ({ ...prev, image_url: url }));

  const isLoading = false; // isFetching || isCreating || isUpdating

  return (
    <div className="space-y-6">
      {/* Header + Locale Switcher */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base">
                {isNew ? t('actions.create') : t('actions.edit')}
              </CardTitle>
            </div>
            <AdminLocaleSelect
              options={localeOptions}
              value={activeLocale}
              onChange={(l) => { setActiveLocale(l); setFormData((p) => ({ ...p, locale: l })); }}
              disabled={isLoading}
            />
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'form' | 'json')}>
        <TabsList>
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="json">
            <FileJson className="h-4 w-4 mr-2" />
            JSON
          </TabsTrigger>
        </TabsList>

        {/* ── Form Tab ──────────────────────────────────────── */}
        <TabsContent value="form">
          <form onSubmit={(e) => { e.preventDefault(); /* handleSubmit */ }}>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sol: form alanları */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* ... Input, Select, Switch alanları ... */}
                  </div>

                  {/* Sağ: görsel — modülde resim varsa */}
                  <div className="space-y-6">
                    <AdminImageUploadField
                      label="Görsel"
                      value={formData.image_url}
                      onChange={handleImageChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {t('actions.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ── JSON Tab ──────────────────────────────────────── */}
        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Veri (JSON)</CardTitle>
              <CardDescription>Tüm alanları JSON olarak düzenleyebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol: tüm formData JSON editörde */}
                <div className="lg:col-span-2">
                  <AdminJsonEditor
                    value={formData}
                    onChange={handleJsonChange}
                    disabled={isLoading}
                    height={500}
                  />
                </div>

                {/* Sağ: görsel önizleme/yükleme — modülde resim varsa */}
                <div className="space-y-4">
                  <AdminImageUploadField
                    label="Görsel"
                    value={formData.image_url}
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  {t('actions.cancel')}
                </Button>
                <Button onClick={(e) => { /* handleSubmit */ }} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('actions.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Ortak Bileşenler

| Bileşen | Prop Adları | Açıklama |
|---------|-------------|----------|
| `AdminJsonEditor` | `value`, `onChange`, `height` (number), `disabled` | `value={formData}` — tüm form state'i |
| `AdminImageUploadField` | `value` (url string), `onChange(url)`, `disabled` | `currentUrl`/`onImageChange` KULLANMA |
| `AdminLocaleSelect` | `options`, `value`, `onChange`, `disabled` | Locale geçişi |

### Kurallar

- ✅ JSON tab'ında `value={formData}` (tüm data — sadece i18n_data değil)
- ✅ `handleJsonChange`: `setFormData(prev => ({ ...prev, ...json }))`
- ✅ `handleImageChange(url: string)` — sadece url alır, assetId almaz
- ✅ `AdminImageUploadField` her iki tab'da (form + json) sidebar'da gösterilir
- ✅ Locale switcher header'da, her değişimde `refetch()` tetiklenir
- ❌ `AdminJsonEditor`'a `height="500px"` (string) verme — `height={500}` (number) kullan
- ❌ `AdminImageUploadField`'a `currentUrl`, `currentAssetId`, `onImageChange` verme (eski prop'lar)

---

## 📝 Örnek Modül: Chat

Chat modülü, standartlara uygun örnek bir modüldür:

```
src/app/(main)/admin/(admin)/chat/
├── page.tsx                          # Route entry
├── Chat.tsx                          # Main component (Tabs)
└── components/
    ├── ChatThreadsPanel.tsx          # Thread list + messages
    ├── ChatKnowledgePanel.tsx        # Knowledge base
    └── ChatSettingsPanel.tsx         # AI settings
```

**Özellikleri:**
- ✅ Card layout
- ✅ Tabs yapısı
- ✅ RTK Query hooks (polling ile)
- ✅ Toast notifications
- ✅ i18n desteği (useAdminT)
- ✅ Dark mode uyumlu
- ✅ Responsive grid
- ✅ Shadcn UI komponentleri

---

## 🎯 Özet

1. **Stil sistemi dinamik** - CSS değişkenleri ve tema presetleri
2. **Ensotek marka renkleri** - `--logo-coral` serisi kullan
3. **Shadcn/UI komponentleri** - Radix UI + CVA
4. **i18n zorunlu** - tr, en, de
5. **RTK Query** - API için
6. **Redux Toolkit** - State için
7. **TypeScript** - Tip güvenliği
8. **Biome** - Linting ve formatting

---

## 🔗 Önemli Dosya Referansları

| Amaç | Dosya |
|------|-------|
| Tema tokenları | `src/app/globals.css` |
| Tema presetleri | `src/styles/presets/*.css` |
| Tema sabitleri | `src/lib/preferences/theme.ts` |
| Layout sabitleri | `src/lib/preferences/layout.ts` |
| Sidebar items | `src/navigation/sidebar/sidebar-items.ts` |
| UI komponentleri | `src/components/ui/*.tsx` |
| Dil dosyaları | `src/locale/*.json` |
| Redux store | `src/stores/index.ts` |
| Preferences | `src/stores/preferencesSlice.ts` |
| Boot script | `src/scripts/theme-boot.tsx` |

---

**Son Güncelleme:** 2026-02-17
**Proje Versiyonu:** 2.3.0
**Tech Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + Redux Toolkit
