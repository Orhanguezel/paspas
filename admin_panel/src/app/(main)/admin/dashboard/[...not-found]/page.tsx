"use client";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";

export default function DashboardNotFound() {
  const t = useAdminT();

  return (
    <div className="flex h-[calc(100dvh-120px)] flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">{t('notFound.title', {}, 'Page not found.')}</h1>
      <p className="text-muted-foreground">
        {t('notFound.description', {}, 'The page you are looking for could not be found or has been moved.')}
      </p>
    </div>
  );
}
