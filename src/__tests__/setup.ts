import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs with globals disabled, so React Testing Library cannot register
// its automatic cleanup. Without this, components stay mounted after each test
// and pending timers (e.g. the 150ms search debounce in use-icon-browser) fire
// setState after jsdom teardown, failing CI with "window is not defined".
afterEach(() => {
  cleanup();
});
