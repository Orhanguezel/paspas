import { describe, expect, it } from "bun:test";

import { boolLike, UUID36, URL2000, SLUG, urlOrRelativePath } from "../validation";
import { packJson, unpackArray, parseJsonArrayString, extractHtmlFromJson, packContent } from "../json";

/* ================================================================
   Validation Schemas
   ================================================================ */

describe("boolLike", () => {
  it("accepts boolean true/false", () => {
    expect(boolLike.safeParse(true).success).toBe(true);
    expect(boolLike.safeParse(false).success).toBe(true);
  });

  it("accepts numeric 0/1", () => {
    expect(boolLike.safeParse(0).success).toBe(true);
    expect(boolLike.safeParse(1).success).toBe(true);
  });

  it("accepts string '0'/'1'/'true'/'false'", () => {
    expect(boolLike.safeParse("0").success).toBe(true);
    expect(boolLike.safeParse("1").success).toBe(true);
    expect(boolLike.safeParse("true").success).toBe(true);
    expect(boolLike.safeParse("false").success).toBe(true);
  });

  it("rejects other values", () => {
    expect(boolLike.safeParse("yes").success).toBe(false);
    expect(boolLike.safeParse(2).success).toBe(false);
    expect(boolLike.safeParse(null).success).toBe(false);
  });
});

describe("UUID36", () => {
  it("accepts valid 36-char uuid", () => {
    expect(UUID36.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
  });

  it("rejects short string", () => {
    expect(UUID36.safeParse("short").success).toBe(false);
  });

  it("rejects longer string", () => {
    expect(UUID36.safeParse("550e8400-e29b-41d4-a716-446655440000x").success).toBe(false);
  });
});

describe("URL2000", () => {
  it("accepts valid url", () => {
    expect(URL2000.safeParse("https://promats.com.tr").success).toBe(true);
  });

  it("rejects non-url string", () => {
    expect(URL2000.safeParse("not a url").success).toBe(false);
  });

  it("rejects url longer than 2000 chars", () => {
    expect(URL2000.safeParse("https://x.com/" + "a".repeat(2000)).success).toBe(false);
  });
});

describe("SLUG", () => {
  it("accepts valid slug", () => {
    expect(SLUG.safeParse("hello-world").success).toBe(true);
    expect(SLUG.safeParse("test123").success).toBe(true);
  });

  it("rejects uppercase", () => {
    expect(SLUG.safeParse("Hello").success).toBe(false);
  });

  it("rejects spaces", () => {
    expect(SLUG.safeParse("hello world").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(SLUG.safeParse("").success).toBe(false);
  });

  it("rejects consecutive dashes", () => {
    expect(SLUG.safeParse("hello--world").success).toBe(false);
  });

  it("rejects leading/trailing dash", () => {
    expect(SLUG.safeParse("-hello").success).toBe(false);
    expect(SLUG.safeParse("hello-").success).toBe(false);
  });
});

describe("urlOrRelativePath", () => {
  it("accepts https url", () => {
    expect(urlOrRelativePath.safeParse("https://promats.com.tr/logo.png").success).toBe(true);
  });

  it("accepts http url", () => {
    expect(urlOrRelativePath.safeParse("http://localhost:8078/img.jpg").success).toBe(true);
  });

  it("accepts relative path starting with /", () => {
    expect(urlOrRelativePath.safeParse("/uploads/logo.png").success).toBe(true);
  });

  it("rejects plain string", () => {
    expect(urlOrRelativePath.safeParse("just-a-string").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(urlOrRelativePath.safeParse("").success).toBe(false);
  });
});

/* ================================================================
   JSON Helpers
   ================================================================ */

describe("packJson", () => {
  it("serializes object to JSON string", () => {
    expect(packJson({ a: 1 })).toBe('{"a":1}');
  });

  it("serializes array", () => {
    expect(packJson([1, 2])).toBe("[1,2]");
  });
});

describe("unpackArray", () => {
  it("parses JSON array string", () => {
    expect(unpackArray('["a","b"]')).toEqual(["a", "b"]);
  });

  it("returns empty array for null/undefined", () => {
    expect(unpackArray(null)).toEqual([]);
    expect(unpackArray(undefined)).toEqual([]);
    expect(unpackArray("")).toEqual([]);
  });
});

describe("parseJsonArrayString", () => {
  it("parses valid JSON array", () => {
    expect(parseJsonArrayString('["x","y"]')).toEqual(["x", "y"]);
  });

  it("converts non-string items to string", () => {
    expect(parseJsonArrayString("[1,2]")).toEqual(["1", "2"]);
  });

  it("returns empty for invalid JSON", () => {
    expect(parseJsonArrayString("not-json")).toEqual([]);
  });

  it("returns empty for non-array JSON", () => {
    expect(parseJsonArrayString('{"a":1}')).toEqual([]);
  });

  it("returns empty for null/undefined", () => {
    expect(parseJsonArrayString(null)).toEqual([]);
    expect(parseJsonArrayString(undefined)).toEqual([]);
  });
});

describe("extractHtmlFromJson", () => {
  it("extracts html field from JSON", () => {
    expect(extractHtmlFromJson('{"html":"<p>hi</p>"}')).toBe("<p>hi</p>");
  });

  it("returns empty for no html field", () => {
    expect(extractHtmlFromJson('{"text":"hi"}')).toBe("");
  });

  it("returns empty for null/undefined", () => {
    expect(extractHtmlFromJson(null)).toBe("");
    expect(extractHtmlFromJson(undefined)).toBe("");
  });

  it("returns empty for invalid JSON", () => {
    expect(extractHtmlFromJson("bad")).toBe("");
  });
});

describe("packContent", () => {
  it("wraps plain HTML string in {html} object", () => {
    expect(packContent("<p>hello</p>")).toBe('{"html":"<p>hello</p>"}');
  });

  it("preserves existing {html} JSON structure", () => {
    expect(packContent('{"html":"<b>ok</b>"}')).toBe('{"html":"<b>ok</b>"}');
  });
});
