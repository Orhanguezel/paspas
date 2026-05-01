"use client";

import * as React from "react";

import {
  ArrowLeft,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ALL_DOCS,
  TARTISMA_DOCS,
  TEKLIF_DOCS,
  findDoc,
} from "../../../_lib/teklif-data";
import NotlarPanel from "./notlar-panel";

const BASE_PATH = "/proje-teklifi";

type Props = {
  initialKey: string;
};

export default function DokumanDetayClient({ initialKey }: Props) {
  const router = useRouter();
  const [activeKey, setActiveKey] = React.useState(initialKey);
  const [fullscreen, setFullscreen] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    setActiveKey(initialKey);
  }, [initialKey]);

  const activeDoc = React.useMemo(() => findDoc(activeKey) ?? ALL_DOCS[0], [activeKey]);

  const iframeSrc = `${BASE_PATH}/${activeDoc.file}`;

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleOpenNewTab = () => {
    window.open(iframeSrc, "_blank");
  };

  const handleSelect = (key: string) => {
    router.push(`/admin/proje-teklifi/dokuman/${key}`);
  };

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0"
                title="Sunum sayfasına dön"
              >
                <Link href="/admin/proje-teklifi">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  <Link
                    href="/admin/proje-teklifi"
                    className="text-muted-foreground transition hover:text-primary"
                  >
                    MatPortal
                  </Link>
                  <span className="text-muted-foreground">/</span>
                  <span>{activeDoc.title}</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {activeDoc.description ?? "MatPortal proje teklifi dokümanı"}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {activeDoc.key}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Layers className="h-4 w-4" />
                    Bölüm Seç
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[70vh] w-80 overflow-y-auto">
                  <DropdownMenuLabel>Proje Teklifi (Resmî)</DropdownMenuLabel>
                  {TEKLIF_DOCS.map((doc) => (
                    <DropdownMenuItem
                      key={doc.key}
                      onSelect={() => handleSelect(doc.key)}
                      className={activeKey === doc.key ? "bg-accent" : ""}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{doc.title}</span>
                        {doc.description && (
                          <span className="text-muted-foreground text-xs">{doc.description}</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tartışma Dokümanları</DropdownMenuLabel>
                  {TARTISMA_DOCS.map((doc) => (
                    <DropdownMenuItem
                      key={doc.key}
                      onSelect={() => handleSelect(doc.key)}
                      className={activeKey === doc.key ? "bg-accent" : ""}
                    >
                      {doc.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Download className="h-4 w-4" />
                Yazdır / PDF
              </Button>

              <Button variant="outline" size="sm" onClick={handleOpenNewTab}>
                <ExternalLink className="h-4 w-4" />
                Yeni Sekme
              </Button>

              <Button variant="outline" size="sm" onClick={() => setFullscreen((f) => !f)}>
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {fullscreen ? "Küçült" : "Tam Ekran"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className={fullscreen ? "fixed inset-2 z-50 flex flex-col" : ""}>
        <CardContent className={fullscreen ? "flex-1 p-0" : "p-0"}>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={activeDoc.title}
            className={
              fullscreen
                ? "h-full w-full rounded-md border-0"
                : "h-[calc(100vh-220px)] min-h-150 w-full rounded-md border-0"
            }
          />
        </CardContent>
      </Card>

      {!fullscreen && <NotlarPanel dokumanKey={activeDoc.key} dokumanBaslik={activeDoc.title} />}
    </div>
  );
}
