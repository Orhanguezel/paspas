import { describe, expect, it } from "bun:test";

import {
  buildMalzemeGorselleriSeedSql,
  deterministicUuid,
  parseFileName,
  publicIdFromName,
} from "../generate-malzeme-gorselleri-seed";

describe("generate-malzeme-gorselleri-seed", () => {
  it("parses material image file names into product code and cover metadata", () => {
    expect(parseFileName("1101_101_kpk.png")).toEqual({
      kod: "1101 101",
      suffix: "kpk",
      isCover: true,
      ext: "png",
    });
    expect(parseFileName("1101 101 a.webp")).toEqual({
      kod: "1101 101",
      suffix: "a",
      isCover: false,
      ext: "webp",
    });
    expect(parseFileName("not-a-material.png")).toBeNull();
  });

  it("generates idempotent storage, product cover and media SQL by material image name", () => {
    const result = buildMalzemeGorselleriSeedSql([
      { fname: "1101_101_kpk.png", size: 1234 },
      { fname: "1101_101_a.webp", size: 5678 },
      { fname: "readme.txt", size: 1 },
    ]);

    expect(result.assetCount).toBe(2);
    expect(result.coverUpdateCount).toBe(1);
    expect(result.medyaCount).toBe(2);
    expect(result.skipped).toEqual(["-- parse fail: readme.txt"]);

    expect(result.sql).toContain("INSERT IGNORE INTO storage_assets");
    expect(result.sql).toContain("'product-images', 'malzemeler/1101_101_kpk.png', 'malzemeler'");
    expect(result.sql).toContain("'image/png', 1234");
    expect(result.sql).toContain("'image/webp', 5678");
    expect(result.sql).toContain("UPDATE urunler SET image_url = '/uploads/malzemeler/1101_101_kpk.png'");
    expect(result.sql).toContain("WHERE kod = '1101 101' AND image_url IS NULL");
    expect(result.sql).toContain("FROM urunler u WHERE u.kod = '1101 101' LIMIT 1;");
    expect(result.sql).toContain("/uploads/malzemeler/1101_101_a.webp");
    expect(result.sql).toContain(", 1, 0, CURRENT_TIMESTAMP(3)");
    expect(result.sql).toContain("-- parse fail: readme.txt");
  });

  it("keeps generated ids and public ids stable for repeated seed runs", () => {
    expect(deterministicUuid("asset:product-images/malzemeler/1101_101_kpk.png")).toBe(
      deterministicUuid("asset:product-images/malzemeler/1101_101_kpk.png"),
    );
    expect(publicIdFromName("1101 101 kpk.png")).toBe("1101_101_kpk");
  });
});
