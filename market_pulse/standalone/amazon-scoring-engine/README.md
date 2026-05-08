# Amazon Scoring Engine Standalone

Bu paket, MarketPulse içindeki Amazon ticari karar motorunun bağımsız teslim kopyasıdır.

## İçerik

- `src/modules/lead-machine/amazon`: scoring engine, scraper, Keepa, job runner, scorer testleri
- `src/modules/lead-machine/_shared/db.ts`: `lead_search_jobs` ve `lead_candidates` uyumluluk katmanı
- `src/db/client.ts`: minimal MySQL pool adapteri
- `src/core/env.ts`: standalone env loader
- `src/db/seed/sql/021_amazon_scoring_schema.sql`: Amazon scoring tabloları

## Kurulum

```bash
bun install
cp .env.example .env
```

`.env` içinde MySQL, Oxylabs ve opsiyonel Keepa bilgilerini doldurun.

## Build

```bash
bun run build
```

## Kullanım

```ts
import { runAmazonJob } from './src';

await runAmazonJob('lead_search_jobs.id');
```

CLI ile tek komut çalıştırma:

```bash
bun run start -- <jobId>
```

`runAmazonJob` mevcut sistemle uyumluluk için `lead_search_jobs` kaydını okur ve sonuçları şu tablolara yazar:

- `amazon_scan_jobs`
- `amazon_products`
- `amazon_category_stats`
- `amazon_risk_scores`
- `amazon_job_error_logs`
- `amazon_keepa_queue`
- `amazon_keepa_snapshots`
- `lead_candidates`

Sadece standalone `amazon_scan_jobs` kaydı oluşturmak isteyen entegrasyonlar için `src/db/job-store.ts` helper'ları export edilir:

```ts
import { createJob, markJobRunning, markJobDone, markJobFailed } from './src';
```

## Bağımlılık Notu

Bu standalone paket, MarketPulse dışındaki projeye alınırken iki tabloyu da bekler:

- `lead_search_jobs`
- `lead_candidates`

Bu tablolar hedef projede yoksa `src/modules/lead-machine/_shared/db.ts` içindeki uyumluluk fonksiyonları hedef job/candidate modeline göre değiştirilmelidir.

## Config

Scoring ağırlıkları ve eşikler:

```txt
src/modules/lead-machine/amazon/scoring.config.ts
```

Değişiklikten sonra ana repoda Amazon testleri çalıştırılmalıdır:

```bash
cd backend
bun test src/modules/lead-machine/amazon/__tests__
```

## Keepa

Keepa opsiyoneldir. `KEEPA_API_KEY` boşsa job çalışır ama Keepa queue/snapshot adımı atlanır.

```env
KEEPA_API_KEY=...
KEEPA_DAILY_TOKEN_BUDGET=1000
```

## Handover

Claude Code tarafından hazırlanacak `docs/standalone-scope.md` sonrası `_shared/db.ts` hedef müşterinin DB/job modeline göre netleştirilmelidir. Bu paket şu an MarketPulse uyumlu standalone sınırını hazırlar.
