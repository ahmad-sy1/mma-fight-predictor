'use client'

import { useEffect } from 'react'
import { UpcomingPrediction } from '../types'

interface Props {
  prediction: UpcomingPrediction
  onClose: () => void
}

export default function FightDialog({ prediction, onClose }: Props) {
  const { fight, redFighter, blueFighter, winnerCorner, confidence, factors } = prediction
  const aPct = winnerCorner === 'red' ? confidence : Math.round(100 - confidence)
  const bPct = 100 - aPct
  const winnerColor = winnerCorner === 'red' ? 'var(--accent)' : 'var(--blue)'
  const winnerName  = winnerCorner === 'red' ? redFighter.name : blueFighter.name

  const initials = (name: string) =>
    name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  const rows: [string, string | number, string | number][] = [
    ['Win streak',    redFighter.winStreak,    blueFighter.winStreak],
    ['Reach (cm)',    redFighter.reachCms,     blueFighter.reachCms],
    ['Sig str / min', redFighter.avgSigStr,    blueFighter.avgSigStr],
    ['Str accuracy',  `${redFighter.sigStrAcc}%`, `${blueFighter.sigStrAcc}%`],
    ['TD avg',        redFighter.avgTD,         blueFighter.avgTD],
    ['KO wins',       redFighter.koWins,        blueFighter.koWins],
    ['Sub wins',      redFighter.subWins,       blueFighter.subWins],
    ['Age',           redFighter.age,            blueFighter.age],
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,20,20,0.5)', backdropFilter: 'blur(4px)',
        zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 20px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 14, maxWidth: 720, width: '100%',
          boxShadow: '0 30px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)' }}>
              {fight.event.toUpperCase()} · {fight.card.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 4 }}>
              {fight.date} · {fight.venue}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg)', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: 'var(--ink-dim)',
            }}
          >×</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Fighter avatars + percentages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%', margin: '0 auto',
                background: 'var(--accent-soft)',
                border: `3px solid ${winnerCorner === 'red' ? 'var(--accent)' : 'var(--line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: 'var(--accent)',
              }}>{initials(redFighter.name)}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>{redFighter.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{redFighter.record} · {redFighter.weightClass}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)', marginTop: 6 }}>{aPct}%</div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-mute)' }}>VS</div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%', margin: '0 auto',
                background: 'var(--blue-soft)',
                border: `3px solid ${winnerCorner === 'blue' ? 'var(--blue)' : 'var(--line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: 'var(--blue)',
              }}>{initials(blueFighter.name)}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>{blueFighter.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{blueFighter.record} · {blueFighter.weightClass}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--blue)', marginTop: 6 }}>{bPct}%</div>
            </div>
          </div>

          {/* Split bar */}
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${aPct}%`, background: 'var(--accent)' }} />
            <div style={{ width: `${bPct}%`, background: 'var(--blue)' }} />
          </div>

          {/* Oracle pick */}
          <div style={{
            marginTop: 18, padding: '12px 16px', background: 'var(--bg)', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: winnerColor }}>ORACLE PICK</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {winnerName} by {confidence}% confidence
            </div>
          </div>

          {/* Key comparison */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--ink-dim)', marginBottom: 10 }}>
              KEY COMPARISON
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.map(([label, va, vb]) => (
                <div key={label} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                  gap: 12, alignItems: 'center', fontSize: 13,
                }}>
                  <div style={{ textAlign: 'right', fontWeight: 700 }}>{va}</div>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontWeight: 700 }}>{vb}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Factors */}
          {factors.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--ink-dim)', marginBottom: 10 }}>
                TOP DECIDING FACTORS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {factors.map((f, i) => (
                  <div key={f.label} style={{
                    padding: '12px 14px', background: 'var(--bg)', borderRadius: 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: i === 0 ? winnerColor : 'var(--line-strong)',
                        color: i === 0 ? 'white' : 'var(--ink-dim)',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{f.sub}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: winnerColor }}>+{f.delta.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
