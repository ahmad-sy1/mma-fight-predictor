'use client'

import { useState, useEffect } from 'react'
import { Fighter } from '../types'
import Donut from './Donut'
import { API_URL } from '../lib/constants'
import { heightFmt } from '../lib/utils'

// ─── Sub-components ──────────────────────────────────────────────────────────

function FighterAvatar({ fighter, isRed, loading }: { fighter: Fighter | null; isRed: boolean; loading: boolean }) {
  const initials = fighter
    ? fighter.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className={`w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-xl font-extrabold border-2 ${
      fighter
        ? isRed
          ? 'bg-accent-soft border-accent text-accent'
          : 'bg-blue-soft border-blue text-blue'
        : 'bg-[#f0f0ec] border-line text-ink-mute'
    }`}>
      {loading ? (
        <div className={`w-5 h-5 border-[2.5px] border-line rounded-full animate-spin ${isRed ? 'border-t-accent' : 'border-t-blue'}`} />
      ) : initials}
    </div>
  )
}

function RecordStrip({ fighter }: { fighter: Fighter | null }) {
  const stats: [string, string | number | undefined][] = [
    ['REC',   fighter?.record],
    ['AGE',   fighter?.age],
    ['HT',    fighter?.heightCms ? heightFmt(fighter.heightCms) : undefined],
    ['REACH', fighter?.reachCms  ? `${(fighter.reachCms / 2.54).toFixed(0)}"` : undefined],
  ]

  return (
    <div className="grid grid-cols-4 gap-px bg-line rounded-md overflow-hidden">
      {stats.map(([k, v]) => (
        <div key={k} className="bg-surface p-2 text-center">
          <div className={`text-sm font-extrabold ${fighter ? 'text-ink' : 'text-ink-mute'}`}>{v ?? '—'}</div>
          <div className="text-[9px] font-bold tracking-[0.14em] text-ink-dim mt-0.5">{k}</div>
        </div>
      ))}
    </div>
  )
}

function StreakBanner({ fighter, isRed }: { fighter: Fighter; isRed: boolean }) {
  const stats: [number, string][] = [
    [fighter.winStreak, 'WIN STREAK'],
    [fighter.koWins,    'KO WINS'],
    [fighter.subWins,   'SUB WINS'],
  ]

  return (
    <div className="grid grid-cols-3 gap-2 bg-section border border-line px-3 py-2.5 rounded-md">
      {stats.map(([n, l]) => (
        <div key={l} className="flex items-baseline gap-[5px]">
          <span className={`text-lg font-extrabold ${isRed ? 'text-accent' : 'text-blue'}`}>{n}</span>
          <span className="text-[9.5px] font-bold tracking-[0.1em] text-ink-dim">{l}</span>
        </div>
      ))}
    </div>
  )
}

