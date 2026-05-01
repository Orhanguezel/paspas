import type { AdminDocBlock, AdminDocSection } from "./admin-docs-types";

const ROUTE_RE = /`(\/admin[^` ]*)`/;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractRoute(lines: string[]) {
  for (const line of lines) {
    const match = line.match(ROUTE_RE);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function createBlockId(sectionIndex: number, blockIndex: number) {
  return `section-${sectionIndex + 1}-block-${blockIndex + 1}`;
}

function pushParagraph(blocks: AdminDocBlock[], buffer: string[], sectionIndex: number) {
  const text = buffer.join(" ").trim();
  if (text) {
    blocks.push({
      id: createBlockId(sectionIndex, blocks.length),
      type: "paragraph",
      text,
    });
  }
  buffer.length = 0;
}

function parseBlocks(lines: string[], sectionIndex: number): AdminDocBlock[] {
  const blocks: AdminDocBlock[] = [];
  const paragraph: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      pushParagraph(blocks, paragraph, sectionIndex);
      continue;
    }

    if (trimmed.startsWith("```")) {
      pushParagraph(blocks, paragraph, sectionIndex);
      const language = trimmed.replace(/^```/, "").trim();
      const value: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").trim().startsWith("```")) {
        value.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push({
        id: createBlockId(sectionIndex, blocks.length),
        type: "code",
        language,
        value: value.join("\n"),
      });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      pushParagraph(blocks, paragraph, sectionIndex);
      blocks.push({
        id: createBlockId(sectionIndex, blocks.length),
        type: "heading",
        level: 3,
        text: trimmed.replace(/^###\s+/, ""),
      });
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      pushParagraph(blocks, paragraph, sectionIndex);
      blocks.push({
        id: createBlockId(sectionIndex, blocks.length),
        type: "heading",
        level: 4,
        text: trimmed.replace(/^####\s+/, ""),
      });
      continue;
    }

    const bullet = trimmed.match(/^-\s+(.*)$/);
    if (bullet?.[1]) {
      pushParagraph(blocks, paragraph, sectionIndex);
      const items = [bullet[1]];
      while (index + 1 < lines.length) {
        const next = (lines[index + 1] ?? "").trim();
        const match = next.match(/^-\s+(.*)$/);
        if (!match?.[1]) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push({
        id: createBlockId(sectionIndex, blocks.length),
        type: "list",
        ordered: false,
        items,
      });
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ordered?.[1]) {
      pushParagraph(blocks, paragraph, sectionIndex);
      const items = [ordered[1]];
      while (index + 1 < lines.length) {
        const next = (lines[index + 1] ?? "").trim();
        const match = next.match(/^\d+\.\s+(.*)$/);
        if (!match?.[1]) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push({
        id: createBlockId(sectionIndex, blocks.length),
        type: "list",
        ordered: true,
        items,
      });
      continue;
    }

    paragraph.push(trimmed);
  }

  pushParagraph(blocks, paragraph, sectionIndex);
  return blocks;
}

export function parseAdminDocumentation(markdown: string): AdminDocSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^##\s+/, "").trim(), lines: [] };
      continue;
    }

    if (current) current.lines.push(line);
  }

  if (current) sections.push(current);

  return sections.map((section, index) => {
    const id = `${String(index + 1).padStart(2, "0")}-${slugify(section.title)}`;
    const blocks = parseBlocks(section.lines, index);
    const searchText = [section.title, ...section.lines].join(" ").toLowerCase();

    return {
      id,
      title: section.title,
      route: extractRoute(section.lines),
      searchText,
      blocks,
    };
  });
}
