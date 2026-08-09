# Paspas Fuar Teklif

Paspas ERP görev havuzundan yönetilen, fakat kendi servis ve veritabanına sahip
bağımsız Fuar Teklif uygulamasının backend başlangıcıdır.

İlk paket tek hesaplama kaynağını kurar: takım/koli/palet dönüşümü, MOQ, CBM,
net-brüt ağırlık, müşteri ve ek indirim, EXW/FOB/CIF toplamları. Ekran, PDF,
Excel, proforma ve çeki listesi ilerleyen paketlerde bu motoru kullanacaktır.

```bash
bun install
bun test
bun run typecheck
bun run dev
```

API önizleme uç noktası: `POST /api/v1/calculations/preview`.
