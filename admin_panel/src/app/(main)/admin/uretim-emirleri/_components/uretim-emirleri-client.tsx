"use client";

// =============================================================
// FILE: uretim-emirleri-client.tsx
// Paspas ERP — Üretim Emirleri liste sayfası
// =============================================================

import { Fragment, useMemo, useState } from "react";

import Link from "next/link";

import { AlertTriangle, ChevronLeft, ChevronRight, Eye, Factory, Pencil, Plus, RefreshCcw, Search, Trash2, Wrench, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useDeleteUretimEmriAdminMutation,
  useListUretimEmirleriAdminQuery,
} from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";
import {
  useListSiparisIslemleriAdminQuery,
  useUretimeAktarAdminMutation,
} from "@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints";
import {
  useKuyrukCikarAdminMutation,
  useListKuyrukAdminQuery,
} from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import type { UretimEmriDto, UretimEmriDurum } from "@/integrations/shared/erp/uretim_emirleri.types";
import type { SiparisIslemSatiri } from "@/integrations/shared/erp/satis_siparisleri.types";
import { EMIR_DURUM_BADGE } from "@/integrations/shared/erp/uretim_emirleri.types";
import { useCheckYeterlilikAdminQuery } from "@/integrations/endpoints/admin/erp/stoklar_admin.endpoints";
import { useListUrunlerAdminQuery } from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";

import UretimEmriForm from "./uretim-emri-form";
import { ReceteDetayModal } from "./recete-detay-modal";
import { MakineAtaSheet } from "./makine-ata-sheet";

// Çift taraflı ürünün operasyonel YM tarafını (Sağ/Sol) tespit eder.
// Kod sonu -R/-L veya adda "Sağ"/"Sol" geçer. Taraf yoksa null.
function detectTaraf(kod: string | null | undefined, ad: string | null | undefined): "Sağ" | "Sol" | null {
  const k = (kod ?? "").trim().toLocaleUpperCase("tr");
  const a = (ad ?? "").toLocaleLowerCase("tr");
  if (/-R\b/.test(k) || /\bsağ\b/.test(a)) return "Sağ";
  if (/-L\b/.test(k) || /\bsol\b/.test(a)) return "Sol";
  return null;
}

