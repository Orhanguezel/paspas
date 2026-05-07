import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">Sayfa bulunamadı.</h1>
      <p className="text-muted-foreground">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link prefetch={false} replace href="/admin/dashboard">
        <Button variant="outline">Ana sayfaya dön</Button>
      </Link>
    </div>
  );
}
