import { notFound } from "next/navigation";

import { findDoc } from "../../_lib/teklif-data";
import DokumanDetayClient from "./_components/dokuman-detay-client";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const doc = findDoc(key);
  if (!doc) {
    notFound();
  }
  return <DokumanDetayClient initialKey={key} />;
}
