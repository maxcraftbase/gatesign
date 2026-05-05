'use client'

import { useState } from 'react'
import { isoSignUrl, type SignType } from '@/lib/safety-rules'

function CameraSign({ size }: { size: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1
  const sw = Math.max(1.5, size * 0.05)
  const topX = cx, topY = cy - r
  const blX = cx - r * 0.866, blY = cy + r * 0.5
  const brX = cx + r * 0.866, brY = cy + r * 0.5

  // Camera positioned in lower portion of triangle interior
  const camCy = cy + r * 0.12
  const camW = r * 0.88
  const camH = r * 0.44
  const camX = cx - camW / 2
  const camY = camCy - camH / 2
  const lensR = camH * 0.32
  const bumpW = camW * 0.28
  const bumpH = camH * 0.28

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <polygon
        points={`${topX},${topY} ${blX},${blY} ${brX},${brY}`}
        fill="#facc15" stroke="#1e293b" strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* Viewfinder bump */}
      <rect
        x={cx - bumpW / 2} y={camY - bumpH * 0.6}
        width={bumpW} height={bumpH + 2}
        rx={bumpH * 0.3} fill="#1e293b"
      />
      {/* Camera body */}
      <rect x={camX} y={camY} width={camW} height={camH} rx={camH * 0.18} fill="#1e293b" />
      {/* Lens ring */}
      <circle cx={cx} cy={camCy} r={lensR} fill="#facc15" />
      {/* Lens */}
      <circle cx={cx} cy={camCy} r={lensR * 0.58} fill="#1e293b" />
      {/* Lens shine */}
      <circle cx={cx - lensR * 0.28} cy={camCy - lensR * 0.28} r={lensR * 0.18} fill="#ffffff88" />
    </svg>
  )
}

function SignShell({ signType, size, icon }: { signType: SignType; size: number; icon?: string }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1
  const sw = Math.max(2, size * 0.09)
  const fontSize = size * 0.5

  if (signType === 'limit') {
    const innerR = r - sw * 0.9
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="white" stroke="#dc2626" strokeWidth={sw * 1.6} />
        <text
          x={cx} y={cy - size * 0.06}
          textAnchor="middle" dominantBaseline="central"
          fontSize={innerR * 0.72} fontWeight="900"
          fontFamily="Arial Black,Arial,sans-serif" fill="#111"
        >5</text>
        <text
          x={cx} y={cy + size * 0.22}
          textAnchor="middle" dominantBaseline="central"
          fontSize={innerR * 0.34} fontWeight="bold"
          fontFamily="Arial,sans-serif" fill="#111"
        >km/h</text>
      </svg>
    )
  }

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

  if (signType === 'limit') {
    return <SignShell signType="limit" size={size} />
  }

  if (code === 'CAMERA') {
    return <CameraSign size={size} />
  }

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
