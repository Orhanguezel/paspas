"use client";

import { Brain, GitBranch, RotateCcw, ScanSearch } from "lucide-react";

const FELSEFELER = [
  {
    no: "01",
    baslik: "Veri-Önce, AI-Yardımcı",
    aciklama:
      "Her tahmin önce istatistiksel yöntemle yapılır (lineer regresyon, Prophet, XGBoost). AI yanına gelir, açıklar, öneri verir — yerine geçmez. Sayılar konuşur, AI tercüme eder.",
    icon: Brain,
    color: "from-blue-500 to-indigo-600",
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    no: "02",
    baslik: "Kademeli Karmaşıklık",
    aciklama:
      "Veri 3 ay → naive model. 6 ay → mevsimsel. 12 ay → Prophet. 24 ay → XGBoost. Verinin yetmediği yerde gelişmiş model kullanılmaz, hata üretir.",
    icon: GitBranch,
    color: "from-emerald-500 to-teal-600",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  {
    no: "03",
    baslik: "Açıklanabilirlik",
    aciklama:
      "Her AI tahmin 'neden böyle?' sorusuna cevap verir. SHAP değerleri + sinyal listesi + doğal dil açıklama. Yönetici '240 dedin neden?' sorduğunda anlamlı 3 cümle alır.",
    icon: ScanSearch,
    color: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
    border: "border-violet-200 dark:border-violet-800",
  },
  {
    no: "04",
    baslik: "Geri Alınabilirlik",
    aciklama:
      "Her AI aksiyon risk skoruyla etiketlenir. Yüksek risk → manuel onay. Düşük risk → otomatik ama audit log + rollback hazır. Tedarikçi maili, sipariş onayı asla otomatik değil.",
    icon: RotateCcw,
    color: "from-rose-500 to-pink-600",
    bgGradient: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30",
    border: "border-rose-200 dark:border-rose-800",
  },
];

export default function FelsefeBolumu() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-bold text-2xl text-foreground lg:text-3xl">4 Temel Felsefe</h2>
        <p className="mt-1 text-muted-foreground">
          Tüm projeyi yönlendiren ilkeler. Mimariyi, eşikleri, kullanıcı deneyimini şekillendirir.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FELSEFELER.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.no}
              className={`relative overflow-hidden rounded-xl border ${f.border} bg-gradient-to-br ${f.bgGradient} p-6 transition hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl text-muted-foreground/50 leading-none">
                      {f.no}
                    </span>
                    <h3 className="font-bold text-foreground text-lg">{f.baslik}</h3>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.aciklama}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
