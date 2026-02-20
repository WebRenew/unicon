import * as Sentry from "@sentry/nextjs";
import { registerOTel } from "@vercel/otel";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    registerOTel({
      serviceName: process.env.VERCEL_PROJECT_PRODUCTION_URL || "next-app",
      traceSampler: "traceidratio",
    });

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.VERCEL_ENV || "development",
      tracesSampleRate: 0,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.VERCEL_ENV || "development",
      tracesSampleRate: 0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
