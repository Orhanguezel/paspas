"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DatabaseBackup,
  FileText,
  Hash,
  Play,
  RotateCcw,
  Save,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateDbSnapshotMutation,
  useListDbSnapshotsQuery,
  useRestoreDbSnapshotMutation,
} from "@/integrations/endpoints/admin/db_admin.endpoints";
import {
  useCreateTestCenterRunMutation,
  useListTestCenterCasesQuery,
  useListTestCenterRunsQuery,
  useRunAllTestCenterMutation,
} from "@/integrations/endpoints/admin/test_center.endpoints";
import type { TestCenterCase, TestCenterRun, TestCenterRunStatus } from "@/integrations/shared";

import { AiAnalysisButton } from "./ai-analysis-button";

const statusLabel: Record<TestCenterRunStatus | string, string> = {
  passed: "Geçti",
  failed: "Hatalı",
  expected_failing: "Beklenen hata",
  skipped: "Atlandı",
  not_run: "Çalışmadı",
};

function statusBadge(status: string) {
  if (status === "passed") return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Geçti</Badge>;
  if (status === "failed") return <Badge variant="destructive">Hatalı</Badge>;
  if (status === "expected_failing") {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Beklenen hata</Badge>;
  }
  return <Badge variant="outline">{statusLabel[status] ?? status}</Badge>;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR");
}

function countValue(value?: number | null) {
  return value ?? 0;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;
  const data = "data" in error ? error.data : undefined;
  if (typeof data !== "object" || data === null) return fallback;
  const apiError = "error" in data ? data.error : undefined;
  if (typeof apiError !== "object" || apiError === null) return fallback;
  const message = "message" in apiError ? apiError.message : undefined;
  return typeof message === "string" ? message : fallback;
}

function summarizeOutput(output?: string | null, riskNote?: string | null) {
  const source = output || riskNote || "";
  if (!source.trim()) return "Kayıt için ek not girilmemiş.";

  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const errorLine = lines.find((line) =>
    /(error|fail|failed|expected|received|exception|throw|hatalı|başarısız)/i.test(line),
  );
  const summaryLine = lines.find((line) =>
    /(pass|passed|fail|failed|skip|expect\(\) calls|ran \d+ tests|tests across)/i.test(line),
  );

  return errorLine || summaryLine || lines[0] || "Kayıt için ek not girilmemiş.";
}

