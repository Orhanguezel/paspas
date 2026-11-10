'use client';

// "Sayfa Icerikleri" kaydi icin alan bazli editor (G2).
// Semasi bilinen sayfalarda (products/production/hakkimizda) form gosterilir,
// ham JSON "Gelismis" bolumune iner; semasiz sayfalarda yalniz JSON kalir.

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  PAGE_CONTENT_SCHEMAS,
  pcGet,
  pcSet,
  type PcField,
  type PcSchema,
} from '../_lib/page-content-schemas';

type Row = Record<string, unknown>;

function fieldText(value: unknown, kind: PcField['kind']): string {
  if (kind === 'lines') return Array.isArray(value) ? value.map(String).join('\n') : String(value ?? '');
  return String(value ?? '');
}

function textToValue(text: string, kind: PcField['kind']): unknown {
  if (kind === 'lines') return text.split('\n').map((line) => line.trim()).filter(Boolean);
  return text;
}

function FieldInput({ id, field, value, onChange }: {
  id: string;
  field: PcField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const text = fieldText(value, field.kind);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      {field.kind === 'area' || field.kind === 'lines' ? (
        <Textarea id={id} className="min-h-20" value={text} onChange={(e) => onChange(textToValue(e.target.value, field.kind))} />
      ) : (
        <Input id={id} value={text} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.hint ? <p className="text-muted-foreground text-xs">{field.hint}</p> : null}
    </div>
  );
}

export function PageContentEditor({ pageKey, jsonText, onJsonTextChange }: {
  pageKey: string;
  jsonText: string;
  onJsonTextChange: (next: string) => void;
}) {
  const schema: PcSchema | undefined = PAGE_CONTENT_SCHEMAS[pageKey];

  const parsed = useMemo<Row | null>(() => {
    try {
      const value = JSON.parse(jsonText) as unknown;
      return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : null;
    } catch {
      return null;
    }
  }, [jsonText]);

  const apply = (next: Row) => onJsonTextChange(JSON.stringify(next, null, 2));

  const advanced = (
    <details className="rounded-xl border" open={!schema || !parsed}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Gelişmiş — ham JSON</summary>
      <div className="border-t p-3">
        <Textarea
          className="min-h-[420px] font-mono text-xs leading-5"
          value={jsonText}
          onChange={(e) => onJsonTextChange(e.target.value)}
        />
      </div>
    </details>
  );

  if (!schema || !parsed) {
    return (
      <div className="space-y-3">
        {!parsed ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            JSON çözümlenemedi; alan bazlı form için önce JSON'u geçerli hale getirin.
          </p>
        ) : null}
        {advanced}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schema.map((group, groupIndex) => (
        <section key={group.title} className="space-y-3 rounded-xl border p-4">
          <div className="font-medium">{group.title}</div>
          {group.fields?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.path} className={field.kind === 'area' || field.kind === 'lines' ? 'md:col-span-2' : ''}>
                  <FieldInput
                    id={`pc-${groupIndex}-${field.path}`}
                    field={field}
                    value={pcGet(parsed, field.path)}
                    onChange={(next) => apply(pcSet(parsed, field.path, next))}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {group.lists?.map((list) => {
            const items = pcGet(parsed, list.path);
            const rows = Array.isArray(items) ? (items as Row[]) : [];
            return (
              <div key={list.path} className="space-y-2">
                <Label>{list.label}</Label>
                {rows.map((row, index) => (
                  <div key={index} className="space-y-2 rounded-lg border bg-muted/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">#{index + 1}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Maddeyi sil"
                        onClick={() => apply(pcSet(parsed, list.path, rows.filter((_, i) => i !== index)))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {list.item.map((field) => (
                        <div key={field.path} className={field.kind === 'area' || field.kind === 'lines' ? 'md:col-span-2' : ''}>
                          <FieldInput
                            id={`pc-${groupIndex}-${list.path}-${index}-${field.path}`}
                            field={field}
                            value={pcGet(row, field.path)}
                            onChange={(next) => {
                              const nextRows = rows.map((item, i) => (i === index ? pcSet(item, field.path, next) : item));
                              apply(pcSet(parsed, list.path, nextRows));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => apply(pcSet(parsed, list.path, [...rows, { ...list.template }]))}
                >
                  <Plus className="mr-1 size-4" /> Madde ekle
                </Button>
              </div>
            );
          })}
        </section>
      ))}
      {advanced}
    </div>
  );
}
