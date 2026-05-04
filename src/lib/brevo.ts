const BREVO_API = 'https://api.brevo.com/v3/smtp/email'

interface SendEmailOpts {
  to: string
  subject: string
  html: string
  attachments?: { name: string; content: Buffer }[]
}

export async function sendEmail(opts: SendEmailOpts): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY not configured')

  const senderEmail = process.env.DIGEST_FROM_EMAIL
  if (!senderEmail) throw new Error('DIGEST_FROM_EMAIL not configured')
  const senderName = 'GateSign'

  const body: Record<string, unknown> = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: opts.html,
  }

  if (opts.attachments?.length) {
    body.attachment = opts.attachments.map(a => ({
      name: a.name,
      content: a.content.toString('base64'),
    }))
  }

  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo error: ${err}`)
  }
}
