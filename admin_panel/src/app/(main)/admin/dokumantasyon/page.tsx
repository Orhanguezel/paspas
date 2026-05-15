import AdminDocsClient from "./_components/admin-docs-client";
import { parseAdminDocumentation } from "./_lib/admin-docs-parser";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DOC_FILENAME = "ADMIN_SAYFA_DOKUMANTASYONU.md";

export const dynamic = "force-dynamic";

async function resolveDocsPath(): Promise<string | null> {
  const candidates = [
    path.join(process.cwd(), "..", "docs", DOC_FILENAME),
    path.join(process.cwd(), "docs", DOC_FILENAME),
    path.join(process.cwd(), "public", "docs", DOC_FILENAME),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  // Sunucuda docs/ dizini deploy edilmemiş olabilir; bulunamadıysa null dön.
  return null;
}

export default async function Page() {
  // Server Component: dosya okunamazsa TÜM RSC render'ı çökertmemeli.
  // (Canlıda /var/www/paspas/docs/ yok → eski hali "Server Components render"
  //  hatası veriyordu.) Bulunamazsa boş dökümantasyon ile zarifçe düş.
  try {
    const docsPath = await resolveDocsPath();
    if (!docsPath) {
      return <AdminDocsClient sections={[]} updatedAt={new Date().toISOString()} />;
    }
    const [markdown, fileStat] = await Promise.all([readFile(docsPath, "utf8"), stat(docsPath)]);
    const sections = parseAdminDocumentation(markdown);
    return <AdminDocsClient sections={sections} updatedAt={fileStat.mtime.toISOString()} />;
  } catch {
    return <AdminDocsClient sections={[]} updatedAt={new Date().toISOString()} />;
  }
}
