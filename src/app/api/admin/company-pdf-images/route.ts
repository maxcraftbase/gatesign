import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ images: [], debug: 'deprecated — use client-side rendering' })
}
