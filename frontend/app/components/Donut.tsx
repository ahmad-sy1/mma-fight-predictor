'use client'

import { useState, useEffect } from 'react'

interface Props {
  pct: number
  color?: string
  size?: number
  stroke?: number
  label?: string
}

export default function Donut({ pct, color = 'var(--accent)', size = 56, stroke = 6, label }: Props) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDisplay(pct), 60)
    return () => clearTimeout(t)
  }, [pct])

  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - display / 100)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: 'var(--ink)',
      }}>
        {label ?? `${Math.round(display)}%`}
      </div>
    </div>
  )
}
