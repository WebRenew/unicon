import { describe, expect, it } from "vitest";
import { STARTER_PACKS } from "./starter-packs";

describe("STARTER_PACKS", () => {
  it("has unique pack IDs", () => {
    const ids = STARTER_PACKS.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes an AI agent/company logo starter pack with documented substitutions", () => {
    const pack = STARTER_PACKS.find((entry) => entry.id === "brand-ai-agents");
    expect(pack).toBeDefined();

    expect(pack?.iconNames).toEqual(
      expect.arrayContaining([
        "openai",
        "anthropic",
        "googlegemini",
        "meta",
        "xai",
        "perplexity",
        "mistralai",
        "cohere",
        "huggingface",
        "stabilityai",
      ])
    );

    expect(pack?.description.toLowerCase()).toContain("substitutions");
  });
});
