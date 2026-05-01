"use client";

import { useState } from "react";
import {
  AlertOctagon,
  Bot,
  Clock3,
  ExternalLink,
  FileWarning,
  History,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useListTestCenterRunAnalysesQuery,
  useTriggerTestCenterRunAnalysisMutation,
} from "@/integrations/endpoints/admin/test_center.endpoints";
import type {
  TestCenterRunAnalysis,
  TestCenterRunAnalysisSeverity,
} from "@/integrations/shared";

type Props = {
  runId: string;
  runTitle: string;
};

const severityTone: Record<string, { color: string; label: string }> = {
  high: { color: "bg-destructive/10 text-destructive border-destructive/30", label: "Yüksek" },
  medium: { color: "bg-amber-500/10 text-amber-700 border-amber-500/30", label: "Orta" },
  low: { color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30", label: "Düşük" },
};

function severityBadge(sev: TestCenterRunAnalysisSeverity) {
  const tone = severityTone[sev] ?? severityTone.low;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-[11px] ${tone.color}`}>
      <AlertOctagon className="size-3" />
      {tone.label}
    </span>
  );
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("tr-TR");
  } catch {
    return value;
  }
}

function AnalysisCard({ analysis }: { analysis: TestCenterRunAnalysis }) {
  const cost = analysis.costUsd != null ? `$${analysis.costUsd.toFixed(4)}` : "—";
  const tokens =
    analysis.tokensInput != null && analysis.tokensOutput != null
      ? `${analysis.tokensInput} → ${analysis.tokensOutput} tk`
      : "—";

  if (analysis.errorMsg) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <FileWarning className="size-4 text-destructive" />
          <span className="font-medium text-destructive text-sm">AI analizi başarısız</span>
        </div>
        <pre className="whitespace-pre-wrap break-words font-mono text-destructive text-xs">
          {analysis.errorMsg}
        </pre>
        <p className="text-[11px] text-muted-foreground">
          Provider: {analysis.provider} · Model: {analysis.model} · {formatDate(analysis.createdAt)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {severityBadge(analysis.severity)}
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock3 className="size-3" />
          {formatDate(analysis.createdAt)}
        </span>
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-[11px]">
          {analysis.provider}/{analysis.model}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {tokens} · {cost} · {analysis.latencyMs ?? "—"}ms
        </span>
      </div>

      <p className="text-sm leading-5 font-medium">{analysis.summary}</p>

      {analysis.rootCause && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Niye çalışmadı (kök sebep)
          </p>
          <p className="mt-1 text-sm leading-5 text-amber-900 dark:text-amber-100">
            {analysis.rootCause}
          </p>
        </div>
      )}

      {analysis.suggestedActions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
            Yapılacaklar
          </p>
          <ul className="space-y-1 text-sm leading-5 list-disc list-inside text-foreground">
            {analysis.suggestedActions.map((action, i) => (
              <li key={`act-${analysis.id}-${i}`}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.risks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
            Riskler
          </p>
          <ul className="space-y-1 text-sm leading-5 list-disc list-inside text-amber-700">
            {analysis.risks.map((risk, i) => (
              <li key={`risk-${analysis.id}-${i}`}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.relatedFiles.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
            İlgili Dosyalar
          </p>
          <ul className="space-y-1 text-xs">
            {analysis.relatedFiles.map((file, i) => (
              <li key={`file-${analysis.id}-${i}`} className="font-mono inline-flex items-center gap-1">
                <ExternalLink className="size-3 text-muted-foreground" />
                {file}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AiAnalysisButton({ runId, runTitle }: Props) {
  const [open, setOpen] = useState(false);
  const historyQuery = useListTestCenterRunAnalysesQuery(runId, { skip: !open });
  const [triggerAnalysis, triggerState] = useTriggerTestCenterRunAnalysisMutation();

  const analyses = historyQuery.data?.items ?? [];

  const handleTrigger = async () => {
    try {
      await triggerAnalysis({ runId, body: {} }).unwrap();
      toast.success("AI analizi tamamlandı");
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI analizi başarısız";
      toast.error(message);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
        title="Bu run için AI analizi"
      >
        <Sparkles className="size-3.5" />
        AI Yorumla
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="size-5" />
              AI Test Analizi
            </DialogTitle>
            <DialogDescription className="line-clamp-2">{runTitle}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-3">
              {historyQuery.isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Geçmiş analizler yükleniyor…
                </div>
              )}

              {!historyQuery.isLoading && analyses.length === 0 && (
                <div className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-muted-foreground text-sm">
                  <History className="mx-auto mb-2 size-6" />
                  Bu run için henüz AI analizi yapılmadı.
                  <br />
                  "Yeni Analiz" butonuna basarak başla.
                </div>
              )}

              {analyses.map((a) => (
                <AnalysisCard key={a.id} analysis={a} />
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Kapat
            </Button>
            <Button onClick={handleTrigger} disabled={triggerState.isLoading} className="gap-1.5">
              {triggerState.isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {analyses.length > 0 ? "Tekrar Analiz Et" : "Yeni Analiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
