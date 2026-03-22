"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Database, HardDrive, KeyRound, FileSearch, Settings, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocaleContext } from "@/i18n/LocaleProvider";

const UsersListClient = dynamic(() => import("@/app/(main)/admin/(admin)/users/_components/users-list-client"));
const GirisAyarlariClient = dynamic(() => import("@/app/(main)/admin/giris-ayarlari/_components/giris-ayarlari-client"));
const AdminStorageClient = dynamic(() => import("@/app/(main)/admin/(admin)/storage/_components/admin-storage-client"));
const AdminSiteSettingsClient = dynamic(() => import("@/app/(main)/admin/(admin)/site-settings/_components/admin-site_settings-client"));
const AdminDbClient = dynamic(() => import("@/app/(main)/admin/(admin)/db/_components/admin-db-client").then((m) => ({ default: m.AdminDbClient })));
const AuditLogsClient = dynamic(() => import("@/app/(main)/admin/audit-logs/_components/audit-logs-client"));

const TABS = [
  { value: "kullanicilar", icon: Users, label: "Kullanıcılar" },
  { value: "giris-ayarlari", icon: KeyRound, label: "Giriş Ayarları" },
  { value: "site-ayarlari", icon: Settings, label: "Site Ayarları" },
  { value: "medyalar", icon: HardDrive, label: "Medyalar" },
  { value: "veritabani", icon: Database, label: "Veritabanı" },
  { value: "audit-logs", icon: FileSearch, label: "Audit Logları" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function SistemClient() {
  const { t } = useLocaleContext();
  const searchParams = useSearchParams();

  const activeTab = useMemo<TabValue>(() => {
    const tab = searchParams.get("tab");
    if (TABS.some((t) => t.value === tab)) return tab as TabValue;
    return "kullanicilar";
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Sistem & Ayarlar</h1>
        <p className="text-sm text-muted-foreground">Kullanıcı, güvenlik, medya ve sistem yönetimi</p>
      </div>

      <Tabs value={activeTab}>
        <TabsList className="flex-wrap">
          {TABS.map((tab) => (
            <Link key={tab.value} href={`/admin/sistem?tab=${tab.value}`} replace>
              <TabsTrigger value={tab.value} asChild>
                <span className="flex items-center gap-1.5">
                  <tab.icon className="size-3.5" />
                  {tab.label}
                </span>
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>

        <TabsContent value="kullanicilar"><UsersListClient /></TabsContent>
        <TabsContent value="giris-ayarlari"><GirisAyarlariClient /></TabsContent>
        <TabsContent value="site-ayarlari"><AdminSiteSettingsClient /></TabsContent>
        <TabsContent value="medyalar"><AdminStorageClient /></TabsContent>
        <TabsContent value="veritabani"><AdminDbClient /></TabsContent>
        <TabsContent value="audit-logs"><AuditLogsClient /></TabsContent>
      </Tabs>
    </div>
  );
}
