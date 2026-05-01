import AdminDocsClient from "./_components/admin-docs-client";
import { parseAdminDocumentation } from "./_lib/admin-docs-parser";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DOC_FILENAME = "ADMIN_SAYFA_DOKUMANTASYONU.md";

export const dynamic = "force-dynamic";

async function resolveDocsPath() {
  const candidates = [
    path.join(process.cwd(), "..", "docs", DOC_FILENAME),
    path.join(process.cwd(), "docs", DOC_FILENAME),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  return candidates[0];
}

export default async function Page() {
  const docsPath = await resolveDocsPath();
  const [markdown, fileStat] = await Promise.all([readFile(docsPath, "utf8"), stat(docsPath)]);
  const sections = parseAdminDocumentation(markdown);

  return <AdminDocsClient sections={sections} updatedAt={fileStat.mtime.toISOString()} />;
}
