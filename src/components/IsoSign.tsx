'use client'

import { useState } from 'react'
import { isoSignUrl, type SignType } from '@/lib/safety-rules'

function CctvSign({ size }: { size: number }) {
  const s = size
  const rx = s * 0.1
  // Layout: blue square, camera fills upper 68%, text row at bottom 22%
  const textH = s * 0.26
  const camArea = s - textH

  // Ceiling mount arm: thin vertical bar from top center
  const armW = s * 0.06
  const armH = camArea * 0.28
  const armX = s * 0.5 - armW / 2
  const armY = camArea * 0.04

  // Camera body: trapezoid-ish — use a polygon
  // Body sits below the arm, tilted slightly (front lower than back)
  const bY = armY + armH           // top of camera back
  const bodyH = camArea * 0.32
  const backW = s * 0.22
  const frontW = s * 0.32
  const backX = s * 0.5 - backW / 2
  const frontX = s * 0.5 - frontW / 2 + s * 0.08 // shifted right (pointing left-down)

  // Lens: circle at the front-left of body
  const lensX = frontX + frontW * 0.18
  const lensY = bY + bodyH * 0.6
  const lensR = s * 0.075

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
      {/* Blue background */}
      <rect x={0} y={0} width={s} height={s} rx={rx} fill="#1a5fa8" />

      {/* Ceiling mount arm */}
      <rect x={armX} y={armY} width={armW} height={armH} rx={armW * 0.3} fill="white" />

      {/* Horizontal bracket at bottom of arm */}
      <rect
        x={s * 0.32} y={armY + armH - armW * 0.5}
        width={s * 0.36} height={armW * 0.9}
        rx={armW * 0.3} fill="white"
      />

      {/* Camera body (trapezoid pointing left) */}
      <polygon
        points={`
          ${backX},${bY}
          ${backX + backW},${bY}
          ${frontX + frontW},${bY + bodyH}
          ${frontX},${bY + bodyH}
        `}
        fill="white"
      />

      {/* Lens housing (dark circle) */}
      <circle cx={lensX} cy={lensY} r={lensR} fill="#1a5fa8" />
      {/* Lens glass */}
      <circle cx={lensX} cy={lensY} r={lensR * 0.58} fill="white" opacity={0.6} />

      {/* "Videoüberwacht" text */}
      <rect x={0} y={s - textH} width={s} height={textH} rx={0} fill="#1a5fa8" />
      <rect x={0} y={s - textH} width={s} height={1.5} fill="white" opacity={0.4} />
      <text
        x={s * 0.5}
        y={s - textH * 0.38}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={s * 0.115}
        fontWeight="bold"
        fontFamily="Arial,sans-serif"
        fill="white"
        letterSpacing={s * -0.003}
      >Videoüberwacht</text>
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

  if (code === 'CCTV') {
    return <CctvSign size={size} />
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
