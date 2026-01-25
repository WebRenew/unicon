import { registerOTel } from '@vercel/otel'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    registerOTel({
      serviceName: process.env.VERCEL_PROJECT_PRODUCTION_URL || 'next-app',
      traceSampler: 'traceidratio', // Ratio set via OTEL_TRACES_SAMPLER_ARG env var (default 1.0)
    })
  }
}
