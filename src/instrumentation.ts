export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./env')
    await import('../sentry.server.config')
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureMessage('GateSign server started', 'info')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
