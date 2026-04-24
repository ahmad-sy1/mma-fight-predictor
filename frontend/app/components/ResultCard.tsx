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
    const t = setTimeout(() => setBar(confidence), 100)
    return () => clearTimeout(t)
  }, [confidence])

  return (
    <div style={{
      border: '2px solid #0a0a0a',
      background: '#fff',
      animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
    }}>
      {/* Top bar */}
      <div style={{
        background: '#0a0a0a',
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 13,
          letterSpacing: '0.2em',
          color: '#fff',
          opacity: 0.6,
        }}>ORACLE VERDICT</span>
        <button
          onClick={onReset}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer', fontSize: 11,
            fontWeight: 600, letterSpacing: '0.1em',
            padding: '4px 12px',
          }}
        >RESET</button>
      </div>

      <div style={{ padding: '40px 32px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48 }}>
        {/* LEFT — Winner */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#aaa', marginBottom: 8 }}>
            PREDICTED WINNER
          </div>
          <div style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 72,
            lineHeight: 0.9,
            letterSpacing: '0.02em',
            color: '#0a0a0a',
            marginBottom: 12,
          }}>
            {winner.name.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <span style={{
              background: winner.corner === 'red' ? 'var(--red)' : '#0a0a0a',
              color: '#fff', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', padding: '4px 10px',
            }}>
              {winner.corner === 'red' ? 'RED' : 'BLUE'} CORNER
            </span>
            <span style={{ fontSize: 13, color: '#6b6b6b', fontWeight: 500 }}>
              defeats {loser.name}
            </span>
          </div>

          {/* Confidence meter */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#aaa' }}>
                MODEL CONFIDENCE
              </span>
              <span style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 48,
                lineHeight: 1,
                color: 'var(--red)',
                letterSpacing: '0.04em',
              }}>
                {confidence.toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${bar}%`,
                background: 'var(--red)',
                borderRadius: 4,
                transition: 'width 1200ms cubic-bezier(.2,.8,.2,1)',
              }}/>
            </div>
          </div>

          {/* Method + Round */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#e5e5e5', border: '1px solid #e5e5e5' }}>
            {[['METHOD', method], ['ROUND', round]].map(([k, v]) => (
              <div key={k} style={{ background: '#fff', padding: '16px 20px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#aaa', marginBottom: 4 }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 26, letterSpacing: '0.04em', color: '#0a0a0a' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Factors + Tale of Tape */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#aaa', marginBottom: 14 }}>
              DECIDING FACTORS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {factors.map((f, i) => (
                <div key={f.label} style={{
                  padding: '14px 16px',
                  border: i === 0 ? '2px solid var(--red)' : '1px solid #e5e5e5',
                  background: i === 0 ? '#fef2f2' : '#fff',
                  animation: `fadeUp 400ms ${150 + i * 100}ms both`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 2 }}>{f.sub}</div>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: 20,
                      color: i === 0 ? 'var(--red)' : '#0a0a0a',
                      letterSpacing: '0.04em',
                    }}>+{f.delta.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tale of tape */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#aaa', marginBottom: 10 }}>
              TALE OF THE TAPE
            </div>
            <div style={{ border: '1px solid #e5e5e5' }}>
              {[
                ['REACH', `${(winner.reachCms / 2.54).toFixed(0)}"`, `${(loser.reachCms / 2.54).toFixed(0)}"`],
                ['RECORD', winner.record, loser.record],
                ['STANCE', winner.stance, loser.stance],
                ['AGE', String(winner.age), String(loser.age)],
              ].map(([k, a, b], i) => (
                <div key={k} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  padding: '10px 14px',
                  borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none',
                  alignItems: 'center',
                  fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: 'var(--red)', textAlign: 'right' }}>{a}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#aaa', padding: '0 14px' }}>{k}</span>
                  <span style={{ color: '#6b6b6b' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #f0f0f0',
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.12em', fontWeight: 600 }}>
          RANDOM FOREST · {modelInfo ? `${modelInfo.accuracy}% ACCURACY` : '—'} · NOT BETTING ADVICE
        </span>
        <span style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.12em', fontWeight: 600 }}>
          UFC DATASET · {modelInfo ? `${modelInfo.total_fights.toLocaleString()} FIGHTS` : '—'}
        </span>
      </div>
    </div>
  )
}