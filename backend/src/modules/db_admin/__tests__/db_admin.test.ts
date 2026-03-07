import { describe, expect, it } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { tmpFilePath, rmSafe, gunzipIfNeeded } from "../helpers";

describe("tmpFilePath", () => {
  it("returns path in system tmp directory", () => {
    const p = tmpFilePath();
    expect(p.startsWith(tmpdir())).toBe(true);
  });

  it("includes dbdump_ prefix", () => {
    const p = tmpFilePath();
    expect(p).toContain("dbdump_");
  });

  it("appends suffix when provided", () => {
    const p = tmpFilePath(".sql");
    expect(p.endsWith(".sql")).toBe(true);
  });

  it("generates unique paths", () => {
    const a = tmpFilePath();
    const b = tmpFilePath();
    expect(a).not.toBe(b);
  });
});

describe("rmSafe", () => {
  it("removes existing file without throwing", () => {
    const p = join(tmpdir(), `test_rmsafe_${Date.now()}`);
    writeFileSync(p, "test");
    expect(existsSync(p)).toBe(true);
    rmSafe(p);
    expect(existsSync(p)).toBe(false);
  });

  it("does not throw for non-existent path", () => {
    expect(() => rmSafe("/tmp/nonexistent_file_xyz_123")).not.toThrow();
  });

  it("does not throw for undefined/empty", () => {
    expect(() => rmSafe(undefined)).not.toThrow();
    expect(() => rmSafe("")).not.toThrow();
  });
});

describe("gunzipIfNeeded", () => {
  it("returns same path for non-.gz files", async () => {
    const p = "/tmp/test.sql";
    expect(await gunzipIfNeeded(p)).toBe(p);
  });
});
