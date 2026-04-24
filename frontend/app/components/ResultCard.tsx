'use client'

import { useState, useEffect } from 'react'
import { ModelInfo, PredictionResult } from '../types'

interface Props {
  result: PredictionResult
  modelInfo: ModelInfo | null
  onReset: () => void
}

export default function ResultCard({ result, modelInfo, onReset }: Props) {
  const { winner, loser, confidence, factors, method, round } = result
  const [bar, setBar] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setBar(confidence), 120)
    return () => clearTimeout(t)
  }, [confidence])

  const winnerColor = winner.corner === 'red' ? 'var(--accent)' : 'var(--blue)'

  return (
    <div style={{
      marginTop: 24,
      background: 'var(--surface)',
      boxShadow: 'var(--card-shadow)',
      borderRadius: 12,
      padding: 28,
      animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: winnerColor, marginBottom: 6 }}>
        PREDICTION
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>
        {winner.name}{' '}
        <span style={{ color: 'var(--ink-dim)', fontWeight: 500, fontSize: 17 }}>
          defeats {loser.name}
        </span>
      </div>

      {/* Confidence */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-dim)', fontWeight: 500 }}>Confidence</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: winnerColor }}>{confidence.toFixed(1)}%</span>
        </div>
        <div style={{ height: 10, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${bar}%`, background: winnerColor,
            borderRadius: 6, transition: 'width 900ms cubic-bezier(.2,.8,.2,1)',
          }} />
        </div>
      </div>

      {/* Method + Round */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
        {[['Method', method], ['Est. Round', round]].map(([k, v]) => (
          <div key={k} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--ink-dim)', marginBottom: 4 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Deciding factors */}
      <div style={{ marginTop: 26 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-dim)', marginBottom: 10 }}>
          TOP DECIDING FACTORS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {factors.map((f, i) => (
            <div key={f.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', background: 'var(--bg)', borderRadius: 8,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i === 0 ? winnerColor : 'var(--line-strong)',
                  color: i === 0 ? 'white' : 'var(--ink-dim)',
                  fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                <span>
                  <span style={{ fontWeight: 600, display: 'block', fontSize: 13 }}>{f.label}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{f.sub}</span>
                </span>
              </span>
              <span style={{ fontWeight: 700, color: winnerColor, fontSize: 14 }}>
                +{f.delta.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button
          onClick={onReset}
          style={{
            padding: '8px 14px', background: 'transparent',
            border: '1px solid var(--line-strong)', borderRadius: 8,
            color: 'var(--ink-dim)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >← New prediction</button>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
          Random Forest · {modelInfo ? `${modelInfo.accuracy}% acc` : '—'} · {modelInfo ? `${modelInfo.total_fights.toLocaleString()} fights` : '—'}
        </span>
      </div>
    </div>
  )
}