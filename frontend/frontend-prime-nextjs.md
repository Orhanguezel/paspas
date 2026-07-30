---
name: frontend-prime-nextjs
description: >
  Production-grade Next.js + TypeScript + Zustand frontend skill.
  Opinionated, battle-tested patterns for scalable e-commerce apps.
  No generic AI output — only intentional, crafted interfaces.
---

# Next.js Frontend Mastery Skill

Her çıktı kasıtlı olarak tasarlanmış olmalı — asla generic, asla "AI slop."

---

## 0. Proje Yapı Standartları

### Module Pattern (Katı Kural)
Her feature için şu 3 dosya **zorunlu**:

```
src/modules/{feature}/
  {feature}.schema.ts   # Zod validation schemas
  {feature}.service.ts  # API calls, business logic
  {feature}.type.ts     # TypeScript types & interfaces
  
  # Optional (gerekirse):
  {feature}.store.ts    # Zustand store
  components/           # Feature-specific components
  hooks/                # Feature-specific hooks
```

**Örnek (auth modülü):**
```typescript
// auth.type.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli email giriniz'),
  password: z.string().min(8, 'En az 8 karakter'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'En az 2 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;

// auth.service.ts
import type { LoginRequest, AuthResponse } from './auth.type';
import { API_ENDPOINTS } from '@/endpoints/api-endpoints';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  },
  
  // Diğer auth methods...
};
```

### Config Standartları

```typescript
// config/routes.ts (ABSOLUTE PATHS - no magic strings)
export const ROUTES = {
  home: '/',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
  },
  dashboard: '/dashboard',
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    category: (slug: string) => `/products/category/${slug}`,
  },
  cart: '/cart',
  checkout: '/checkout',
} as const;

// endpoints/api-endpoints.ts (API URLs)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE}/auth/login`,
    register: `${API_BASE}/auth/register`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
  },
  products: {
    list: `${API_BASE}/products`,
    detail: (id: string) => `${API_BASE}/products/${id}`,
    search: `${API_BASE}/products/search`,
  },
  cart: {
    get: `${API_BASE}/cart`,
    add: `${API_BASE}/cart/items`,
    update: (itemId: string) => `${API_BASE}/cart/items/${itemId}`,
    remove: (itemId: string) => `${API_BASE}/cart/items/${itemId}`,
  },
} as const;
```

---

## 1. Design Before Code

Kod yazmadan önce **mutlaka** belirle:

### A. Aesthetic Direction (Tek seç, commit ol)
E-ticaret için en uygun olanlar:
- **Modern Minimal** — Clean, lots of whitespace, subtle shadows
- **Bold Editorial** — Large typography, asymmetric grids, magazine feel
- **Luxury/Premium** — Sophisticated, muted colors, serif fonts
- **Playful/Friendly** — Rounded corners, bright accents, approachable
- **Dark/Moody** — High contrast, dramatic, focus on products

### B. Color Strategy
AI'ların yaptığı hata: Her rengi eşit kullanmak. Doğrusu:

**80-10-10 Kuralı:**
- 80% Neutral (bg, text)
- 10% Primary (brand, CTA)
- 10% Accent (hover, highlights)

```css
/* YANLIŞ (Generic AI) */
--color-1: #3b82f6;
--color-2: #8b5cf6;
--color-3: #ec4899;
--color-4: #14b8a6;