function AccuracyDonuts({ fighter, isRed }: { fighter: Fighter; isRed: boolean }) {
  const items = [
    { pct: fighter.sigStrAcc, label: 'STRIKING ACC', sub: `${fighter.avgSigStr.toFixed(1)}/min` },
    { pct: fighter.tdAcc,     label: 'TAKEDOWN ACC', sub: `${fighter.avgTD.toFixed(1)}/15min` },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(({ pct, label, sub }) => (
        <div key={label} className={`border border-line rounded-md p-2.5 flex items-center gap-2.5 ${isRed ? 'text-accent' : 'text-blue'}`}>
          <Donut pct={pct} />
          <div>
            <div className="text-[10px] font-extrabold tracking-[0.1em] text-ink-dim">{label}</div>
            <div className="text-[11px] text-ink-mute mt-0.5">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatTiles({ fighter }: { fighter: Fighter }) {
  const tiles = [
    { label: 'WIN RATE',      value: `${fighter.winRate}%` },
    { label: 'SUB ATT / 15M', value: String(fighter.avgSubAtt) },
    { label: 'KO WINS',       value: String(fighter.koWins) },
    { label: 'DEC WINS',      value: String(fighter.decWins) },
  ]

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {tiles.map(({ label, value }) => (
        <div key={label} className="px-3 py-2.5 bg-section border border-line rounded-md">
          <div className="text-lg font-extrabold text-ink leading-[1.1]">{value}</div>
          <div className="text-[9.5px] font-bold tracking-[0.1em] text-ink-dim mt-[3px]">{label}</div>
        </div>
      ))}
    </div>
  )
}

function DetailList({ fighter }: { fighter: Fighter }) {
  const rows: [string, string | number | undefined][] = [
    ['Total rounds',       fighter.totalRounds ?? '—'],
    ['Title bouts',        fighter.titleBouts],
    ['Longest win streak', fighter.longestWinStreak],
    ['Weight class',       fighter.weightClass],
    ['Stance',             fighter.stance ?? '—'],
  ]

  return (
    <div>
      {rows.map(([k, v]) => (
        <div key={String(k)} className="flex justify-between py-[7px] border-b border-line text-[13px]">
          <span className="text-ink-dim">{k}</span>
          <span className="font-bold">{v}</span>
        </div>
      ))}
    </div>
  )
}

function WinMethodBar({ fighter, isRed }: { fighter: Fighter; isRed: boolean }) {
  const colorClass = isRed ? 'bg-accent' : 'bg-blue'
  return (
    <div>
      <div className="text-[10px] font-extrabold tracking-[0.14em] text-ink-dim mb-1.5">WIN BY METHOD</div>
      <div className="flex h-2 rounded overflow-hidden bg-line">
        {fighter.wins > 0 && (
          <>
            <div className={colorClass} style={{ width: `${(fighter.koWins  / fighter.wins) * 100}%` }} />
            <div className={`${colorClass} opacity-60`} style={{ width: `${(fighter.subWins / fighter.wins) * 100}%` }} />
            <div className={`${colorClass} opacity-30`} style={{ width: `${(fighter.decWins / fighter.wins) * 100}%` }} />
          </>
        )}
      </div>
      <div className="flex justify-between mt-1.5 text-[10.5px] text-ink-dim">
        <span>KO <b className="text-ink">{fighter.koWins}</b></span>
        <span>SUB <b className="text-ink">{fighter.subWins}</b></span>
        <span>DEC <b className="text-ink">{fighter.decWins}</b></span>
      </div>
    </div>
  )
}

function Autocomplete({ suggestions, onSelect }: { suggestions: string[]; onSelect: (name: string) => void }) {
  if (suggestions.length === 0) return null
  return (
    <div className="absolute top-full left-0 right-0 z-40 bg-surface border border-line rounded-lg mt-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)] max-h-[220px] overflow-y-auto">
      {suggestions.map(name => (
        <div
          key={name}
          onMouseDown={() => onSelect(name)}
          className="px-3.5 py-[9px] cursor-pointer text-sm font-semibold text-ink border-b border-line hover:bg-bg transition-colors duration-100"
        >
          {name}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

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

  return (
    <div className="bg-surface shadow-card rounded-xl p-5 flex flex-col gap-4">
      {/* Avatar + input row */}
      <div className="flex items-center gap-3">
        <FighterAvatar fighter={fighter} isRed={isRed} loading={loading} />

        <div className="flex-1 relative">
          <div className={`text-[10px] font-extrabold tracking-[0.18em] mb-1 ${isRed ? 'text-accent' : 'text-blue'}`}>
            {label}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) onCommit('') }}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 180)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onCommit(query) } }}
              placeholder="Fighter name"
              className="flex-1 border-0 text-lg font-bold bg-transparent text-ink pb-1"
              style={{
                borderBottom: `1.5px solid ${
                  fighter
                    ? isRed ? 'var(--color-accent)' : 'var(--color-blue)'
                    : 'var(--color-line-strong)'
                }`,
              }}
            />
            {fighter && (
              <button
                onClick={() => { setQuery(''); onCommit('') }}
                className="bg-transparent border-0 cursor-pointer text-ink-mute text-lg leading-none px-0.5"
              >×</button>
            )}
          </div>

          {focus && (
            <Autocomplete
              suggestions={suggestions}
              onSelect={name => { onCommit(name); setSuggestions([]) }}
            />
          )}
        </div>
      </div>

      <RecordStrip fighter={fighter} />

      {!fighter && (
        <div className="py-4 text-center text-ink-dim text-[13px]">
          Start typing a fighter name to load stats
        </div>
      )}

      {fighter && (
        <>
          <StreakBanner fighter={fighter} isRed={isRed} />
          <AccuracyDonuts fighter={fighter} isRed={isRed} />
          <StatTiles fighter={fighter} />
          <DetailList fighter={fighter} />
          <WinMethodBar fighter={fighter} isRed={isRed} />
        </>
      )}
    </div>
  )
}
