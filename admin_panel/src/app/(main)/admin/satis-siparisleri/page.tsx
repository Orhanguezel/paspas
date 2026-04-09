"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Settings2 } from "lucide-react";
import SatisSiparisleriClient from "./_components/satis-siparisleri-client";
import SiparisIslemleriTab from "./_components/siparis-islemleri-tab";

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<string>("girisleri");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="girisleri" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Sipariş Girişleri
          </TabsTrigger>
          <TabsTrigger value="islemleri" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Sipariş İşlemleri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="girisleri" className="mt-4">
          <SatisSiparisleriClient />
        </TabsContent>

        <TabsContent value="islemleri" className="mt-4">
          <SiparisIslemleriTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