/* DOĞRU (Intentional) */
--neutral-50: #fafafa;
--neutral-900: #18181b;
--primary-500: #2563eb;  /* Dominant brand color */
--accent-500: #f59e0b;   /* Sadece önemli CTAs */
```

### C. Typography Scale
```css
/* Sistem: Major Third (1.25) veya Perfect Fourth (1.333) */
--text-xs: 0.75rem;    /* 12px - labels */
--text-sm: 0.875rem;   /* 14px - secondary */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.25rem;    /* 20px - lead */
--text-xl: 1.5rem;     /* 24px - h3 */
--text-2xl: 2rem;      /* 32px - h2 */
--text-3xl: 2.5rem;    /* 40px - h1 */
--text-4xl: 3.5rem;    /* 56px - hero */
```

### D. Unforgettable Element (Her sayfada 1 tane)
- Smooth scroll parallax on hero
- Magnetic button hover effect
- Custom cursor on product grid
- Reveal animation on scroll
- Staggered card entrance
- Morphing shapes background

---

## 2. AI Slop Blacklist — ASLA YAPMA

**Instantly marks as AI-generated:**
- ❌ Purple/blue gradient backgrounds
- ❌ Every card with `rounded-xl` (16px)
- ❌ `text-gray-600` everywhere
- ❌ Perfect 3-column grid, all cards same height
- ❌ Evenly distributed rainbow colors
- ❌ Generic hero with centered text + illustration
- ❌ Every section with `py-20` exactly
- ❌ Buttons all same size/style
- ❌ No visual hierarchy

**Instead:**
- ✅ Load distinctive Google Fonts:
  - **Headings:** Instrument Serif, Fraunces, Clash Display, Syne
  - **Body:** DM Sans, Satoshi, Cabinet Grotesk, Inter
  - **Monospace:** JetBrains Mono, Fira Code
  
- ✅ Asymmetric layouts, grid-breaking elements
- ✅ Dramatic scale jumps (hero 4xl → body sm)
- ✅ Negative `letter-spacing: -0.02em` on headings
- ✅ `text-wrap: balance` on headlines
- ✅ Body text: `max-width: 65ch`, `line-height: 1.6`
- ✅ Generous negative space (design with emptiness)
- ✅ Varied button sizes (primary large, secondary small)

---

## 3. TypeScript — No Compromises

### A. Strict Mode Always
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### B. Type Everything
```typescript
// ❌ BAD
const handleSubmit = (e: any) => {
  const data = e.target.value;
}

// ✅ GOOD
import type { FormEvent } from 'react';

const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const email = formData.get('email') as string;
}
```

### C. Generic Components
```typescript
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

export function Select<T>({ 
  options, 
  value, 
  onChange, 
  getLabel, 
  getValue 
}: SelectProps<T>) {
  // Fully typed, reusable
}

// Usage
<Select
  options={products}
  value={selectedProduct}
  onChange={setSelectedProduct}
  getLabel={(p) => p.name}
  getValue={(p) => p.id}
/>
```

### D. Discriminated Unions for State
```typescript
// ❌ BAD
interface State {
  loading: boolean;
  error: string | null;
  data: Product[] | null;
}

// ✅ GOOD
type ProductState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: Product[] };

// TypeScript forces you to handle all cases
function ProductList({ state }: { state: ProductState }) {
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') return <Error message={state.error} />;
  if (state.status === 'success') return <List items={state.data} />;
  return null;
}
```

### E. Utility Types
```typescript
// Extract routes type from config
type Routes = typeof ROUTES;
type AuthRoutes = Routes['auth'];

// Make all properties optional
type PartialProduct = Partial<Product>;

// Pick specific properties
type ProductPreview = Pick<Product, 'id' | 'name' | 'price' | 'image'>;

// Omit properties
type ProductWithoutDates = Omit<Product, 'createdAt' | 'updatedAt'>;

// Extract return type from function
type LoginResult = Awaited<ReturnType<typeof authService.login>>;
```

---

## 4. Zustand State Management

### A. Store Pattern
```typescript
// modules/cart/cart.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from './cart.type';

interface CartStore {
  // State
  items: CartItem[];
  isOpen: boolean;
  
  // Computed (derived state)
  total: number;
  itemCount: number;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      
      // Computed values as getters
      get total() {
        return get().items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
      },
      
      get itemCount() {
        return get().items.reduce((sum, item) => 
          sum + item.quantity, 0
        );
      },
      
