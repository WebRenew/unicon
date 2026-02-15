import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiTokenSettings } from "./api-token-settings";

describe("ApiTokenSettings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the generated token visible so the user can copy it", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          session_id: "session_123",
          access_token: "uni_secret_token_1234",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    render(<ApiTokenSettings initialSessions={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Token" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(
      await screen.findByText(/token created.*copy it now/i)
    ).toBeInTheDocument();
    expect(screen.getByText("uni_secret_token_1234")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy token" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });
});
