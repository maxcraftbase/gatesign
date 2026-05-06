'use client'

import { useState } from 'react'
import { isoSignUrl, type SignType } from '@/lib/safety-rules'

function CctvSign({ size }: { size: number }) {
  const s = size
  const rx = s * 0.1
  const textH = s * 0.26
  const camArea = s - textH
  const armW = s * 0.06
  const armH = camArea * 0.28
  const armX = s * 0.5 - armW / 2
  const armY = camArea * 0.04
  const bY = armY + armH
  const bodyH = camArea * 0.32
  const backW = s * 0.22
  const frontW = s * 0.32
  const backX = s * 0.5 - backW / 2
  const frontX = s * 0.5 - frontW / 2 + s * 0.08
  const lensX = frontX + frontW * 0.18
  const lensY = bY + bodyH * 0.6
  const lensR = s * 0.075

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
      <rect x={0} y={0} width={s} height={s} rx={rx} fill="#1a5fa8" />
      <rect x={armX} y={armY} width={armW} height={armH} rx={armW * 0.3} fill="white" />
      <rect x={s * 0.32} y={armY + armH - armW * 0.5} width={s * 0.36} height={armW * 0.9} rx={armW * 0.3} fill="white" />
      <polygon points={`${backX},${bY} ${backX + backW},${bY} ${frontX + frontW},${bY + bodyH} ${frontX},${bY + bodyH}`} fill="white" />
      <circle cx={lensX} cy={lensY} r={lensR} fill="#1a5fa8" />
      <circle cx={lensX} cy={lensY} r={lensR * 0.58} fill="white" opacity={0.6} />
      <rect x={0} y={s - textH} width={s} height={textH} rx={0} fill="#1a5fa8" />
      <rect x={0} y={s - textH} width={s} height={1.5} fill="white" opacity={0.4} />
      <text x={s * 0.5} y={s - textH * 0.38} textAnchor="middle" dominantBaseline="central" fontSize={s * 0.115} fontWeight="bold" fontFamily="Arial,sans-serif" fill="white" letterSpacing={s * -0.003}>Videoüberwacht</text>
    </svg>
  )
}

function EngineOffSign({ size }: { size: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1
  const border = r * 0.28
  const innerR = r - border * 2  // actual usable radius inside the prohibition ring

  // Car body (facing right, exhaust on left)
  const carW = innerR * 1.05
  const carH = innerR * 0.42
  const carX = cx - carW / 2 + innerR * 0.06
  const carY = cy + innerR * 0.08

  // Roof
  const roofW = carW * 0.5
  const roofH = carH * 0.5
  const roofX = carX + carW * 0.24
  const roofY = carY - roofH * 0.82

  // Exhaust pipe
  const exH = carH * 0.18
  const exW = innerR * 0.18
  const exX = carX - exW + 2
  const exY = carY + carH - exH * 1.5

  // Smoke puffs (3 circles)
  const smokeX = exX - innerR * 0.04
  const smokeY = exY + exH * 0.5
  const sr = innerR * 0.1

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* White fill circle */}
      <circle cx={cx} cy={cy} r={r} fill="white" />

      {/* Car body */}
      <rect x={carX} y={carY} width={carW} height={carH} rx={carH * 0.15} fill="#1e1e1e" />
      {/* Roof */}
      <rect x={roofX} y={roofY} width={roofW} height={roofH + carH * 0.15} rx={roofH * 0.2} fill="#1e1e1e" />
      {/* Windows (lighter cutouts) */}
      <rect x={roofX + roofW * 0.08} y={roofY + roofH * 0.12} width={roofW * 0.37} height={roofH * 0.65} rx={roofH * 0.1} fill="white" opacity={0.35} />
      <rect x={roofX + roofW * 0.54} y={roofY + roofH * 0.12} width={roofW * 0.35} height={roofH * 0.65} rx={roofH * 0.1} fill="white" opacity={0.35} />
      {/* Exhaust pipe */}
      <rect x={exX} y={exY} width={exW} height={exH} rx={exH * 0.3} fill="#1e1e1e" />
      {/* Smoke puffs */}
      <circle cx={smokeX - sr * 0.3} cy={smokeY - sr * 0.4} r={sr * 0.9} fill="none" stroke="#555" strokeWidth={size * 0.025} />
      <circle cx={smokeX - sr * 1.5} cy={smokeY - sr * 1.1} r={sr * 1.1} fill="none" stroke="#555" strokeWidth={size * 0.022} />
      <circle cx={smokeX - sr * 2.9} cy={smokeY - sr * 1.6} r={sr * 1.3} fill="none" stroke="#555" strokeWidth={size * 0.02} />

      {/* Red prohibition ring — circleR inset by half ringW so outer edge = r */}
      <circle cx={cx} cy={cy} r={r - border} fill="none" stroke="#dc2626" strokeWidth={border * 2} />
      {/* Red diagonal line */}
      <line
        x1={cx - r * 0.62} y1={cy - r * 0.62}
        x2={cx + r * 0.62} y2={cy + r * 0.62}
        stroke="#dc2626" strokeWidth={border * 1.6}
      />
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
    const ringW = r * 0.3
    const circleR = r - ringW / 2  // outer edge lands exactly at r
    const innerR = r - ringW       // usable white area radius
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="white" />
        <circle cx={cx} cy={cy} r={circleR} fill="none" stroke="#dc2626" strokeWidth={ringW} />
        <text
          x={cx} y={cy + innerR * 0.06}
          textAnchor="middle" dominantBaseline="central"
          fontSize={innerR * 1.55} fontWeight="900"
          fontFamily="Arial Black,Arial,sans-serif" fill="#111"
        >5</text>
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
        <line x1={cx - r * 0.58} y1={cy - r * 0.58} x2={cx + r * 0.58} y2={cy + r * 0.58} stroke="#dc2626" strokeWidth={sw} />
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

  if (code === 'ENGINE_OFF') {
    return <EngineOffSign size={size} />
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
