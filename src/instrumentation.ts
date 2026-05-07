export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./env')
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
