import { describe, expect, it } from "vitest";
import { getIconRenderMode, toPascalCase } from "./helpers";

describe("toPascalCase", () => {
  it("should convert kebab-case to PascalCase", () => {
    expect(toPascalCase("arrow-left")).toBe("ArrowLeft");
  });

  it("should handle single word", () => {
    expect(toPascalCase("home")).toBe("Home");
  });

  it("should handle multiple segments", () => {
    expect(toPascalCase("arrow-up-right-from-square")).toBe(
      "ArrowUpRightFromSquare"
    );
  });

  it("should handle empty string", () => {
    expect(toPascalCase("")).toBe("");
  });
});

describe("getIconRenderMode", () => {
  it("should return fill for fill-based icons", () => {
    expect(
      getIconRenderMode({ defaultFill: true, defaultStroke: false })
    ).toBe("fill");
  });

  it("should return stroke for stroke-based icons", () => {
    expect(
      getIconRenderMode({ defaultFill: false, defaultStroke: true })
    ).toBe("stroke");
  });

  it("should return stroke when both are true", () => {
    expect(
      getIconRenderMode({ defaultFill: true, defaultStroke: true })
    ).toBe("stroke");
  });

  it("should return stroke when both are false", () => {
    expect(
      getIconRenderMode({ defaultFill: false, defaultStroke: false })
    ).toBe("stroke");
  });
});