// ── MalzemeBadge ─────────────────────────────────────────────
function MalzemeBadge({ urunId, miktar, receteId }: { urunId: string; miktar: number; receteId: string | null }) {
  const { data, isLoading } = useCheckYeterlilikAdminQuery(
    { urunId, miktar },
    { skip: !receteId },
  );

  if (!receteId) return <span className="text-muted-foreground text-xs">—</span>;
  if (isLoading) return <Skeleton className="h-5 w-16" />;
  if (!data) return <span className="text-muted-foreground text-xs">—</span>;

  if (data.tumYeterli) {
    return <Badge variant="default" className="bg-emerald-600 text-xs">Yeterli</Badge>;
  }

  const eksikSayisi = data.kalemler.filter((k) => !k.yeterli).length;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="text-xs cursor-help">
            {eksikSayisi} eksik
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            {data.kalemler.filter((k) => !k.yeterli).map((k) => (
              <div key={k.malzemeId}>
                <span className="font-medium">{k.malzemeAd}</span>: stok {k.mevcutStok.toFixed(1)}, gerekli {k.gerekliMiktarFireli.toFixed(1)} {k.birim}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function UretimOlusturGrid({ onCreated }: { onCreated: () => void }) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [aktarilacak, setAktarilacak] = useState<Record<string, string>>({});
  const [manuelRows, setManuelRows] = useState<Array<{ id: string; urunId: string; miktar: string }>>([]);
  const { data: rows = [], isLoading } = useListSiparisIslemleriAdminQuery({
    uretimDurumu: "beklemede",
    gizleTamamlanan: true,
    limit: 500,
    sort: "created_at",
    order: "desc",
  });
  const [uretimeAktar, aktarState] = useUretimeAktarAdminMutation();
  const { data: urunData } = useListUrunlerAdminQuery({
    kategori: "urun",
    tedarikTipi: "uretim",
    isActive: true,
    limit: 500,
    sort: "ad",
    order: "asc",
  });

  const groups = useMemo(() => {
    const values = new Set<string>();
    for (const row of rows) values.add(row.urunAltGrup || "Genel");
    return Array.from(values).sort((a, b) => a.localeCompare(b, "tr"));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!selectedGroup) return [];
    return rows.filter((row) => (row.urunAltGrup || "Genel") === selectedGroup && kalan(row) > 0);
  }, [rows, selectedGroup]);

  const manuelUrunler = useMemo(() => {
    if (!selectedGroup) return [];
    return (urunData?.items ?? []).filter((urun) => (urun.altGrup || "Genel") === selectedGroup);
  }, [selectedGroup, urunData?.items]);

  function kalan(row: SiparisIslemSatiri) {
    return Math.max(0, row.miktar - row.uretilenMiktar);
  }

  function toggleRow(row: SiparisIslemSatiri, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(row.kalemId);
        setAktarilacak((values) => ({ ...values, [row.kalemId]: values[row.kalemId] ?? String(kalan(row)) }));
      } else {
        next.delete(row.kalemId);
      }
      return next;
    });
  }

  async function handleAktar() {
    const kalemler = filteredRows
      .filter((row) => selectedIds.has(row.kalemId))
      .map((row) => ({
        kalemId: row.kalemId,
        miktar: Math.min(kalan(row), Number(aktarilacak[row.kalemId] ?? kalan(row))),
      }))
      .filter((row) => row.miktar > 0);
    const manuelEmirler = manuelRows
      .map((row) => ({ urunId: row.urunId, miktar: Number(row.miktar), musteriOzet: "Manuel üretim" }))
      .filter((row) => row.urunId && row.miktar > 0);

    if (kalemler.length === 0 && manuelEmirler.length === 0) {
      toast.error("Üretime aktarılacak satır seçin.");
      return;
    }

    try {
      const result = await uretimeAktar({ kalemler, manuelEmirler, birlestir: false }).unwrap();
      toast.success(`${result.message} Parti: ${result.partiNo}`);
      setSelectedIds(new Set());
      setAktarilacak({});
      setManuelRows([]);
      onCreated();
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { detail?: string; message?: string } } }).data?.error?.detail ??
            (error as { data?: { error?: { detail?: string; message?: string } } }).data?.error?.message
          : undefined;
      toast.error(message ?? "Üretime aktarma başarısız.");
    }
  }

  return (
    <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sm">Yeni Üretim Oluştur</h2>
            <p className="text-muted-foreground text-xs">Sipariş kalemlerini ürün grubuna göre üretime aktar.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedGroup || "_none"}
              onValueChange={(value) => {
                setSelectedGroup(value === "_none" ? "" : value);
                setSelectedIds(new Set());
                setAktarilacak({});
                setManuelRows([]);
              }}
            >
              <SelectTrigger className="h-8 w-52 text-xs">
                <SelectValue placeholder="Ürün grubu seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none" className="text-xs">Ürün grubu seç</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group} className="text-xs">{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAktar} disabled={aktarState.isLoading || (selectedIds.size === 0 && manuelRows.length === 0)}>
              Üretime Aktar
            </Button>
          </div>
        </div>

        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12">Seç</TableHead>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Sipariş Miktarı</TableHead>
                <TableHead className="text-right">Daha Önce Üretilen</TableHead>
                <TableHead className="text-right">Kalan</TableHead>
                <TableHead className="w-36 text-right">Üretime Aktarılacak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : !selectedGroup ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Ürün grubu seçin.</TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Bu grupta açık sipariş satırı yok.</TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const kalanMiktar = kalan(row);
                  return (
                    <TableRow key={row.kalemId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.kalemId)}
                          onCheckedChange={(value) => toggleRow(row, value === true)}
                          disabled={kalanMiktar <= 0}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.siparisNo}</TableCell>
                      <TableCell className="text-xs">{row.musteriAd}</TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{row.urunAd}</div>
                        <div className="font-mono text-muted-foreground text-[10px]">{row.urunKod}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.miktar.toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.uretilenMiktar.toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="text-right tabular-nums">{kalanMiktar.toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={kalanMiktar}
                          step="0.0001"
                          className="ml-auto h-8 w-28 text-right text-xs"
                          value={aktarilacak[row.kalemId] ?? String(kalanMiktar)}
                          onChange={(event) => setAktarilacak((values) => ({ ...values, [row.kalemId]: event.target.value }))}
                          disabled={!selectedIds.has(row.kalemId)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm">Manuel Üretim</h3>
              <p className="text-muted-foreground text-xs">Yalnızca seçilen gruba ait mamuller listelenir.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedGroup || manuelUrunler.length === 0}
              onClick={() => setManuelRows((current) => [...current, { id: crypto.randomUUID(), urunId: "", miktar: "1" }])}
            >
              <Plus className="mr-1 size-4" />
              Manuel Üretim Ekle
            </Button>
          </div>
          {manuelRows.map((row) => (
            <div key={row.id} className="grid gap-2 md:grid-cols-[1fr_140px_40px]">
              <Select
                value={row.urunId || "_none"}
                onValueChange={(value) =>
                  setManuelRows((current) => current.map((item) => item.id === row.id ? { ...item, urunId: value === "_none" ? "" : value } : item))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Mamül seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-xs">Mamül seç</SelectItem>
                  {manuelUrunler.map((urun) => (
                    <SelectItem key={urun.id} value={urun.id} className="text-xs">
                      {urun.kod} — {urun.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0.0001}
                step="0.0001"
                className="h-8 text-right text-xs"
                value={row.miktar}
                onChange={(event) =>
                  setManuelRows((current) => current.map((item) => item.id === row.id ? { ...item, miktar: event.target.value } : item))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                onClick={() => setManuelRows((current) => current.filter((item) => item.id !== row.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
    </div>
  );
}

function YariMamulIhtiyaciOzet({
  items,
  groupLabelFor,
}: {
  items: UretimEmriDto[];
  groupLabelFor: (item: UretimEmriDto) => string;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, Map<string, {
      urunAd: string;
      urunKod: string | null;
      miktar: number;
      makineler: Set<string>;
      montaj: boolean;
    }>>();

    for (const item of items) {
      const group = groupLabelFor(item);
      const groupMap = map.get(group) ?? new Map();
      const existing = groupMap.get(item.urunId);
      if (existing) {
        existing.miktar += item.planlananMiktar;
        if (item.makineAdlari) existing.makineler.add(item.makineAdlari);
      } else {
        groupMap.set(item.urunId, {
          urunAd: item.urunAd ?? item.urunId,
          urunKod: item.urunKod,
          miktar: item.planlananMiktar,
          makineler: new Set(item.makineAdlari ? [item.makineAdlari] : []),
          montaj: item.durum === "montaj_bekliyor",
        });
      }
      map.set(group, groupMap);
    }

    return Array.from(map.entries()).map(([group, rows]) => ({
      group,
      rows: Array.from(rows.values()).sort((a, b) => a.urunAd.localeCompare(b.urunAd, "tr")),
    }));
  }, [groupLabelFor, items]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-sm">Makine ve Montaj Planlama</h2>
        <p className="text-muted-foreground text-xs">Aynı yarı mamuller parti içinde toplanır.</p>
      </div>
      {groups.map((group) => (
        <div key={group.group} className="overflow-hidden rounded-md border">
          <div className="bg-muted/40 px-3 py-2 font-semibold text-xs">{group.group}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parça / Yarı Mamul</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Makine</TableHead>
                <TableHead className="text-center">Montaj</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.rows.map((row) => (
                <TableRow key={`${group.group}-${row.urunKod ?? row.urunAd}`}>
                  <TableCell>
                    <div className="font-medium text-sm">{row.urunAd}</div>
                    {row.urunKod && <div className="font-mono text-muted-foreground text-xs">{row.urunKod}</div>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.miktar.toLocaleString("tr-TR")}</TableCell>
                  <TableCell className="text-xs">{Array.from(row.makineler).join(", ") || "Atanmamış"}</TableCell>
                  <TableCell className="text-center">{row.montaj ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────
export default function UretimEmirleriClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState<UretimEmriDurum | "hepsi">("hepsi");
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState("bitis_tarihi");
  const [formOpen, setFormOpen] = useState(false);
  const [aktarModalOpen, setAktarModalOpen] = useState(false);
  const [editing, setEditing] = useState<UretimEmriDto | null>(null);
  const [formInitialKaynak, setFormInitialKaynak] = useState<"manuel" | "siparis">("manuel");
  const [deleteTarget, setDelete] = useState<UretimEmriDto | null>(null);
  const [selectedEmirForRecete, setSelectedEmirForRecete] = useState<string | null>(null);
  const [makineAtaTarget, setMakineAtaTarget] = useState<UretimEmriDto | null>(null);
  const [cikarTarget, setCikarTarget] = useState<UretimEmriDto | null>(null);
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"goruntule" | "planla">("goruntule");
  const PAGE_SIZE = 25;
  const isPlanlaTab = activeTab === "planla";

  const DURUM_OPTIONS: Array<{ value: UretimEmriDurum | "hepsi"; label: string }> = [
    { value: "hepsi", label: t("admin.erp.uretimEmirleri.statuses.hepsi") },
    { value: "atanmamis", label: t("admin.erp.uretimEmirleri.statuses.atanmamis") },
    { value: "planlandi", label: t("admin.erp.uretimEmirleri.statuses.planlandi") },
    { value: "uretimde", label: t("admin.erp.uretimEmirleri.statuses.uretimde") },
    { value: "tamamlandi", label: t("admin.erp.uretimEmirleri.statuses.tamamlandi") },
    { value: "iptal", label: t("admin.erp.uretimEmirleri.statuses.iptal") },
  ];

  const SORT_OPTIONS = [
    { value: "created_at", label: t("admin.erp.uretimEmirleri.sortOptions.createdAt") },
    { value: "bitis_tarihi", label: t("admin.erp.uretimEmirleri.sortOptions.bitisTarihi") },
    { value: "baslangic_tarihi", label: t("admin.erp.uretimEmirleri.sortOptions.baslangicTarihi") },
    { value: "emir_no", label: t("admin.erp.uretimEmirleri.sortOptions.emirNo") },
  ];

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== "hepsi" ? { durum } : {}),
    ...(showCompleted ? { tamamlananlariGoster: true } : {}),
    sort: sortBy,
    order: (sortBy === "bitis_tarihi" ? "asc" : "desc") as "asc" | "desc",
    page: page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isFetching, refetch } = useListUretimEmirleriAdminQuery(params);
  const [deleteEmri, deleteState] = useDeleteUretimEmriAdminMutation();
  const { data: kuyruklar = [], isFetching: kuyrukFetching } = useListKuyrukAdminQuery(undefined, { skip: !cikarTarget });
  const [kuyrukCikar, { isLoading: cikarLoading }] = useKuyrukCikarAdminMutation();

  const rawItems = data?.items ?? [];

  const items = useMemo(() => {
    return [...rawItems].sort((a, b) => {
      const partiCompare = (a.partiNo ?? "ZZZ").localeCompare(b.partiNo ?? "ZZZ", "tr");
      if (partiCompare !== 0) return partiCompare;
      if (sortBy !== "bitis_tarihi") return 0;
      const dateA = a.planlananBitisTarihi ?? a.bitisTarihi;
      const dateB = b.planlananBitisTarihi ?? b.bitisTarihi;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });
  }, [rawItems, sortBy]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const ozet = useMemo(() => {
    const terminRiskli = items.filter((item) => item.terminRiski && item.durum !== "tamamlandi").length;
    const aktif = items.filter((item) => item.durum === "planlandi" || item.durum === "uretimde").length;
    const tamamlanan = items.filter((item) => item.durum === "tamamlandi").length;
    return { toplam: total, terminRiskli, aktif, tamamlanan };
  }, [total, items]);

  const currentPage = Math.min(page, totalPages - 1);
  const canPrev = currentPage > 0;
  const canNext = (currentPage + 1) * PAGE_SIZE < total;

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  function openCreate() {
    setEditing(null);
    setFormInitialKaynak("manuel");
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEmri(deleteTarget.id).unwrap();
      toast.success(t("admin.erp.common.deleted", { item: t("admin.erp.uretimEmirleri.singular") }));
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "data" in err
          ? ((err as { data?: { error?: { message?: string; detail?: string } } }).data?.error?.detail ??
            (err as { data?: { error?: { message?: string; detail?: string } } }).data?.error?.message)
          : undefined;
      toast.error(message ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDelete(null);
    }
  }

  async function confirmCikar() {
    if (!cikarTarget) return;
    const allItems = kuyruklar.flatMap((g) => g.kuyruk);
    const emirItems = allItems.filter((k) => k.uretimEmriId === cikarTarget.id);

    if (emirItems.length === 0) {
      toast.error("Bu emrin kuyrukta atanmış operasyonu bulunamadı.");
      setCikarTarget(null);
      return;
    }

    // Aktif veya duraklatılmış operasyonlar çıkarılamaz
    const aktifler = emirItems.filter((k) => k.durum === 'calisiyor' || k.durum === 'duraklatildi');
    if (aktifler.length > 0) {
      toast.error("Aktif veya duraklatılmış operasyonlar çıkarılamaz. Önce operasyonu durdurun.");
      setCikarTarget(null);
      return;
    }

    const cikarilacaklar = emirItems.filter((k) => k.durum === 'bekliyor');
    if (cikarilacaklar.length === 0) {
      toast.error("Bu emrin çıkarılabilir operasyonu bulunamadı.");
      setCikarTarget(null);
      return;
    }

    try {
      for (const item of cikarilacaklar) {
        await kuyrukCikar(item.id).unwrap();
      }
      toast.success(`${cikarilacaklar.length} operasyon makineden çıkarıldı.`);
    } catch {
      toast.error("Makineden çıkarma sırasında hata oluştu.");
    } finally {
      setCikarTarget(null);
    }
  }

  function ilerlemeYuzde(e: UretimEmriDto) {
    if (!e.planlananMiktar) return 0;
    return Math.min(100, Math.round((e.uretilenMiktar / e.planlananMiktar) * 100));
  }

  function getDurumLabel(d: UretimEmriDurum): string {
    return t(`admin.erp.uretimEmirleri.statuses.${d}`);
  }

  function productGroupLabel(e: UretimEmriDto): string {
    const name = e.siparisUrunAd ?? e.urunAd ?? "Ürün Grubu Yok";
    return name.split(/[/-]/)[0]?.trim() || name;
  }

  function partiGroupLabel(e: UretimEmriDto): string {
    return e.partiNo ?? "Partisiz Üretimler";
  }

  function resetFilters() {
    setSearch("");
    setDurum("hepsi");
    setSortBy("bitis_tarihi");
    setPage(0);
  }

  function formatDateShort(value: string | null | undefined) {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return null;
    }
  }

  function renderDeleteButton(e: UretimEmriDto) {
    const button = (
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive disabled:text-muted-foreground"
        onClick={() => setDelete(e)}
        disabled={!e.silinebilir}
      >
        <Trash2 className="size-3.5" />
      </Button>
    );

    if (!e.silinebilir && e.silmeNedeni) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><span>{button}</span></TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="whitespace-pre-line text-xs">{e.silmeNedeni}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return button;
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">{t("admin.erp.uretimEmirleri.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("admin.erp.common.totalCount", {
              count: String(data?.total ?? 0),
              item: t("admin.erp.uretimEmirleri.singular").toLowerCase(),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
          {isPlanlaTab && (
            <Button size="sm" onClick={() => setAktarModalOpen(true)}>
              <Plus className="mr-1 size-4" /> Yeni Üretim Oluştur
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "goruntule" | "planla")}>
        <TabsList>
          <TabsTrigger value="goruntule">Üretimleri Görüntüle</TabsTrigger>
          <TabsTrigger value="planla">Üretim Planla</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("admin.erp.uretimEmirleri.summary.total"), value: ozet.toplam, color: "" },
          { label: t("admin.erp.uretimEmirleri.summary.active"), value: ozet.aktif, color: "text-blue-600" },
          { label: t("admin.erp.uretimEmirleri.summary.terminRiskli"), value: ozet.terminRiskli, color: ozet.terminRiskli > 0 ? "text-destructive" : "" },
          { label: t("admin.erp.uretimEmirleri.summary.completed"), value: ozet.tamamlanan, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="shadow-none">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <div className="relative w-full max-w-50">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder={t("admin.erp.uretimEmirleri.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={durum} onValueChange={(v) => setDurum(v as UretimEmriDurum | "hepsi")}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DURUM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
          {t("admin.erp.uretimEmirleri.resetFilters")}
        </Button>
        <Button
          variant={showCompleted ? "secondary" : "outline"}
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => setShowCompleted((v) => !v)}
        >
          {showCompleted ? "Tamamlananları Gizle" : "Tamamlananları Göster"}
        </Button>
      </div>

      <Dialog open={aktarModalOpen} onOpenChange={setAktarModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Yeni Üretim Oluştur</DialogTitle>
          </DialogHeader>
          <UretimOlusturGrid
            onCreated={() => {
              setAktarModalOpen(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Tablo */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-32">{t("admin.erp.uretimEmirleri.columns.emirNo")}</TableHead>
              <TableHead className="min-w-40">{t("admin.erp.uretimEmirleri.columns.urunId")}</TableHead>
              <TableHead className="w-36">Müşteri</TableHead>
              <TableHead className="w-32">{t("admin.erp.uretimEmirleri.columns.bitis")}</TableHead>
              <TableHead className="w-24 text-right">{t("admin.erp.uretimEmirleri.columns.planlanan")}</TableHead>
              <TableHead className="w-36">{t("admin.erp.uretimEmirleri.columns.ilerleme")}</TableHead>
              <TableHead className="w-24 text-center">{t("admin.erp.uretimEmirleri.columns.malzeme")}</TableHead>
              {isPlanlaTab && <TableHead className="w-48">Makine</TableHead>}
              {isPlanlaTab && <TableHead className="w-24 text-right pr-4" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`ue-skel-${i + 1}`}>
                  {Array.from({ length: isPlanlaTab ? 9 : 7 }).map((__, j) => (
                    <TableCell key={`ue-skel-${i + 1}-${j + 1}`}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={isPlanlaTab ? 9 : 7} className="py-16 text-center text-muted-foreground">
                  {t("admin.erp.uretimEmirleri.notFound")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((e, index) => {
              const planlananBitis = formatDateShort(e.planlananBitisTarihi);
              const ilerleYuzde = ilerlemeYuzde(e);
              const atanmamis = e.makineAtamaSayisi === 0;
              const displayUrunAd = e.siparisUrunAd ?? e.urunAd ?? e.urunId;
              const displayUrunKod = e.siparisUrunKod ?? e.urunKod;
              const groupLabel = partiGroupLabel(e);
              const previousGroupLabel = index > 0 ? partiGroupLabel(items[index - 1]) : null;
              const showOperasyonelUrun =
                Boolean(e.siparisUrunAd || e.siparisUrunKod) &&
                (e.urunAd !== e.siparisUrunAd || e.urunKod !== e.siparisUrunKod);
              // Çift taraflı ürünlerde Sağ/Sol operasyonel YM'leri ayrı üretim
              // emri olur (montaj gereği). Kullanıcı bunu "çift kayıt" sanmasın
              // diye taraf rozeti gösterilir.
              const taraf = detectTaraf(e.urunKod, e.urunAd);

              return (
                <Fragment key={e.id}>
                {groupLabel !== previousGroupLabel && (
                  <TableRow key={`${groupLabel}-group`}>
                    <TableCell colSpan={isPlanlaTab ? 9 : 7} className="bg-muted/40 py-2 font-semibold text-xs">
                      {groupLabel}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow
                  className={`group hover:bg-slate-50/80 transition-colors ${e.terminRiski && e.durum !== "tamamlandi" ? "bg-destructive/5" : ""}`}
                >
                  {/* Emir No + Durum */}
                  <TableCell>
                    <div className="font-bold font-mono text-sm text-slate-900 leading-none">{e.emirNo}</div>
                    <Badge
                      className="mt-1 px-2 py-0 text-[10px] font-semibold"
                      variant={e.terminRiski && e.durum !== "tamamlandi" ? "destructive" : EMIR_DURUM_BADGE[e.durum]}
                    >
                      {getDurumLabel(e.durum)}
                    </Badge>
                  </TableCell>

                  {/* Ürün */}
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-slate-900 line-clamp-1">{displayUrunAd}</div>
                        {displayUrunKod && <div className="text-xs text-muted-foreground font-mono">{displayUrunKod}</div>}
                        {showOperasyonelUrun && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            {taraf && (
                              <Badge
                                variant="outline"
                                className={`px-1 py-0 text-[9px] font-bold ${
                                  taraf === "Sağ"
                                    ? "border-blue-300 bg-blue-50 text-blue-700"
                                    : "border-purple-300 bg-purple-50 text-purple-700"
                                }`}
                              >
                                {taraf === "Sağ" ? "ÇİFT TARAFLI · SAĞ" : "ÇİFT TARAFLI · SOL"}
                              </Badge>
                            )}
                            <span>Operasyonel YM: {e.urunKod ? `${e.urunKod} — ` : ""}{e.urunAd ?? e.urunId}</span>
                          </div>
                        )}
                        {e.siparisNo && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Sipariş: {e.siparisNo}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Müşteri */}
                  <TableCell>
                    {e.musteriAd ? (
                      <div
                        className="text-sm text-slate-700 truncate max-w-32 font-medium"
                        title={e.musteriDetay || undefined}
                      >
                        {e.musteriAd}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {t("admin.erp.uretimEmirleri.siparissiz")}
                      </span>
                    )}
                  </TableCell>

                  {/* Planlanan Bitiş */}
                  <TableCell>
                    {planlananBitis ? (
                      <div className="text-sm font-medium text-slate-700">{planlananBitis}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    {e.terminRiski && e.durum !== "tamamlandi" && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="size-3 text-destructive" />
                        <span className="text-[10px] text-destructive font-medium">Termin riski</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Planlanan Miktar */}
                  <TableCell className="text-right">
                    <span className="font-bold text-sm text-slate-900">
                      {e.planlananMiktar.toLocaleString("tr-TR")}
                    </span>
                  </TableCell>

                  {/* İlerleme */}
                  <TableCell>
                    <div className="text-xs text-muted-foreground mb-1">
                      {e.uretilenMiktar.toLocaleString("tr-TR")} / {e.planlananMiktar.toLocaleString("tr-TR")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={ilerleYuzde} className="h-1.5 flex-1 max-w-20" />
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums">{ilerleYuzde}%</span>
                    </div>
                  </TableCell>

                  {/* Malzeme */}
                  <TableCell className="text-center">
                    <MalzemeBadge urunId={e.urunId} miktar={e.planlananMiktar} receteId={e.receteId} />
                  </TableCell>

                  {/* Makine */}
                  {isPlanlaTab && <TableCell>
                    {atanmamis ? (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Atanmamış</span>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => setMakineAtaTarget(e)}
                          >
                            <Factory className="size-3" />
                            Makine Ata
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-700 flex items-center gap-1">
                          <Factory className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-30">{e.makineAdlari}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] px-1.5 text-destructive hover:text-destructive gap-1"
                          onClick={() => setCikarTarget(e)}
                        >
                          <X className="size-3" />
                          Makineden Çıkar
                        </Button>
                      </div>
                    )}
                  </TableCell>}

                  {/* Aksiyonlar */}
                  {isPlanlaTab && <TableCell className="text-right pr-3">
                    <div className="flex justify-end items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-indigo-600"
                        title="Reçete Detayı"
                        onClick={() => setSelectedEmirForRecete(e.id)}
                      >
                        <Wrench className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7" asChild>
                        <Link href={`/admin/uretim-emirleri/${e.id}`}>
                          <Eye className="size-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditing(e); setFormOpen(true); }}>
                        <Pencil className="size-3.5" />
                      </Button>
                      {renderDeleteButton(e)}
                    </div>
                  </TableCell>}
                </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        {total > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 bg-muted/10">
            <p className="text-muted-foreground text-sm">
              {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, total)} / {total}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4 mr-1" />
                Önceki
              </Button>
              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  className="min-w-9 h-8"
                  disabled={isFetching}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isPlanlaTab && (
        <YariMamulIhtiyaciOzet items={items} groupLabelFor={partiGroupLabel} />
      )}

      {/* Form Sheet */}
      <UretimEmriForm open={formOpen} onClose={() => setFormOpen(false)} emri={editing} initialKaynak={formInitialKaynak} />

      {/* Makine Ata Sheet */}
      <MakineAtaSheet
        emirId={makineAtaTarget?.id ?? null}
        emirNo={makineAtaTarget?.emirNo ?? ""}
        open={!!makineAtaTarget}
        onClose={() => setMakineAtaTarget(null)}
      />

      {/* Sil Onayı */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.uretimEmirleri.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.erp.common.deleteDescriptionIrreversible", { name: deleteTarget?.emirNo ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteState.isLoading ? t("admin.erp.common.deleting") : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Makineden Çıkar Onayı */}
      <AlertDialog open={!!cikarTarget} onOpenChange={(v) => !v && setCikarTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Makineden Çıkar</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{cikarTarget?.emirNo}</strong> emrinin tüm makine atamaları kaldırılacak. Devam edilsin mi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCikar}
              disabled={cikarLoading || kuyrukFetching}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cikarLoading ? "Çıkarılıyor…" : kuyrukFetching ? "Yükleniyor…" : "Evet, Çıkar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReceteDetayModal
        emirId={selectedEmirForRecete}
        onOpenChange={(open) => !open && setSelectedEmirForRecete(null)}
      />
    </div>
  );
}
