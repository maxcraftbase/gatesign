'use client'

import { useState } from 'react'
import { isoSignUrl, type SignType } from '@/lib/safety-rules'

function SignShell({ signType, size, icon }: { signType: SignType; size: number; icon?: string }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1
  const sw = Math.max(2, size * 0.09)
  const fontSize = size * 0.5

  if (signType === 'mandatory') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="#2563eb" />
        {icon && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={fontSize}>{icon}</text>}
      </svg>
    )
  }

  if (signType === 'prohibition') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="white" stroke="#dc2626" strokeWidth={sw} />
        {icon && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={fontSize * 0.7}>{icon}</text>}
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
        {icon
          ? <text x={cx} y={cy + r * 0.15} textAnchor="middle" dominantBaseline="central" fontSize={fontSize * 0.55}>{icon}</text>
          : <text x={cx} y={cy + r * 0.15} textAnchor="middle" dominantBaseline="central" fontSize={fontSize * 0.7} fontWeight="bold" fill="#1e293b">!</text>
        }
      </svg>
    )
  }

  if (signType === 'emergency') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <rect x={1} y={1} width={size - 2} height={size - 2} rx={size * 0.05} fill="#16a34a" />
        {icon && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={fontSize}>{icon}</text>}
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <rect x={1} y={1} width={size - 2} height={size - 2} rx={size * 0.05} fill="#94a3b8" />
      {icon && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={fontSize}>{icon}</text>}
    </svg>
  )
}

export function IsoSign({
  code,
  icon,
  signType,
  size = 44,
}: {
  code?: string
  icon?: string
  signType: SignType
  size?: number
}) {
  const [failed, setFailed] = useState(false)

  if (!code || failed) {
    return <SignShell signType={signType} size={size} icon={icon} />
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
