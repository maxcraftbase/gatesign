import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'

export async function GET() {
  try {
    const ctx = await getAdminContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?company_id=eq.${ctx.company.id}&key=eq.company_pdf_url&select=value`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    const rows: { value: string }[] = await settingsRes.json()
    const pdfUrl = rows[0]?.value
    if (!pdfUrl) return NextResponse.json({ images: [] })

    const pdfRes = await fetch(pdfUrl)
    if (!pdfRes.ok) return NextResponse.json({ images: [] })
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer())

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfDoc = await (pdfjsLib.getDocument as any)({
      data: pdfBytes,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise

    const images: string[] = []
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale: 2.0 })

      // NodeCanvasFactory is used automatically in Node.js by pdfjs-dist legacy
      // when @napi-rs/canvas is installed
      const { createCanvas } = await import('@napi-rs/canvas')
      const canvas = createCanvas(viewport.width, viewport.height)
      const ctx2d = canvas.getContext('2d')

      await page.render({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        canvasContext: ctx2d as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        canvas: canvas as any,
        viewport,
      }).promise

      images.push(canvas.toDataURL('image/jpeg', 0.92))
    }

    return NextResponse.json({ images })
  } catch (err) {
    console.error('PDF render error:', err)
    return NextResponse.json({ images: [], error: String(err) })
  }
}