      // Actions
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(i => i.id === product.id);
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          
          return {
            items: [...state.items, { ...product, quantity }],
          };
        });
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== productId),
        }));
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'cart-storage', // localStorage key
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);

// Selectors (for performance)
export const selectCartTotal = (state: CartStore) => state.total;
export const selectItemCount = (state: CartStore) => state.itemCount;
```

### B. Store Organization Rules
1. **One store per domain** (auth, cart, products, filters)
2. **Actions co-located with state** (not separate files)
3. **Selectors for computed values** (avoid re-renders)
4. **Persist only necessary data** (not loading states)
5. **No async in stores** (use services, call from components)

### C. Using Stores in Components
```typescript
'use client';

import { useCartStore, selectCartTotal } from '@/modules/cart/cart.store';

// ❌ BAD - rerenders on any cart change
function BadExample() {
  const cart = useCartStore();
  return <div>{cart.total}</div>;
}

// ✅ GOOD - only rerenders when total changes
function GoodExample() {
  const total = useCartStore(selectCartTotal);
  const addItem = useCartStore(s => s.addItem);
  
  return (
    <div>
      Total: {total}
      <button onClick={() => addItem(product)}>Add</button>
    </div>
  );
}
```

---

## 5. Component Architecture

### A. Compound Components Pattern
```typescript
// components/ui/tabs.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ 
  defaultValue, 
  children 
}: { 
  defaultValue: string; 
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children }: { children: ReactNode }) {
  return <div className="tabs-list" role="tablist">{children}</div>;
}

function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be inside Tabs');
  
  return (
    <button
      role="tab"
      aria-selected={ctx.activeTab === value}
      onClick={() => ctx.setActiveTab(value)}
      className={ctx.activeTab === value ? 'active' : ''}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be inside Tabs');
  
  if (ctx.activeTab !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

// Export as namespace
export { Tabs, TabsList, TabsTrigger, TabsContent };

// Usage
<Tabs defaultValue="description">
  <TabsList>
    <TabsTrigger value="description">Açıklama</TabsTrigger>
    <TabsTrigger value="specs">Özellikler</TabsTrigger>
  </TabsList>
  <TabsContent value="description">...</TabsContent>
  <TabsContent value="specs">...</TabsContent>
</Tabs>
```

### B. Props API Design
```typescript
// Composition over configuration
interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
}

// Not like this (too many boolean props)
interface BadButtonProps {
  text: string;
  isPrimary?: boolean;
  isSecondary?: boolean;
  isGhost?: boolean;
  isSmall?: boolean;
  isLarge?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  hasIcon?: boolean;
  iconPosition?: 'left' | 'right';
}
```

### C. Custom Hooks
```typescript
// hooks/use-intersection-observer.ts
import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
}

// Usage
function ProductCard() {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
  });

  return (
    <div ref={ref}>
      {isIntersecting && <Image src={product.image} />}
    </div>
  );
}
```

---

## 6. Color & Theming System

### A. 3-Layer Token Architecture
```css
/* Layer 1: Raw colors */
:root {
  --slate-50: #f8fafc;
  --slate-900: #0f172a;
  --blue-500: #3b82f6;
  --amber-500: #f59e0b;
}

/* Layer 2: Semantic tokens */
:root {
  --color-bg-primary: var(--slate-50);
  --color-bg-secondary: white;
  --color-text-primary: var(--slate-900);
  --color-text-secondary: var(--slate-600);
  --color-brand: var(--blue-500);
  --color-accent: var(--amber-500);
  --color-border: var(--slate-200);
  --color-error: #ef4444;
  --color-success: #10b981;
}

/* Layer 3: Component tokens */
:root {
  --button-bg: var(--color-brand);
  --button-text: white;
  --input-border: var(--color-border);
  --card-bg: var(--color-bg-secondary);
}

