'use client'

import { useState, useEffect } from 'react'
import { Fighter } from '../types'

const API_URL = 'http://localhost:8000'

function formatHeight(cm: number): string {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
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

  const isRed = corner === 'red'
  const label = isRed ? 'FIGHTER A' : 'FIGHTER B'
  const cornerLabel = isRed ? 'RED CORNER' : 'BLUE CORNER'

  // Debounced autocomplete
  useEffect(() => {
    if (!query || fighter || query.length < 2) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/fighters?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.fighters ?? [])
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fighter])

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    }}>
      {/* Corner label */}
      <div style={{
        background: isRed ? 'var(--red)' : '#0a0a0a',
        color: '#fff',
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 13,
          letterSpacing: '0.16em',
        }}>{label}</span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.2em',
          opacity: 0.7,
        }}>{cornerLabel}</span>
      </div>

      {/* Search input */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e5e5e5', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {loading ? (
            <div style={{
              width: 16, height: 16, flexShrink: 0,
              border: '2px solid #e5e5e5',
              borderTopColor: 'var(--red)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}/>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fighter ? 'var(--red)' : '#aaa'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
            </svg>
          )}
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value) onCommit('') }}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 180)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onCommit(query) } }}
            placeholder={isRed ? 'Search fighter...' : 'Search fighter...'}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 28,
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.04em',
              color: '#0a0a0a',
              background: 'transparent',
              textTransform: 'uppercase',
            }}
          />
          {fighter && (
            <button
              onClick={() => { setQuery(''); onCommit('') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#aaa', fontSize: 18, lineHeight: 1, padding: 4,
              }}
            >×</button>
          )}
        </div>

        {/* Dropdown */}
        {focus && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#fff', border: '2px solid #0a0a0a', borderTop: 'none',
            zIndex: 40, maxHeight: 240, overflowY: 'auto',
          }}>
            {suggestions.map(name => (
              <div
                key={name}
                onMouseDown={() => { onCommit(name); setSuggestions([]) }}
                style={{
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fef2f2'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fighter stats */}
      <div style={{ padding: '20px', flex: 1, minHeight: 180 }}>
        {fighter ? (
          <div>
            {/* Record + weight class */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{
                background: isRed ? 'var(--red)' : '#0a0a0a',
                color: '#fff',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '4px 10px',
              }}>{fighter.record}</span>
              <span style={{
                background: '#f5f5f5',
                color: '#0a0a0a',
                fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                border: '1px solid #e5e5e5',
              }}>{fighter.weightClass.toUpperCase()}</span>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#e5e5e5', border: '1px solid #e5e5e5' }}>
              {[
                ['AGE',    fighter.age.toString()],
                ['REACH',  `${(fighter.reachCms / 2.54).toFixed(0)}"`],
                ['HEIGHT', formatHeight(fighter.heightCms)],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#fff', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#aaa', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 22, color: '#0a0a0a', letterSpacing: '0.04em' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Stat bars */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Win Rate', value: `${fighter.winRate}%`, bar: fighter.winRate / 100 },
                { label: 'Avg Strikes', value: fighter.avgSigStr.toFixed(1), bar: Math.min(fighter.avgSigStr / 8, 1) },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b6b6b', letterSpacing: '0.06em' }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0a0a0a' }}>{s.value}</span>
                  </div>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${s.bar * 100}%`,
                      background: isRed ? 'var(--red)' : '#0a0a0a',
                      borderRadius: 2,
                      transition: 'width 600ms cubic-bezier(.2,.8,.2,1)',
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.3,
          }}>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 48, letterSpacing: '0.04em', color: '#0a0a0a' }}>?</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#6b6b6b' }}>SEARCH A FIGHTER</div>
          </div>
        )}
      </div>
    </div>
  )
}