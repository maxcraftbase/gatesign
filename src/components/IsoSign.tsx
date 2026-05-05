'use client'

import { useState } from 'react'
import { isoSignUrl } from '@/lib/safety-rules'

export function IsoSign({
  code,
  fallback,
  fallbackClass,
  size = 44,
}: {
  code: string
  fallback: string
  fallbackClass: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)

  if (!code || failed) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 ${fallbackClass}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {fallback}
      </div>
    )
  }

  return (
    <img
      src={isoSignUrl(code)}
      alt={code}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  )
}