/* Dark mode overrides */
[data-theme="dark"] {
  --color-bg-primary: var(--slate-900);
  --color-bg-secondary: var(--slate-800);
  --color-text-primary: var(--slate-50);
  --color-text-secondary: var(--slate-300);
  --color-border: var(--slate-700);
}
```

### B. Dark Mode Implementation
```typescript
// components/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
      root.dataset.theme = theme;
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
```

### C. Tailwind Config
```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)',
        brand: 'var(--color-brand)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
    },
  },
} satisfies Config;
```

---

## 7. SEO & Metadata (Next.js 14+)

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://yoursite.com'),
  title: {
    default: 'Site Adı',
    template: '%s | Site Adı',
  },
  description: 'Site açıklaması 150-160 karakter',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Site Adı',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@handle',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

// app/products/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  const product = await getProduct(params.id);
  
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image }],
    },
    alternates: {
      canonical: `/products/${params.id}`,
    },
  };
}
```

### JSON-LD Structured Data
```typescript
// components/product-schema.tsx
export function ProductSchema({ product }: { product: Product }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'TRY',
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## 8. Performance & Optimization

### A. Image Optimization
```typescript
import Image from 'next/image';

// ✅ GOOD
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  sizes="(max-width: 768px) 100vw, 400px"
  placeholder="blur"
  blurDataURL={product.blurHash}
  loading="lazy"
  quality={85}
/>

// Blur placeholder generation (server-side)
import { getPlaiceholder } from 'plaiceholder';

export async function getProductWithBlur(id: string) {
  const product = await getProduct(id);
  const { base64 } = await getPlaiceholder(product.image);
  
  return { ...product, blurHash: base64 };
}
```

### B. Code Splitting
```typescript
// ❌ BAD - bundles heavy component on initial load
import HeavyChart from '@/components/heavy-chart';

// ✅ GOOD - lazy load
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  ssr: false, // Client-side only if needed
  loading: () => <ChartSkeleton />,
});
```

### C. Performance Budgets
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
  },
  webpack: (config) => {
    config.performance = {
      maxAssetSize: 200000, // 200KB
      maxEntrypointSize: 200000,
    };
    return config;
  },
};
```

---

## 9. Testing Strategy

### A. Unit Tests (Vitest)
```typescript
// modules/cart/cart.store.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from './cart.store';

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCartStore());
    
    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 100 });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(100);
  });

  it('increments quantity if item exists', () => {
    const { result } = renderHook(() => useCartStore());
    const product = { id: '1', name: 'Product', price: 100 };
    
    act(() => {
      result.current.addItem(product);
      result.current.addItem(product);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });
});
```

### B. Integration Tests (React Testing Library)
```typescript
// components/product-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './product-card';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 100,
  image: '/test.jpg',
};

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('100 TL')).toBeInTheDocument();
  });

  it('adds to cart when button clicked', async () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    fireEvent.click(screen.getByRole('button', { name: /sepete ekle/i }));
    
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### C. E2E Tests (Playwright)
```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  await page.goto('/products');
  
  // Add product to cart
  await page.click('text=Add to Cart');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  
  // Go to checkout
  await page.click('text=Checkout');
  
  // Fill form
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="cardNumber"]', '4242424242424242');
  
  // Submit
  await page.click('text=Complete Order');
  
  // Verify success
  await expect(page).toHaveURL(/\/success/);
});
```

---

## 10. Accessibility

### A. Semantic HTML
```typescript
// ❌ BAD
<div onClick={handleClick}>Click me</div>

// ✅ GOOD
<button onClick={handleClick}>Click me</button>

// ❌ BAD
<div className="link" onClick={navigate}>Go to page</div>

// ✅ GOOD
<Link href="/page">Go to page</Link>
```

### B. ARIA Labels
```typescript
<button
  aria-label="Sepete ekle"
  aria-pressed={isInCart}
  aria-describedby="product-name"
>
  <PlusIcon aria-hidden="true" />
</button>

<input
  type="search"
  aria-label="Ürün ara"
  placeholder="Ürün ara..."