function CountPill({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="min-w-16 rounded-md border bg-background px-2 py-1 text-center">
      <div className={`font-semibold text-sm ${tone ?? ""}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground leading-4">{label}</div>
    </div>
  );
}

function RunHistoryItem({ run }: { run: TestCenterRun }) {
  const detailText = [run.riskNotu, run.outputExcerpt].filter(Boolean).join("\n\n");
  const summary = summarizeOutput(run.outputExcerpt, run.riskNotu);
  const isFailed = run.status === "failed";

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(run.status)}
            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
              <Clock3 className="size-3.5" />
              {formatDate(run.createdAt)}
            </span>
            {run.snapshotId ? (
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                <Hash className="size-3" />
                {run.snapshotId}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="font-medium text-sm leading-5">{run.baslik}</h3>
            <p className="mt-1 break-all font-mono text-muted-foreground text-xs leading-5">
              {run.komut || "Komut yok"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="grid grid-cols-4 gap-2">
            <CountPill label="pass" value={countValue(run.passCount)} tone="text-emerald-700" />
            <CountPill label="fail" value={countValue(run.failCount)} tone={isFailed ? "text-destructive" : undefined} />
            <CountPill label="skip" value={countValue(run.skipCount)} />
            <CountPill label="expect" value={countValue(run.expectCount)} />
          </div>
          <AiAnalysisButton runId={run.id} runTitle={run.baslik} />
        </div>
      </div>

      <div
        className={`mt-3 flex gap-2 rounded-md border px-3 py-2 text-sm ${
          isFailed ? "border-destructive/30 bg-destructive/5 text-destructive" : "bg-muted/30 text-muted-foreground"
        }`}
      >
        {isFailed ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        ) : (
          <FileText className="mt-0.5 size-4 shrink-0" />
        )}
        <p className="min-w-0 whitespace-normal break-words leading-5">{summary}</p>
      </div>

      {detailText ? (
        <details className="mt-3 rounded-md border bg-muted/20">
          <summary className="cursor-pointer px-3 py-2 font-medium text-sm">Detay logu göster</summary>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-t p-3 text-muted-foreground text-xs leading-5">
            {detailText}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

export function TestCenterClient() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const [status, setStatus] = useState<TestCenterRunStatus>("passed");
  const [outputExcerpt, setOutputExcerpt] = useState("");
  const [riskNotu, setRiskNotu] = useState("");

  const casesQuery = useListTestCenterCasesQuery({ activeOnly: true });
  const runsQuery = useListTestCenterRunsQuery({ limit: 50 });
  const snapshotsQuery = useListDbSnapshotsQuery();
  const [createRun, createRunState] = useCreateTestCenterRunMutation();
  const [runAllTests, runAllTestsState] = useRunAllTestCenterMutation();
  const [createSnapshot, createSnapshotState] = useCreateDbSnapshotMutation();
  const [restoreSnapshot, restoreSnapshotState] = useRestoreDbSnapshotMutation();

  const cases = casesQuery.data?.items ?? [];
  const runs = runsQuery.data?.items ?? [];
  const snapshots = snapshotsQuery.data ?? [];

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId],
  );

  const latestByCase = useMemo(() => {
    const map = new Map<string, string>();
    for (const run of runs) {
      if (run.caseId && !map.has(run.caseId)) map.set(run.caseId, run.status);
    }
    return map;
  }, [runs]);

  const runStats = useMemo(
    () => ({
      total: runs.length,
      passed: runs.filter((run) => run.status === "passed").length,
      failed: runs.filter((run) => run.status === "failed").length,
      expected: runs.filter((run) => run.status === "expected_failing").length,
    }),
    [runs],
  );

  const saveResult = async (item?: TestCenterCase, forcedStatus?: TestCenterRunStatus) => {
    const testCase = item ?? selectedCase;
    if (!testCase) {
      toast.error("Önce bir test seçmelisin.");
      return;
    }

    try {
      await createRun({
        caseId: testCase.id,
        baslik: testCase.baslik,
        komut: testCase.komut ?? undefined,
        status: forcedStatus ?? status,
        outputExcerpt: outputExcerpt || undefined,
        riskNotu: riskNotu || testCase.riskNotu || undefined,
        snapshotId: selectedSnapshotId || undefined,
        finishedAt: new Date().toISOString(),
      }).unwrap();
      toast.success("Test sonucu kaydedildi.");
      setOutputExcerpt("");
      setRiskNotu("");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Test sonucu kaydedilemedi."));
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      const snapshot = await createSnapshot({
        label: `Test oncesi yedek ${new Date().toLocaleString("tr-TR")}`,
        note: "Test Merkezi uzerinden olusturuldu.",
      }).unwrap();
      setSelectedSnapshotId(snapshot.id);
      toast.success("Veritabanı yedeği alındı.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Yedek alınamadı."));
    }
  };

  const handleRestoreSnapshot = async () => {
    if (!selectedSnapshotId) {
      toast.error("Geri yüklemek için bir yedek seç.");
      return;
    }
    const ok = window.confirm("Seçili yedek canlı veritabanına geri yüklenecek. Devam edilsin mi?");
    if (!ok) return;

    try {
      await restoreSnapshot({ id: selectedSnapshotId, truncateBefore: true, dryRun: false }).unwrap();
      toast.success("Veritabanı seçili yedekten geri yüklendi.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Geri yükleme başarısız."));
    }
  };

  const handleRunAllTests = async () => {
    const ok = window.confirm(
      "Tüm checklist testleri backend üzerinde çalıştırılacak. DB entegrasyon testleri açıksa canlı veritabanında test verisi oluşabilir. Devam edilsin mi?",
    );
    if (!ok) return;

    try {
      const result = await runAllTests({
        snapshotId: selectedSnapshotId || undefined,
        includeDbIntegration: true,
      }).unwrap();
      if (result.failed > 0) {
        toast.error(`${result.total} test çalıştı, ${result.failed} tanesi hatalı.`);
      } else {
        toast.success(`${result.total} test çalıştı, hata yok.`);
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Testler çalıştırılamadı."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-lg">Test Merkezi</h1>
          <p className="text-muted-foreground text-sm">
            Smoke ve entegrasyon testleri, canlı DB yedeği ve test sonuç kayıtları.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleRunAllTests} disabled={runAllTestsState.isLoading}>
            <Play className="size-4" />
            {runAllTestsState.isLoading ? "Testler Çalışıyor" : "Tüm Testleri Başlat"}
          </Button>
          <Button onClick={handleCreateSnapshot} disabled={createSnapshotState.isLoading}>
            <DatabaseBackup className="size-4" />
            Yedek Al
          </Button>
          <Button variant="outline" onClick={handleRestoreSnapshot} disabled={restoreSnapshotState.isLoading}>
            <RotateCcw className="size-4" />
            Yedekten Geri Yükle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canlı DB Güvenliği</CardTitle>
          <CardDescription>
            Teste başlamadan önce snapshot al, test bitince aynı snapshot seçiliyken geri yükle.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
            <SelectTrigger>
              <SelectValue placeholder="Snapshot seç" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map((snapshot) => (
                <SelectItem key={snapshot.id} value={snapshot.id}>
                  {snapshot.label || snapshot.filename || snapshot.id} - {formatDate(snapshot.created_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input readOnly value={selectedSnapshotId || "Snapshot seçilmedi"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Checklist Tablosu</CardTitle>
          <CardDescription>Hazırladığımız test başlıkları ve son kayıt durumu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Komut</TableHead>
                <TableHead>Son Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="min-w-64 whitespace-normal">
                    <div className="font-medium">{item.baslik}</div>
                    <div className="text-muted-foreground text-xs">{item.riskNotu}</div>
                  </TableCell>
                  <TableCell>{item.kategori}</TableCell>
                  <TableCell className="max-w-80 whitespace-normal font-mono text-xs">{item.komut || "-"}</TableCell>
                  <TableCell>{statusBadge(latestByCase.get(item.id) ?? item.durum)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => saveResult(item, "passed")}>
                        <CheckCircle2 className="size-4" />
                        Geçti
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => saveResult(item, "failed")}>
                        <XCircle className="size-4" />
                        Hatalı
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manuel Sonuç Notu</CardTitle>
          <CardDescription>Test çıktısı, risk ve snapshot bilgisini geçmişe yaz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={selectedCase?.id ?? ""} onValueChange={setSelectedCaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Test seç" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.baslik}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value as TestCenterRunStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">Geçti</SelectItem>
                <SelectItem value="failed">Hatalı</SelectItem>
                <SelectItem value="expected_failing">Beklenen hata</SelectItem>
                <SelectItem value="skipped">Atlandı</SelectItem>
                <SelectItem value="not_run">Çalışmadı</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => saveResult()} disabled={createRunState.isLoading}>
              <Save className="size-4" />
              Sonucu Kaydet
            </Button>
          </div>
          <Textarea
            rows={4}
            value={outputExcerpt}
            onChange={(e) => setOutputExcerpt(e.target.value)}
            placeholder="Test çıktısı veya kısa not"
          />
          <Textarea rows={2} value={riskNotu} onChange={(e) => setRiskNotu(e.target.value)} placeholder="Risk notu" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Sonuç Geçmişi</CardTitle>
              <CardDescription>Ham log yerine okunabilir özet, sayaçlar ve açılır detay görünümü.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{runStats.total} kayıt</Badge>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{runStats.passed} geçti</Badge>
              <Badge variant={runStats.failed > 0 ? "destructive" : "outline"}>{runStats.failed} hatalı</Badge>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{runStats.expected} beklenen</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {runs.length > 0 ? (
            runs.map((run) => <RunHistoryItem key={run.id} run={run} />)
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
              Henüz kayıtlı test sonucu yok.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
