## Frontend Design System (KÖNIG ENERGETIK)

Bu doküman, `frontend/src/app/globals.css` içinde tanımlı Tailwind v4 `@theme` token’larını **tek kaynak** kabul eder. UI tarafında yeni renk/spacing eklemek yerine önce token’ı genişlet, sonra component’lerde semantik sınıfları kullan.

## Aesthetic

- Modern, sakin, premium; “spiritual” dokunuşlar **subtle**
- Neon / sert kontrast / agresif shadow yok
- Bol boşluk (breathing room), yumuşak köşeler, ince border

## Tokens (source of truth)

Dosya: `frontend/src/app/globals.css`

### Palette (primitive)

- `rose-*`: marka tonu
- `sand-*`: sıcak nötrler
- `gold-*`, `lavender-*`: küçük aksanlar

### Semantic colors (use these in UI)

Bu token’lar Tailwind class’larına direkt map edilir:

- Background: `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-accent`, `bg-bg-dark`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-on-dark`
- Brand: `text-brand-primary`, `bg-brand-primary`, `hover:bg-brand-hover`, `bg-brand-light`
- Border: `border-border-light`, `border-border-medium`

### Typography

- Başlıklar: `font-serif`
- Gövde: `font-sans`
- Script font kullanılacaksa: `globals.css` içinde `--font-script` ekle ve `.font-script` utility’sini gerçek font ile bağla.

### Shadows

Global utilities:

- `shadow-soft`
- `shadow-medium`
- `shadow-glow` (çok az kullan)

## Component patterns

### Buttons

- Primary: `bg-brand-primary text-text-on-dark hover:bg-brand-hover`
- Secondary: `bg-bg-secondary text-text-primary border border-border-light hover:bg-bg-accent`
- Tertiary (link): `text-brand-primary hover:text-brand-hover underline-offset-4 hover:underline`

### Cards / Panels

Standart panel:

- `bg-bg-secondary border border-border-light rounded-2xl shadow-soft`

İç içerik:

- Body: `text-text-secondary`
- Muted: `text-text-muted`

### Layout & spacing

- Outer grid: `grid gap-6 lg:grid-cols-12`
- Sidebar: `lg:col-span-4`
- Main: `lg:col-span-8`
- Container: Tailwind `container` utility (projede custom `@utility container` var)

## Extending tokens (when needed)

Yeni semantik ihtiyaçlarda primitive ekleme yerine semantik ekle:

- Örn: `--color-surface-raised`, `--color-border-focus`, `--color-state-success`

Sonra UI’da `bg-surface-raised`, `border-border-focus` gibi semantik class’ları kullan.