/>

<nav aria-label="Ana navigasyon">
  <ul>...</ul>
</nav>
```

### C. Keyboard Navigation
```typescript
function Modal({ isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus trap
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements?.[0] as HTMLElement;
    firstElement?.focus();

    // Close on Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      ...
    </div>
  );
}
```

---

## 11. Forms & Validation

```typescript
// components/login-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginForm } from '@/modules/auth/auth.schema';
import { authService } from '@/modules/auth/auth.service';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await authService.login(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Şifre</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <span role="alert">{errors.password.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  );
}
```

---

## 12. Error Handling

### A. Error Boundaries
```typescript
// components/error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert">
          <h2>Bir hata oluştu</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### B. Toast Notifications
```typescript
// components/toast.tsx
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          error: 'bg-red-500 text-white',
          success: 'bg-green-500 text-white',
          warning: 'bg-yellow-500 text-white',
        },
      }}
    />
  );
}

// Usage
import { toast } from 'sonner';

toast.success('Ürün sepete eklendi');
toast.error('Bir hata oluştu');
toast.loading('Yükleniyor...');
```

---

## 13. Animation & Motion

### A. Framer Motion Patterns
```typescript
import { motion, AnimatePresence } from 'framer-motion';

// Stagger children
<motion.ul
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }}
>
  {products.map((product) => (
    <motion.li
      key={product.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <ProductCard product={product} />
    </motion.li>
  ))}
</motion.ul>

// Exit animations
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Modal />
    </motion.div>
  )}
</AnimatePresence>
```

### B. CSS Animations (Prefer for Simple Cases)
```css
/* Better performance than JS animations */
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 14. Security Checklist

- ✅ CSP headers configured
- ✅ No `dangerouslySetInnerHTML` without sanitization (use DOMPurify)
- ✅ Validate user inputs server-side (Zod schemas)
- ✅ HttpOnly cookies for auth tokens
- ✅ CSRF protection
- ✅ Rate limiting on API routes
- ✅ Validate URLs in `href` attributes
- ✅ `rel="noopener noreferrer"` on external links
- ✅ Content-Security-Policy headers
- ✅ Environment variables never exposed to client

---

## 15. Quick Reference

### File Naming
- Components: `PascalCase.tsx` (ProductCard.tsx)
- Utilities: `kebab-case.ts` (format-currency.ts)
- Stores: `feature.store.ts` (cart.store.ts)
- Types: `feature.type.ts` (product.type.ts)
- Schemas: `feature.schema.ts` (auth.schema.ts)
- Services: `feature.service.ts` (api.service.ts)

### Import Order
```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. External libraries
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 3. Internal - Types
import type { Product } from '@/modules/product/product.type';

// 4. Internal - Stores
import { useCartStore } from '@/modules/cart/cart.store';

// 5. Internal - Components
import { Button } from '@/components/ui/button';

// 6. Internal - Utils
import { formatCurrency } from '@/lib/format';

// 7. Styles (if any)
import styles from './component.module.css';
```

### Code Style
- **Max line length:** 100 characters
- **Indentation:** 2 spaces
- **Quotes:** Single for JS/TS, double for JSX attributes
- **Semicolons:** Always
- **Trailing commas:** Always (multi-line)
- **Arrow functions:** Always for components and callbacks
- **Const over let:** Always (use const by default)

---

## Final Checklist Before Shipping

- [ ] All forms validated with Zod
- [ ] Loading states for async operations
- [ ] Error boundaries around major sections
- [ ] Toast notifications for user feedback
- [ ] Responsive tested (mobile, tablet, desktop)
- [ ] Dark mode tested
- [ ] Keyboard navigation works
- [ ] Screen reader tested (basic)
- [ ] Images optimized (next/image)
- [ ] Metadata complete (title, description, OG)
- [ ] No console errors or warnings
- [ ] Lighthouse score >90 (Performance, A11y, Best Practices, SEO)
