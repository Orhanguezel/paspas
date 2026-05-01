"use client";

import { useMemo, useState } from "react";

import { BookOpenText, FileText, ListTree, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { AdminDocBlock, AdminDocSection } from "../_lib/admin-docs-types";

type Props = {
  sections: AdminDocSection[];
  updatedAt: string;
};

function InlineText({ text }: { text: string }) {
  const parts: Array<{ key: string; value: string; code: boolean }> = [];
  const regex = /`[^`]+`/g;
  let cursor = 0;
  let match = regex.exec(text);

  while (match) {
    if (match.index > cursor) {
      parts.push({ key: `text-${cursor}`, value: text.slice(cursor, match.index), code: false });
    }
    parts.push({ key: `code-${match.index}`, value: match[0], code: true });
    cursor = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (cursor < text.length) {
    parts.push({ key: `text-${cursor}`, value: text.slice(cursor), code: false });
  }

  return (
    <>
      {parts.map((part) => {
        if (part.code) {
          return (
            <code key={part.key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
              {part.value.slice(1, -1)}
            </code>
          );
        }

        return <span key={part.key}>{part.value}</span>;
      })}
    </>
  );
}

function DocBlockView({ block }: { block: AdminDocBlock }) {
  if (block.type === "heading") {
    const Component = block.level === 3 ? "h3" : "h4";
    return (
      <Component className={cn("font-semibold text-foreground", block.level === 3 ? "mt-5 text-base" : "mt-4 text-sm")}>
        {block.text}
      </Component>
    );
  }

  if (block.type === "list") {
    const Component = block.ordered ? "ol" : "ul";
    return (
      <Component
        className={cn(
          "space-y-1.5 text-muted-foreground text-sm leading-6",
          block.ordered ? "list-decimal pl-5" : "list-disc pl-5",
        )}
      >
        {block.items.map((item) => (
          <li key={item}>
            <InlineText text={item} />
          </li>
        ))}
      </Component>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="max-h-96 overflow-auto rounded-md border bg-muted/50 p-3 text-xs leading-5">
        <code>{block.value}</code>
      </pre>
    );
  }

  return (
    <p className="text-muted-foreground text-sm leading-6">
      <InlineText text={block.text} />
    </p>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminDocsClient({ sections, updatedAt }: Props) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return sections;
    return sections.filter((section) => section.searchText.includes(normalizedQuery));
  }, [normalizedQuery, sections]);

  const siteSettingsCount = sections.filter((section) => section.title.toLowerCase().includes("site ayar")).length;

  return (
    <div className="flex min-h-0 flex-col gap-5 lg:h-[calc(100dvh-8rem)] lg:overflow-hidden">
      <div className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpenText className="size-4" />
              <span className="font-medium text-xs uppercase tracking-wide">Admin dokumanlari</span>
            </div>
            <h1 className="font-semibold text-xl tracking-tight">Sayfa dokumantasyonu</h1>
            <p className="max-w-3xl text-muted-foreground text-sm">
              Admin panelindeki sayfa akislari, operasyon notlari ve risk kayitlari tek ekranda aranabilir halde
              listelenir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <ListTree className="size-3" />
              {sections.length} bolum
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <FileText className="size-3" />
              {siteSettingsCount} site ayari
            </Badge>
            <Badge variant="outline">Guncel: {formatDate(updatedAt)}</Badge>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl shrink-0">
        <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Baslik, rota veya risk notu ara"
          className="pl-9"
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="hidden min-h-0 lg:block">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
            <div className="border-b px-4 py-3">
              <p className="font-medium text-sm">Bolumler</p>
              <p className="text-muted-foreground text-xs">{filteredSections.length} sonuc</p>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <nav className="space-y-1 p-2">
                {filteredSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-md px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="line-clamp-2">{section.title}</span>
                    {section.route ? (
                      <span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground/80">
                        {section.route}
                      </span>
                    ) : null}
                  </a>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        <main className="min-h-0 space-y-4 lg:overflow-y-auto lg:pr-2">
          {filteredSections.length === 0 ? (
            <Card className="rounded-lg">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Arama ile eslesen dokuman bolumu bulunamadi.
              </CardContent>
            </Card>
          ) : null}

          {filteredSections.map((section) => (
            <Card key={section.id} id={section.id} className="scroll-mt-20 rounded-lg">
              <CardHeader className="gap-3 border-b pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle className="text-base leading-6">{section.title}</CardTitle>
                  {section.route ? (
                    <Badge variant="outline" className="font-mono">
                      {section.route}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {section.blocks.map((block) => (
                  <DocBlockView key={block.id} block={block} />
                ))}
              </CardContent>
            </Card>
          ))}
        </main>
      </div>

      <Separator className="shrink-0" />
    </div>
  );
}
