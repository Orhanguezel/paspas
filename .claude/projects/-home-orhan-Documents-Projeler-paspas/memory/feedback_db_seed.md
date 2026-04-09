---
name: DB değişiklikleri seed ile yapılmalı
description: Veritabanı düzeltmeleri ALTER/migration ile değil, her zaman seed dosyaları üzerinden yapılmalı. bun run db:seed ile sıfırdan oluşturulur.
type: feedback
---
- Kullanıcı her zaman `bun run db:seed` ile veritabanını sıfırdan oluşturmak istiyor
- Veriler sahte/test verisi, kaybedilmesi önemli değil
- ALTER, migration veya runtime düzeltme scriptleri YAZMA
- Tüm değişiklikler seed SQL dosyalarında olmalı
- Seed dosyaları ileride gerçek veri yapısının temelini oluşturacak

canlida artik, veriler gercek. canlida `bun run db:seed` yapmiyoruz.
