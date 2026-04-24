'use client'

import { useState, useEffect } from 'react'
import { Fighter } from '../types'
import Donut from './Donut'

const API_URL = 'http://localhost:8000'

function heightFmt(cms: number) {
  const totalIn = cms / 2.54
  return `${Math.floor(totalIn / 12)}'${Math.round(totalIn % 12)}"`
}

interface Props {
  corner: 'red' | 'blue'
  fighter: Fighter | null
  query: string
  setQuery: (q: string) => void
  onCommit: (name: string) => void
  loading: boolean
}

export default function FighterSearch({ corner, fighter, query, setQuery, onCommit, loading }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [focus, setFocus] = useState(false)

  const color     = corner === 'red' ? 'var(--accent)' : 'var(--blue)'
  const colorSoft = corner === 'red' ? 'var(--accent-soft)' : 'var(--blue-soft)'
  const label     = corner === 'red' ? 'FIGHTER A' : 'FIGHTER B'

  useEffect(() => {
    if (!query || fighter || query.length < 2) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/fighters?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.fighters ?? [])
      } catch { setSuggestions([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fighter])

  const initials = fighter
    ? fighter.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      background: 'var(--surface)',
      boxShadow: 'var(--card-shadow)',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Avatar + input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: fighter ? colorSoft : '#f0f0ec',
          border: `2px solid ${fighter ? color : 'var(--line)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800,
          color: fighter ? color : 'var(--ink-mute)',
        }}>
          {loading ? (
            <div style={{
              width: 20, height: 20,
              border: '2.5px solid var(--line)',
              borderTopColor: color,
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
          ) : initials}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) onCommit('') }}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 180)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onCommit(query) } }}
              placeholder="Fighter name"
              style={{
                flex: 1,
                border: 'none',
                borderBottom: `1.5px solid ${fighter ? color : 'var(--line-strong)'}`,
                fontSize: 18, fontWeight: 700,
                background: 'transparent', color: 'var(--ink)',
                paddingBottom: 4,
              }}
            />
            {fighter && (
              <button
                onClick={() => { setQuery(''); onCommit('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--ink-mute)', fontSize: 18, lineHeight: 1, padding: '0 2px',
                }}
              >×</button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {focus && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40,
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 8, marginTop: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              maxHeight: 220, overflowY: 'auto',
            }}>
              {suggestions.map(name => (
                <div
                  key={name}
                  onMouseDown={() => { onCommit(name); setSuggestions([]) }}
                  style={{
                    padding: '9px 14px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                    borderBottom: '1px solid var(--line)',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
        background: 'var(--line)', borderRadius: 6, overflow: 'hidden',
      }}>
        {[
          ['REC',   fighter?.record ?? '—'],
          ['AGE',   fighter?.age ?? '—'],
          ['HT',    fighter ? heightFmt(fighter.heightCms) : '—'],
          ['REACH', fighter ? `${(fighter.reachCms / 2.54).toFixed(0)}"` : '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--surface)', padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: fighter ? 'var(--ink)' : 'var(--ink-mute)' }}>{v}</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--ink-mute)', marginTop: 2 }}>{k}</div>
          </div>
        ))}
      </div>

      {!fighter && (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
          Start typing a fighter name to load stats
        </div>
      )}

      {fighter && (
        <>
          {/* Streak banner */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
            background: 'var(--bg)', padding: '10px 12px', borderRadius: 6,
          }}>
            {[
              [fighter.winStreak, 'WIN STREAK'],
              [fighter.koWins,    'KO WINS'],
              [fighter.subWins,   'SUB WINS'],
            ].map(([n, l]) => (
              <div key={String(l)} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color }}>{n}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-dim)' }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Accuracy donuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { pct: fighter.sigStrAcc, label: 'STRIKING ACC', sub: `${fighter.avgSigStr.toFixed(1)}/min` },
              { pct: fighter.tdAcc,     label: 'TAKEDOWN ACC', sub: `${fighter.avgTD.toFixed(1)}/15min` },
            ].map(({ pct, label: lbl, sub }) => (
              <div key={lbl} style={{
                border: '1px solid var(--line)', borderRadius: 6, padding: 10,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Donut pct={pct} color={color} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--ink-dim)' }}>{lbl}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'WIN RATE',      value: `${fighter.winRate}%` },
              { label: 'SUB ATT / 15M', value: String(fighter.avgSubAtt) },
              { label: 'KO WINS',       value: String(fighter.koWins) },
              { label: 'DEC WINS',      value: String(fighter.decWins) },
            ].map(({ label: lbl, value }) => (
              <div key={lbl} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-dim)', marginTop: 3 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Detail rows */}
          <div>
            {[
              ['Total rounds',      fighter.totalRounds],
              ['Title bouts',       fighter.titleBouts],
              ['Longest win streak',fighter.longestWinStreak],
              ['Weight class',      fighter.weightClass],
              ['Stance',            fighter.stance],
            ].map(([k, v]) => (
              <div key={String(k)} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '7px 0', borderBottom: '1px solid var(--line)', fontSize: 13,
              }}>
                <span style={{ color: 'var(--ink-dim)' }}>{k}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Win by method bar */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--ink-dim)', marginBottom: 6 }}>
              WIN BY METHOD
            </div>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--line)' }}>
              {fighter.wins > 0 && (
                <>
                  <div style={{ width: `${(fighter.koWins  / fighter.wins) * 100}%`, background: color }} />
                  <div style={{ width: `${(fighter.subWins / fighter.wins) * 100}%`, background: color, opacity: 0.6 }} />
                  <div style={{ width: `${(fighter.decWins / fighter.wins) * 100}%`, background: color, opacity: 0.3 }} />
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: 'var(--ink-dim)' }}>
              <span>KO <b style={{ color: 'var(--ink)' }}>{fighter.koWins}</b></span>
              <span>SUB <b style={{ color: 'var(--ink)' }}>{fighter.subWins}</b></span>
              <span>DEC <b style={{ color: 'var(--ink)' }}>{fighter.decWins}</b></span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
