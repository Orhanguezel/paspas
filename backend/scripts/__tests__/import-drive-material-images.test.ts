import { describe, expect, it } from "bun:test";

import {
  decodeDriveHtml,
  normalizeFileName,
  parseDriveFiles,
} from "../import-drive-material-images";

describe("import-drive-material-images", () => {
  it("decodes Google Drive escaped folder HTML fragments", () => {
    expect(decodeDriveHtml(String.raw`[\x22abc\u003d\u003d\x22,&quot;x&quot;,\/path]`)).toBe(
      `["abc==","x",/path]`,
    );
  });

  it("parses and sorts image files from Drive folder HTML while deduplicating ids", () => {
    const idA = "A12345678901234567890";
    const idB = "B12345678901234567890";
    const parent = "P12345678901234567890";
    const html = [
      `["${idB}",["${parent}"],"1101 102 a.webp","image/webp"`,
      `["${idA}",["${parent}"],"1101 101 kpk.png","image/png"`,
      `["${idA}",["${parent}"],"1101 101 duplicate.png","image/png"`,
      `["C12345678901234567890",["${parent}"],"notes.pdf","application/pdf"`,
      `["D12345678901234567890",["${parent}"],"bad/name.jpg","image/jpeg"`,
    ].join("\n");

    expect(parseDriveFiles(html)).toEqual([
      { id: idA, name: "1101 101 kpk.png", mime: "image/png" },
      { id: idB, name: "1101 102 a.webp", mime: "image/webp" },
      { id: "D12345678901234567890", name: "bad_name.jpg", mime: "image/jpeg" },
    ]);
  });

  it("normalizes local filenames with the same convention used by local uploads", () => {
    expect(normalizeFileName("1101 101 kpk.png")).toBe("1101_101_kpk.png");
    expect(normalizeFileName("1101/101 kırmızı.JPG")).toBe("1101_101_k_rm_z_.JPG");
    expect(normalizeFileName("already-safe.webp")).toBe("already-safe.webp");
  });
});
