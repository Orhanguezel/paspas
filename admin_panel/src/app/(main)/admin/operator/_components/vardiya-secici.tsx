"use client";

import { useEffect } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocaleContext } from "@/i18n/LocaleProvider";

export type VardiyaOption = {
  id: string;
  vardiyaTipi: string;
  baslangic: string;
  bitis: string | null;
};

type Props = {
  value: { vardiyaId: string } | null;
  onChange: (value: { vardiyaId: string } | null) => void;
  options: VardiyaOption[];
  acikVardiyaId?: string | null;
  disabled?: boolean;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function VardiyaSecici({ value, onChange, options, acikVardiyaId, disabled = false }: Props) {
  const { t } = useLocaleContext();

  useEffect(() => {
    if (value || options.length === 0) return;
    const active = options.find((option) => option.id === acikVardiyaId)
      ?? options.find((option) => option.bitis === null);
    if (active) onChange({ vardiyaId: active.id });
  }, [acikVardiyaId, onChange, options, value]);

  return (
    <div className="w-full space-y-2 rounded-xl border bg-muted/20 p-3">
      <Label>{t("admin.erp.operator.shiftQuestion")}</Label>
      <Select
        disabled={disabled}
        value={value?.vardiyaId ?? ""}
        onValueChange={(vardiyaId) => onChange({ vardiyaId })}
      >
        <SelectTrigger className="h-11 w-full rounded-xl bg-primary text-base text-primary-foreground">
          <SelectValue placeholder={t("admin.erp.operator.selectShift")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="min-h-11">
              {t(option.vardiyaTipi === "gece" ? "admin.erp.operator.nightShift" : "admin.erp.operator.dayShift")}
              {" · "}{formatDate(option.baslangic)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
