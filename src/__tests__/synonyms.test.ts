import { describe, expect, it } from "vitest";
import { getSynonyms, expandQueryWithSynonyms, hasSynonyms } from "./helpers";

describe("getSynonyms", () => {
  it("should return related terms for a known word", () => {
    const synonyms = getSynonyms("car");
    expect(synonyms).toContain("auto");
    expect(synonyms).toContain("vehicle");
    expect(synonyms).not.toContain("car"); // should not include self
  });

  it("should return empty array for unknown word", () => {
    expect(getSynonyms("xyznonexistent")).toEqual([]);
  });

  it("should be case insensitive", () => {
    const lower = getSynonyms("car");
    const upper = getSynonyms("CAR");
    expect(lower).toEqual(upper);
  });

  it("should trim whitespace", () => {
    const result = getSynonyms("  car  ");
    expect(result).toContain("auto");
  });
});

describe("expandQueryWithSynonyms", () => {
  it("should include original terms and their synonyms", () => {
    const expanded = expandQueryWithSynonyms("car");
    expect(expanded).toContain("car");
    expect(expanded).toContain("auto");
    expect(expanded).toContain("vehicle");
  });

  it("should handle multiple tokens", () => {
    const expanded = expandQueryWithSynonyms("home search");
    expect(expanded).toContain("home");
    expect(expanded).toContain("house");
    expect(expanded).toContain("search");
    expect(expanded).toContain("find");
  });

  it("should return original query when no synonyms found", () => {
    expect(expandQueryWithSynonyms("xyznonexistent")).toBe("xyznonexistent");
  });

  it("should deduplicate terms", () => {
    const expanded = expandQueryWithSynonyms("car");
    const words = expanded.split(" ");
    const unique = new Set(words);
    expect(words.length).toBe(unique.size);
  });
});

describe("hasSynonyms", () => {
  it("should return true for known terms", () => {
    expect(hasSynonyms("home")).toBe(true);
  });

  it("should return false for unknown terms", () => {
    expect(hasSynonyms("xyznonexistent")).toBe(false);
  });

  it("should return true if any token has synonyms", () => {
    expect(hasSynonyms("xyznonexistent home")).toBe(true);
  });
});
