import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FuarSectionPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
};

export function FuarSectionPage({ title, description, icon: Icon, items }: FuarSectionPageProps) {
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex items-start gap-3">
        <div className="rounded-lg border bg-muted p-2">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
            <Badge variant="outline">Fuar Teklif</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Geliştirme kapsamı</CardTitle>
          <CardDescription>Bu ekran bağımsız Fuar veri modeli ve servisleriyle çalışacaktır.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="rounded-lg border bg-card p-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
