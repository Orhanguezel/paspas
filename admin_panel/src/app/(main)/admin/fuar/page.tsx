import { Calculator, FileStack, PackageCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  { title: "Ürünler", description: "Birim dönüşümleri, MOQ, koli ve palet bilgileri", icon: PackageCheck },
  { title: "Müşteriler", description: "Firma, teslimat ve varsayılan indirim bilgileri", icon: Users },
  { title: "Hesaplama Motoru", description: "CBM, ağırlık, EXW/FOB/CIF ve indirim hesapları", icon: Calculator },
  { title: "Teklif ve Revizyon", description: "Değiştirilemez R1/R2 snapshot kayıtları", icon: FileStack },
];

export default function FuarPage() {
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-2xl tracking-tight">Fuar Teklif</h1>
          <Badge>Bağımsız Modül</Badge>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Fuar ürünleri, müşterileri ve teklifleri mevcut ERP ve Teklif Modülü kayıtlarından ayrı yönetilir.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map(({ title, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="size-5" aria-hidden="true" />
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Geliştiriliyor</Badge>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
