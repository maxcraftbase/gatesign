import { chromium, type FullConfig } from '@playwright/test'

export default async function globalSetup(config: FullConfig) {
  const sitePassword = process.env.PLAYWRIGHT_SITE_PASSWORD
  if (!sitePassword) return

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(`${baseURL}/api/auth/site-password`, { waitUntil: 'domcontentloaded' }).catch(() => {})

  // POST to unlock endpoint
  const res = await page.request.post(`${baseURL}/api/auth/site-password`, {
    data: { password: sitePassword },
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok()) {
    await browser.close()
    throw new Error(`Site-Passwort falsch oder /api/auth/site-password nicht erreichbar (${res.status()})`)
  }

  // Save auth state so all test workers pick up the cookie
  await page.context().storageState({ path: 'tests/e2e/.auth.json' })
  await browser.close()
}
