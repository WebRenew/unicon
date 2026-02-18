import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { db } from "@/lib/db";
import { getCacheStats } from "@/lib/ai";

vi.mock("@/lib/db", () => ({
  db: {
    all: vi.fn(),
  },
}));

vi.mock("@/lib/ai", () => ({
  getCacheStats: vi.fn(),
}));

describe("GET /api/health", () => {
  const dbAllMock = vi.mocked(db.all);
  const getCacheStatsMock = vi.mocked(getCacheStats);
  const originalAiGatewayKey = process.env.AI_GATEWAY_API_KEY;
  const originalOpenAiKey = process.env.OPENAI_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    dbAllMock
      .mockResolvedValueOnce([{ count: 100 }])
      .mockResolvedValueOnce([{ count: 80 }]);

    getCacheStatsMock.mockReturnValue({
      searchResults: { size: 10, maxSize: 100 },
      embeddings: { size: 50, maxSize: 1000 },
      queryExpansions: { size: 20, maxSize: 1000 },
    });
  });

  afterEach(() => {
    if (typeof originalAiGatewayKey === "string") {
      process.env.AI_GATEWAY_API_KEY = originalAiGatewayKey;
    } else {
      delete process.env.AI_GATEWAY_API_KEY;
    }

    if (typeof originalOpenAiKey === "string") {
      process.env.OPENAI_API_KEY = originalOpenAiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }

    if (typeof originalAnthropicKey === "string") {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it.each([
    {
      name: "AI Gateway + Anthropic",
      gatewayKey: "gateway-key",
      openAiKey: undefined,
      anthropicKey: "anthropic-key",
      expectedAiStatus: "healthy",
      expectedHttpStatus: 200,
      expectedOverallStatus: "healthy",
      expectedOpenAiConfigured: true,
      expectedAnthropicConfigured: true,
    },
    {
      name: "OpenAI + Anthropic",
      gatewayKey: undefined,
      openAiKey: "openai-key",
      anthropicKey: "anthropic-key",
      expectedAiStatus: "healthy",
      expectedHttpStatus: 200,
      expectedOverallStatus: "healthy",
      expectedOpenAiConfigured: true,
      expectedAnthropicConfigured: true,
    },
    {
      name: "OpenAI only",
      gatewayKey: undefined,
      openAiKey: "openai-key",
      anthropicKey: undefined,
      expectedAiStatus: "degraded",
      expectedHttpStatus: 200,
      expectedOverallStatus: "healthy",
      expectedOpenAiConfigured: true,
      expectedAnthropicConfigured: false,
    },
    {
      name: "Anthropic only",
      gatewayKey: undefined,
      openAiKey: undefined,
      anthropicKey: "anthropic-key",
      expectedAiStatus: "degraded",
      expectedHttpStatus: 200,
      expectedOverallStatus: "healthy",
      expectedOpenAiConfigured: false,
      expectedAnthropicConfigured: true,
    },
    {
      name: "No provider keys",
      gatewayKey: undefined,
      openAiKey: undefined,
      anthropicKey: undefined,
      expectedAiStatus: "unhealthy",
      expectedHttpStatus: 503,
      expectedOverallStatus: "unhealthy",
      expectedOpenAiConfigured: false,
      expectedAnthropicConfigured: false,
    },
  ])("reports AI readiness matrix correctly for $name", async (scenario) => {
    if (scenario.gatewayKey) {
      process.env.AI_GATEWAY_API_KEY = scenario.gatewayKey;
    } else {
      delete process.env.AI_GATEWAY_API_KEY;
    }

    if (scenario.openAiKey) {
      process.env.OPENAI_API_KEY = scenario.openAiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }

    if (scenario.anthropicKey) {
      process.env.ANTHROPIC_API_KEY = scenario.anthropicKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(scenario.expectedHttpStatus);
    expect(payload).toMatchObject({
      status: scenario.expectedOverallStatus,
      ai: {
        status: scenario.expectedAiStatus,
        openai: {
          configured: scenario.expectedOpenAiConfigured,
        },
        anthropic: {
          configured: scenario.expectedAnthropicConfigured,
        },
      },
    });
  });

  it("returns unhealthy when DB is down even if AI providers are configured", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.ANTHROPIC_API_KEY = "anthropic-key";
    dbAllMock.mockReset();
    dbAllMock.mockRejectedValue(new Error("db unavailable"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "unhealthy",
      database: {
        status: "unhealthy",
        connected: false,
      },
      ai: {
        status: "healthy",
      },
      cache: {
        status: "healthy",
      },
    });
  });
});
