'use client'

import { useState } from 'react'
import { isoSignUrl, type SignType } from '@/lib/safety-rules'

function SignShell({ signType, size }: { signType: SignType; size: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1
  const sw = Math.max(2, size * 0.09)

  if (signType === 'mandatory') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="#2563eb" />
      </svg>
    )
  }

  if (signType === 'prohibition') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="white" stroke="#dc2626" strokeWidth={sw} />
        <line
          x1={cx - r * 0.58} y1={cy - r * 0.58}
          x2={cx + r * 0.58} y2={cy + r * 0.58}
          stroke="#dc2626" strokeWidth={sw}
        />
      </svg>
    )
  }

  if (signType === 'warning') {
    const topX = cx, topY = cy - r
    const blX = cx - r * 0.866, blY = cy + r * 0.5
    const brX = cx + r * 0.866, brY = cy + r * 0.5
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <polygon
          points={`${topX},${topY} ${blX},${blY} ${brX},${brY}`}
          fill="#facc15" stroke="#1e293b" strokeWidth={Math.max(1.5, size * 0.05)}
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (signType === 'emergency') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <rect x={1} y={1} width={size - 2} height={size - 2} rx={size * 0.05} fill="#16a34a" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <rect x={1} y={1} width={size - 2} height={size - 2} rx={size * 0.05} fill="#94a3b8" />
    </svg>
  )
}

export function IsoSign({
  code,
  signType,
  size = 44,
}: {
  code?: string
  signType: SignType
  size?: number
}) {
  const [failed, setFailed] = useState(false)

  if (!code || failed) {
    return <SignShell signType={signType} size={size} />
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
