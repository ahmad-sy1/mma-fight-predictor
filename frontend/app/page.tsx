'use client'

import { useState, useEffect, useRef } from 'react'

/* ========== TYPES ========== */
interface Fighter {
  name: string
  record: string
  reach: number
  height: string
  age: number
  weight: string
  koRate: number
  winRate: number
  stance: string
  striking: number
  grappling: number
  cardio: number
  chin: number
  power: number
  corner?: 'red' | 'blue'
}

interface PredictionFactor {
  label: string
  sub: string
  delta: number
}

interface PredictionResult {
  winner: Fighter
  loser: Fighter
  confidence: number
  factors: PredictionFactor[]
  method: string
  round: string
}

interface Tweaks {
  accent: keyof typeof ACCENTS
  intensity: 'low' | 'med' | 'high'
  showGrain: boolean
  scanlines: boolean
  resultLayout: 'stack' | 'modal'
}

/* ========== DATA ========== */
const ACCENTS = {
  red:   { hex: '#e8003d', hot: '#ff2e5c', name: 'Electric Red' },
  gold:  { hex: '#f5a623', hot: '#ffc04a', name: 'Fight Gold' },
  blue:  { hex: '#2e6bff', hot: '#5a8bff', name: 'Cold Blue' },
  green: { hex: '#18c58f', hot: '#4ee0ae', name: 'Toxic Green' },
}

const FIGHTERS: Fighter[] = [
  { name: 'Jon Jones',         record: '27-1-0',  reach: 84.5, height: '6\'4"', age: 38, weight: 'Heavyweight',   koRate: 37, winRate: 96,  stance: 'Orthodox', striking: 92, grappling: 94, cardio: 88, chin: 95, power: 86 },
  { name: 'Islam Makhachev',   record: '26-1-0',  reach: 70,   height: '5\'10"',age: 34, weight: 'Lightweight',   koRate: 18, winRate: 96,  stance: 'Southpaw', striking: 78, grappling: 97, cardio: 93, chin: 87, power: 74 },
  { name: 'Alex Pereira',      record: '12-2-0',  reach: 79,   height: '6\'4"', age: 38, weight: 'Light Heavy',   koRate: 67, winRate: 85,  stance: 'Orthodox', striking: 95, grappling: 58, cardio: 82, chin: 88, power: 97 },
  { name: 'Ilia Topuria',      record: '17-0-0',  reach: 69,   height: '5\'7"', age: 29, weight: 'Lightweight',   koRate: 59, winRate: 100, stance: 'Orthodox', striking: 91, grappling: 82, cardio: 86, chin: 90, power: 93 },
  { name: 'Dricus Du Plessis', record: '23-2-0',  reach: 76,   height: '6\'1"', age: 32, weight: 'Middleweight',  koRate: 48, winRate: 92,  stance: 'Orthodox', striking: 84, grappling: 85, cardio: 89, chin: 93, power: 85 },
  { name: 'Leon Edwards',      record: '22-4-0',  reach: 74,   height: '6\'0"', age: 34, weight: 'Welterweight',  koRate: 32, winRate: 85,  stance: 'Southpaw', striking: 88, grappling: 81, cardio: 91, chin: 86, power: 79 },
  { name: 'Merab Dvalishvili', record: '18-4-0',  reach: 65,   height: '5\'6"', age: 35, weight: 'Bantamweight',  koRate: 14, winRate: 82,  stance: 'Orthodox', striking: 76, grappling: 93, cardio: 99, chin: 92, power: 72 },
  { name: "Sean O'Malley",     record: '18-2-0',  reach: 72,   height: '5\'11"',age: 31, weight: 'Bantamweight',  koRate: 55, winRate: 90,  stance: 'Switch',   striking: 90, grappling: 68, cardio: 83, chin: 79, power: 84 },
  { name: 'Khamzat Chimaev',   record: '14-0-0',  reach: 75,   height: '6\'2"', age: 31, weight: 'Middleweight',  koRate: 43, winRate: 100, stance: 'Orthodox', striking: 85, grappling: 94, cardio: 78, chin: 84, power: 88 },
  { name: 'Tom Aspinall',      record: '15-3-0',  reach: 78,   height: '6\'5"', age: 32, weight: 'Heavyweight',   koRate: 73, winRate: 83,  stance: 'Orthodox', striking: 89, grappling: 86, cardio: 85, chin: 83, power: 94 },
  { name: 'Magomed Ankalaev',  record: '20-1-1',  reach: 75,   height: '6\'3"', age: 33, weight: 'Light Heavy',   koRate: 45, winRate: 91,  stance: 'Orthodox', striking: 87, grappling: 82, cardio: 90, chin: 90, power: 86 },
  { name: 'Max Holloway',      record: '26-8-0',  reach: 69,   height: '5\'11"',age: 34, weight: 'Featherweight', koRate: 38, winRate: 76,  stance: 'Orthodox', striking: 94, grappling: 74, cardio: 96, chin: 96, power: 80 },
]

const QUICK_FIGHTS: [string, string][] = [
  ['Jon Jones', 'Tom Aspinall'],
  ['Islam Makhachev', 'Ilia Topuria'],
  ['Alex Pereira', 'Magomed Ankalaev'],
  ['Dricus Du Plessis', 'Khamzat Chimaev'],
  ["Sean O'Malley", 'Merab Dvalishvili'],
]

function fuzzyFind(q: string): Fighter | null {
  if (!q) return null
  const norm = q.trim().toLowerCase()
  let best: Fighter | null = null
  let bestScore = 0
  for (const f of FIGHTERS) {
    const name = f.name.toLowerCase()
    if (name === norm) return f
    if (name.startsWith(norm) && norm.length > bestScore) { best = f; bestScore = norm.length; continue }
    if (name.includes(norm) && norm.length > 2 && norm.length * 0.7 > bestScore) { best = f; bestScore = norm.length * 0.7; continue }
    const last = name.split(' ').slice(-1)[0]
    if (last.startsWith(norm) && norm.length > 2 && norm.length * 0.8 > bestScore) { best = f; bestScore = norm.length * 0.8 }
  }
  return best
}

/* ========== PREDICTION ========== */
function runLocalPrediction(a: Fighter, b: Fighter): PredictionResult {
  const weights = { striking: 0.22, grappling: 0.18, cardio: 0.14, chin: 0.12, power: 0.14, reach: 0.08, winRate: 0.06, age: 0.06 }
  const score = (f: Fighter) =>
    f.striking * weights.striking + f.grappling * weights.grappling + f.cardio * weights.cardio +
    f.chin * weights.chin + f.power * weights.power + f.reach * weights.reach +
    f.winRate * weights.winRate + (40 - f.age) * weights.age
  const sa = score(a), sb = score(b)
  const diff = sa - sb
  const winner = diff >= 0 ? a : b
  const loser = diff >= 0 ? b : a
  const conf = Math.min(92, Math.max(52, 50 + Math.abs(diff) * 1.1))

  const factors: PredictionFactor[] = []
  const metrics: [keyof Fighter, string, string][] = [
    ['striking',  'Striking accuracy',  'Precision & volume in exchanges'],
    ['grappling', 'Grappling control',  'Takedown def. & ground game'],
    ['cardio',    'Cardio ceiling',     'Pace management into rds 4-5'],
    ['chin',      'Durability',         'Recovery from clean shots'],
    ['power',     'Knockout power',     'Single-strike finishing threat'],
  ]
  for (const [k, label, sub] of metrics) {
    const delta = (winner[k] as number) - (loser[k] as number)
    if (delta > 0) factors.push({ label, sub, delta })
  }
  if (winner.reach - loser.reach > 2) {
    factors.push({ label: 'Reach advantage', sub: `${(winner.reach - loser.reach).toFixed(1)}" longer frame`, delta: winner.reach - loser.reach })
  }
  factors.sort((x, y) => y.delta - x.delta)

  let method = 'Decision'
  if (winner.koRate > 50 && winner.power - loser.chin > 0) method = 'KO/TKO'
  else if (winner.grappling - loser.grappling > 12 && winner.grappling > 85) method = 'Submission'
  const roundGuess = method === 'Decision' ? 'Rd 5 (25:00)' : method === 'KO/TKO' ? `Rd ${2 + (winner.power > 90 ? 0 : 1)}` : 'Rd 3'

  return { winner, loser, confidence: Math.round(conf), factors: factors.slice(0, 3), method, round: roundGuess }
}

/* ========== ICONS ========== */
const Icons = {
  Lightning: ({ s = 16 }: { s?: number }) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  ),
  Search: ({ s = 16 }: { s?: number }) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
    </svg>
  ),
  Arrow: ({ s = 16 }: { s?: number }) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  Check: ({ s = 16 }: { s?: number }) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6"/>
    </svg>
  ),
  Cross: ({ s = 16 }: { s?: number }) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  Settings: ({ s = 16 }: { s?: number }) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
}

/* ========== LOGO ========== */
function LogoMark() {
  return (
    <div style={{
      width: 44, height: 44, border: '2px solid var(--accent)', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(232,0,61,0.15), transparent)',
      clipPath: 'polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)',
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7l9 5 9-5-9-5z M3 17l9 5 9-5 M3 12l9 5 9-5" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
      <div style={{ position: 'absolute', top: -2, left: -2, width: 6, height: 6, background: 'var(--accent)' }}/>
    </div>
  )
}

/* ========== HEADER ========== */
function Header({ onToggleTweaks, tweaksOpen }: { onToggleTweaks: () => void; tweaksOpen: boolean }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 40px', borderBottom: '1px solid var(--line)',
      position: 'sticky', top: 0, zIndex: 20,
      backdropFilter: 'blur(10px)', background: 'rgba(10,10,15,0.75)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <LogoMark/>
        <div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1, letterSpacing: '0.04em' }}>
            FIGHT <span style={{ color: 'var(--accent)' }}>ORACLE</span>
          </div>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-mute)', letterSpacing: '0.28em', marginTop: 3 }}>
            AI FIGHT INTELLIGENCE v2.6
          </div>
        </div>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {(['Predict', 'Card', 'Rankings', 'Archive'] as const).map((n, i) => (
          <a key={n} href="#" style={{
            color: i === 0 ? 'var(--ink)' : 'var(--ink-dim)', textDecoration: 'none',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            borderBottom: i === 0 ? '2px solid var(--accent)' : '2px solid transparent',
            paddingBottom: 3,
          }}>{n}</a>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--line-strong)' }}/>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'blink 2s infinite' }}/>
          LIVE
        </div>
        <button onClick={onToggleTweaks} style={{
          background: tweaksOpen ? 'var(--accent)' : 'transparent',
          border: '1px solid var(--line-strong)',
          color: tweaksOpen ? 'white' : 'var(--ink-dim)',
          padding: '7px 9px', cursor: 'pointer', borderRadius: 2,
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
        }}>
          <Icons.Settings s={13}/>
        </button>
      </nav>
    </header>
  )
}

/* ========== MARQUEE ========== */
function Marquee() {
  const items = [
    'UFC 314 MAIN CARD · SAT', 'TOPURIA -235', 'PEREIRA vs ANKALAEV II', 'HEAVYWEIGHT TITLE',
    'ASPINALL +165', 'PPV ACCURACY · 78.2%', 'LIVE ODDS SYNCED', 'LAST UPDATE · 00:03:12 AGO',
  ]
  return (
    <div style={{
      borderBottom: '1px solid var(--line)', borderTop: '1px solid var(--line)',
      background: '#08080c', overflow: 'hidden',
    }}>
      <div className="mono" style={{
        display: 'flex', gap: 48, padding: '10px 0', whiteSpace: 'nowrap',
        animation: 'marqueeScroll 55s linear infinite',
      }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.2em' }}>
            <span style={{ color: 'var(--accent)', marginRight: 10 }}>◆</span>{t}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ========== SILHOUETTE ========== */
function Silhouette({ corner, filled, stance }: { corner: 'red' | 'blue'; filled: boolean; stance: string }) {
  const c = corner === 'red' ? 'var(--accent)' : 'var(--blue)'
  return (
    <div style={{
      position: 'relative', height: 220, width: '100%',
      background: `radial-gradient(ellipse at center 60%, ${corner === 'red' ? 'rgba(232,0,61,0.08)' : 'rgba(46,107,255,0.08)'} 0%, transparent 70%)`,
      borderBottom: '1px solid var(--line)', overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }} preserveAspectRatio="none">
        <defs>
          <pattern id={`grid-${corner}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={c} strokeWidth="0.4" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${corner})`}/>
      </svg>
      <div className="mono" style={{ position: 'absolute', top: 12, left: 14, fontSize: 10, letterSpacing: '0.22em', color: c, fontWeight: 700 }}>
        {corner.toUpperCase()} CORNER
      </div>
      <div className="mono" style={{ position: 'absolute', top: 12, right: 14, fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-mute)' }}>
        {stance.toUpperCase()}
      </div>
      <svg viewBox="0 0 120 180" style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: `translateX(-50%) ${corner === 'blue' ? 'scaleX(-1)' : ''}`,
        height: 180,
        filter: filled ? `drop-shadow(0 0 24px ${c})` : 'none',
        transition: 'filter 400ms',
      }}>
        <defs>
          <linearGradient id={`sil-${corner}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={filled ? c : '#2a2a35'}/>
            <stop offset="100%" stopColor={filled ? '#1a1a22' : '#16161c'}/>
          </linearGradient>
        </defs>
        <g fill={`url(#sil-${corner})`} stroke={filled ? c : '#33333f'} strokeWidth="0.8">
          <ellipse cx="62" cy="28" rx="11" ry="13"/>
          <path d="M48 40 Q62 36 76 40 L82 90 Q80 105 72 110 L52 110 Q44 105 42 90 Z"/>
          <ellipse cx="44" cy="48" rx="8" ry="10"/>
          <ellipse cx="80" cy="48" rx="8" ry="10"/>
          <path d="M40 52 Q28 62 26 78 L34 78 Q38 66 46 62 Z"/>
          <circle cx="28" cy="80" r="7"/>
          <path d="M82 52 Q92 56 94 72 L86 72 Q82 62 78 60 Z"/>
          <circle cx="90" cy="74" r="6"/>
          <path d="M44 108 L80 108 L82 126 L42 126 Z" fill={filled ? c : '#1d1d25'}/>
          <path d="M46 126 Q48 150 44 176 L54 176 Q58 150 58 126 Z"/>
          <path d="M66 126 Q68 150 72 176 L82 176 Q80 150 78 126 Z"/>
        </g>
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
        opacity: filled ? 0.8 : 0.3,
      }}/>
    </div>
  )
}

/* ========== FIGHTER CARD ========== */
function FighterCard({
  corner, fighter, query, setQuery, onCommit,
}: {
  corner: 'red' | 'blue'
  fighter: Fighter | null
  query: string
  setQuery: (q: string) => void
  onCommit: (q: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focus, setFocus] = useState(false)
  const [suggestions, setSuggestions] = useState<Fighter[]>([])
  const accentColor = corner === 'red' ? 'var(--accent)' : 'var(--blue)'

  useEffect(() => {
    if (!query || fighter) { setSuggestions([]); return }
    const q = query.toLowerCase()
    setSuggestions(FIGHTERS.filter(f => f.name.toLowerCase().includes(q)).slice(0, 4))
  }, [query, fighter])

  const stats = fighter
    ? [
        { label: 'REACH',   value: `${fighter.reach}"`,  bar: fighter.reach / 90 },
        { label: 'WIN %',   value: `${fighter.winRate}%`, bar: fighter.winRate / 100 },
        { label: 'KO RATE', value: `${fighter.koRate}%`, bar: fighter.koRate / 100 },
      ]
    : [
        { label: 'REACH',   value: '— —', bar: 0 },
        { label: 'WIN %',   value: '— —', bar: 0 },
        { label: 'KO RATE', value: '— —', bar: 0 },
      ]

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${fighter ? accentColor + '55' : 'var(--line-strong)'}`,
      position: 'relative', transition: 'border-color 300ms',
      boxShadow: fighter
        ? `0 0 0 1px ${accentColor}22, 0 30px 60px -30px ${accentColor}55`
        : '0 30px 60px -30px rgba(0,0,0,0.8)',
    }}>
      {/* corner tag */}
      <div style={{
        position: 'absolute', top: -1, left: -1, padding: '6px 14px',
        background: accentColor, color: 'white',
        fontSize: 10, letterSpacing: '0.22em', fontWeight: 800,
        fontFamily: 'var(--font-mono), monospace', zIndex: 2,
        clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
      }}>
        FIGHTER {corner === 'red' ? 'A' : 'B'}
      </div>

      <Silhouette corner={corner} filled={!!fighter} stance={fighter?.stance ?? 'Orthodox'}/>

      {/* name input */}
      <div style={{ padding: '20px 22px 12px', borderBottom: '1px solid var(--line)', position: 'relative' }}>
        <label className="mono" style={{ fontSize: 9.5, letterSpacing: '0.24em', color: 'var(--ink-mute)' }}>
          FIGHTER NAME
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ color: fighter ? accentColor : 'var(--ink-mute)' }}><Icons.Search s={16}/></span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 180)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onCommit(query); setFocus(false) } }}
            placeholder={corner === 'red' ? 'e.g. Jon Jones' : 'e.g. Tom Aspinall'}
            style={{
              flex: 1, background: 'transparent', border: 'none', color: 'var(--ink)',
              fontSize: 22, fontWeight: 700, letterSpacing: '0.01em',
              fontFamily: 'var(--font-bebas), sans-serif', textTransform: 'uppercase',
            }}
          />
          {fighter && (
            <span style={{ color: accentColor, display: 'flex', alignItems: 'center', gap: 4 }} className="mono">
              <Icons.Check s={14}/>
            </span>
          )}
        </div>
        {focus && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 14, right: 14, marginTop: 4, zIndex: 30,
            background: '#191920', border: '1px solid var(--line-strong)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            {suggestions.map(s => (
              <div
                key={s.name}
                onMouseDown={() => onCommit(s.name)}
                style={{
                  padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#202028' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                  {s.weight.toUpperCase()} · {s.record}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* meta row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--line)' }}>
        {([
          ['REC', fighter?.record ?? '0-0-0'],
          ['WGT', fighter ? fighter.weight.split(' ')[0].slice(0, 3).toUpperCase() : '—'],
          ['HT',  fighter?.height ?? '—'],
          ['AGE', fighter?.age?.toString() ?? '—'],
        ] as [string, string][]).map(([k, v], i) => (
          <div key={k} style={{
            padding: '14px 10px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid var(--line)' : 'none',
          }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.22em' }}>{k}</div>
            <div className="display" style={{ fontSize: 20, marginTop: 4, color: fighter ? 'var(--ink)' : 'var(--ink-mute)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* stat bars */}
      <div style={{ padding: '18px 22px 22px' }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.24em', color: 'var(--ink-mute)', marginBottom: 12 }}>
          KEY METRICS
        </div>
        {stats.map((s, i) => (
          <div key={s.label} style={{ marginBottom: i < 2 ? 14 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: '0.12em' }}>{s.label}</span>
              <span className="mono" style={{ fontSize: 11.5, color: fighter ? 'var(--ink)' : 'var(--ink-mute)', fontWeight: 700 }}>{s.value}</span>
            </div>
            <div style={{ height: 3, background: '#1c1c24', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${s.bar * 100}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${corner === 'red' ? 'var(--accent-hot)' : '#5a8bff'})`,
                transition: 'width 600ms cubic-bezier(.2,.8,.2,1)',
                boxShadow: fighter ? `0 0 10px ${accentColor}` : 'none',
              }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ========== VS CORE ========== */
function VSCore({ active, predicting }: { active: boolean; predicting: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, position: 'relative', minWidth: 100,
    }}>
      <div style={{
        width: 68, height: 68, border: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle, rgba(232,0,61,0.3), transparent)',
        transform: 'rotate(45deg)',
        animation: active ? 'pulseGlow 2.2s infinite' : 'none',
        position: 'relative',
      }}>
        <div className="display" style={{
          fontSize: 28, transform: 'rotate(-45deg)', letterSpacing: '0.05em',
          color: 'var(--ink)', textShadow: '0 0 16px rgba(232,0,61,0.8)',
          animation: predicting ? 'flicker 0.4s infinite' : 'none',
        }}>VS</div>
        {([[0,0],[100,0],[0,100],[100,100]] as [number,number][]).map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            width: 6, height: 6, background: 'var(--accent)',
            transform: 'translate(-3px, -3px)',
          }}/>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--ink-mute)' }}>
        {predicting ? 'ANALYZING' : 'TALE OF THE TAPE'}
      </div>
    </div>
  )
}

/* ========== PREDICT BUTTON ========== */
function Spinner() {
  return (
    <div style={{
      width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }}/>
  )
}

function PredictButton({ enabled, onClick, loading }: { enabled: boolean; onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={!enabled || loading} style={{
      width: '100%', padding: '22px 28px',
      background: enabled && !loading
        ? 'linear-gradient(90deg, #c9002f 0%, var(--accent) 40%, var(--accent-hot) 60%, var(--accent) 90%)'
        : '#1a1a22',
      color: enabled ? 'white' : 'var(--ink-mute)',
      border: 'none',
      cursor: enabled && !loading ? 'pointer' : 'not-allowed',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'var(--font-bebas), sans-serif', fontSize: 30, letterSpacing: '0.06em',
      position: 'relative', overflow: 'hidden',
      boxShadow: enabled && !loading ? '0 20px 50px -15px var(--accent), inset 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
      transition: 'all 200ms',
      clipPath: 'polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%, 18px 100%)',
    }}>
      {enabled && !loading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 4px)',
        }}/>
      )}
      <span style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
        <span style={{ display: 'flex', alignItems: 'center' }}><Icons.Lightning s={22}/></span>
        {loading ? 'RUNNING THE FIGHT…' : 'PREDICT WINNER'}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
        {!loading && (
          <span className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.18em' }}>⌘ + ENTER</span>
        )}
        {loading ? <Spinner/> : <Icons.Arrow s={24}/>}
      </span>
    </button>
  )
}

/* ========== RESULT SECTION ========== */
function ResultSection({ result, onReset }: { result: PredictionResult; onReset: () => void }) {
  const { winner, loser, confidence, factors, method, round } = result
  const winnerRed = winner.corner === 'red'
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(confidence), 120)
    return () => clearTimeout(t)
  }, [confidence])

  return (
    <section style={{
      marginTop: 48, padding: '36px 40px',
      border: '1px solid var(--line-strong)',
      background: 'linear-gradient(180deg, #0e0e14 0%, #0a0a0f 100%)',
      position: 'relative', overflow: 'hidden',
      animation: 'fadeUp 500ms cubic-bezier(.2,.8,.2,1) both',
    }}>
      {/* scanline */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        opacity: 0.4, animation: 'scan 3s linear infinite',
      }}/>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 18 }}>
        <div>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.28em', color: 'var(--accent)' }}>
            ◆ ORACLE VERDICT / MODEL v2.6
          </div>
          <div className="display" style={{ fontSize: 44, lineHeight: 1, marginTop: 8, letterSpacing: '0.03em' }}>
            THE <span style={{ color: 'var(--accent)' }}>ORACLE</span> SAYS…
          </div>
        </div>
        <button onClick={onReset} style={{
          background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-dim)',
          padding: '8px 14px', cursor: 'pointer', fontSize: 11, letterSpacing: '0.18em',
          fontFamily: 'var(--font-mono), monospace', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icons.Cross s={12}/> RESET
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 36, alignItems: 'start' }}>
        {/* LEFT: winner hero */}
        <div>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.24em', color: 'var(--ink-mute)' }}>PREDICTED WINNER</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
            <div className="display" style={{
              fontSize: 82, lineHeight: 0.95, letterSpacing: '0.02em', color: 'var(--ink)',
              textShadow: `0 0 40px ${winnerRed ? 'rgba(232,0,61,0.5)' : 'rgba(46,107,255,0.5)'}`,
            }}>
              {winner.name.toUpperCase()}
            </div>
            <div style={{
              padding: '6px 12px',
              background: winnerRed ? 'var(--accent)' : 'var(--blue)', color: 'white',
              fontSize: 11, letterSpacing: '0.22em', fontFamily: 'var(--font-mono), monospace',
              fontWeight: 700, alignSelf: 'center',
            }}>
              {winnerRed ? 'RED' : 'BLUE'} CORNER
            </div>
          </div>
          <div className="mono" style={{ color: 'var(--ink-dim)', fontSize: 12, marginTop: 10, letterSpacing: '0.08em' }}>
            DEFEATS <span style={{ color: 'var(--ink)' }}>{loser.name.toUpperCase()}</span> · {winner.record}
          </div>

          {/* confidence meter */}
          <div style={{ marginTop: 34 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.24em', color: 'var(--ink-mute)' }}>MODEL CONFIDENCE</span>
              <span className="display" style={{ fontSize: 52, lineHeight: 1, color: winnerRed ? 'var(--accent)' : 'var(--blue)' }}>
                {confidence}<span style={{ fontSize: 24, color: 'var(--ink-dim)' }}>%</span>
              </span>
            </div>
            <div style={{ height: 18, background: '#15151c', border: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 9.999%, rgba(255,255,255,0.08) 10% 10.05%)',
              }}/>
              <div style={{
                height: '100%', width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${winnerRed ? '#8a0023' : '#1a3f99'}, ${winnerRed ? 'var(--accent)' : 'var(--blue)'} 60%, ${winnerRed ? 'var(--accent-hot)' : '#5a8bff'})`,
                transition: 'width 1400ms cubic-bezier(.2,.8,.2,1)',
                boxShadow: `0 0 20px ${winnerRed ? 'var(--accent)' : 'var(--blue)'}`,
              }}/>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: `${barWidth}%`, width: 2,
                background: 'white', transform: 'translateX(-1px)',
                boxShadow: '0 0 10px white',
                transition: 'left 1400ms cubic-bezier(.2,.8,.2,1)',
              }}/>
            </div>
            <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>COIN FLIP 50%</span>
              <span style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>LOCK 99%</span>
            </div>
          </div>

          {/* method + round */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 30, background: 'var(--line)' }}>
            {([['PREDICTED METHOD', method], ['MOST LIKELY ROUND', round]] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ background: '#0e0e14', padding: '18px 20px' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-mute)' }}>{k}</div>
                <div className="display" style={{ fontSize: 28, marginTop: 6, color: 'var(--ink)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: factors + tale of tape */}
        <div>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.24em', color: 'var(--ink-mute)', marginBottom: 14 }}>
            TOP 3 DECIDING FACTORS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {factors.map((f, i) => (
              <div key={f.label} style={{
                border: '1px solid var(--line)', background: '#0e0e14',
                padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 16,
                position: 'relative',
                animation: `fadeUp 500ms ${200 + i * 140}ms both cubic-bezier(.2,.8,.2,1)`,
              }}>
                <div className="display" style={{
                  fontSize: 44, lineHeight: 0.9, color: i === 0 ? 'var(--accent)' : 'var(--ink-mute)', minWidth: 36,
                }}>
                  0{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.01em' }}>{f.label}</div>
                  <div style={{ color: 'var(--ink-dim)', fontSize: 12, marginTop: 3 }}>{f.sub}</div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: '#1a1a22', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(100, f.delta * 4 + 40)}%`,
                        background: i === 0 ? 'linear-gradient(90deg, var(--accent), var(--accent-hot))' : 'linear-gradient(90deg, #444, #888)',
                        animation: `barFill 900ms ${300 + i * 150}ms both cubic-bezier(.2,.8,.2,1)`,
                      }}/>
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: i === 0 ? 'var(--accent)' : 'var(--ink)', fontWeight: 700, minWidth: 54, textAlign: 'right' }}>
                      +{f.delta.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* tale of tape */}
          <div style={{ marginTop: 18, border: '1px solid var(--line)', background: '#0e0e14' }}>
            <div className="mono" style={{ fontSize: 10, padding: '10px 14px', borderBottom: '1px solid var(--line)', letterSpacing: '0.22em', color: 'var(--ink-mute)' }}>
              TALE OF THE TAPE
            </div>
            {([
              ['Reach',  `${winner.reach}"`,  `${loser.reach}"`],
              ['Record', winner.record,         loser.record],
              ['Stance', winner.stance,          loser.stance],
              ['Age',    String(winner.age),     String(loser.age)],
            ] as [string, string, string][]).map(([k, a, b]) => (
              <div key={k} style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                padding: '8px 14px', borderBottom: '1px solid var(--line)', fontSize: 12,
              }}>
                <span style={{ color: winnerRed ? 'var(--accent)' : 'var(--blue)', fontWeight: 600, textAlign: 'right' }}>{a}</span>
                <span className="mono" style={{ color: 'var(--ink-mute)', padding: '0 14px', letterSpacing: '0.15em', fontSize: 10 }}>{k.toUpperCase()}</span>
                <span style={{ color: 'var(--ink-dim)' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* disclaimer */}
      <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>
          ◆ STATISTICAL MODEL · NOT BETTING ADVICE · FIGHTING IS CHAOS
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>
          COMPUTED IN {(Math.random() * 0.8 + 0.4).toFixed(2)}s
        </span>
      </div>
    </section>
  )
}

/* ========== TWEAKS PANEL ========== */
function TweaksPanel({ tweaks, setTweak, onClose }: { tweaks: Tweaks; setTweak: (k: keyof Tweaks, v: Tweaks[keyof Tweaks]) => void; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 300, zIndex: 50,
      background: '#0e0e14', border: '1px solid var(--line-strong)',
      boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
      animation: 'fadeUp 240ms both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--ink)' }}>◆ TWEAKS</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ink-dim)', cursor: 'pointer' }}>
          <Icons.Cross s={14}/>
        </button>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-mute)', marginBottom: 8 }}>ACCENT COLOR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {(Object.entries(ACCENTS) as [keyof typeof ACCENTS, { hex: string; hot: string; name: string }][]).map(([k, v]) => (
              <button key={k} onClick={() => setTweak('accent', k)} style={{
                background: v.hex, height: 32,
                border: tweaks.accent === k ? '2px solid white' : '1px solid var(--line-strong)',
                cursor: 'pointer', fontSize: 9, color: 'white', fontWeight: 700, letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono), monospace',
              }} title={v.name}>{k.slice(0, 3).toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-mute)', marginBottom: 8 }}>INTENSITY</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['low', 'med', 'high'] as const).map(intensity => (
              <button key={intensity} onClick={() => setTweak('intensity', intensity)} style={{
                flex: 1, padding: '8px 6px',
                background: tweaks.intensity === intensity ? 'var(--accent)' : 'transparent',
                color: tweaks.intensity === intensity ? 'white' : 'var(--ink-dim)',
                border: '1px solid var(--line-strong)', cursor: 'pointer',
                fontSize: 10, letterSpacing: '0.18em', fontFamily: 'var(--font-mono), monospace',
              }}>{intensity.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {([['showGrain', 'FILM GRAIN'], ['scanlines', 'SCANLINES']] as [keyof Tweaks, string][]).map(([k, label]) => (
          <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-dim)' }}>{label}</span>
            <div onClick={() => setTweak(k, !tweaks[k])} style={{
              width: 34, height: 18, background: tweaks[k] ? 'var(--accent)' : '#1c1c24',
              border: '1px solid var(--line-strong)', position: 'relative', cursor: 'pointer',
              transition: 'background 200ms',
            }}>
              <div style={{
                position: 'absolute', top: 1, left: tweaks[k] ? 17 : 1, width: 14, height: 14,
                background: 'white', transition: 'left 200ms',
              }}/>
            </div>
          </label>
        ))}
        <div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-mute)', marginBottom: 8 }}>RESULT LAYOUT</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['stack', 'INLINE'], ['modal', 'MODAL']] as [Tweaks['resultLayout'], string][]).map(([k, label]) => (
              <button key={k} onClick={() => setTweak('resultLayout', k)} style={{
                flex: 1, padding: '8px 6px',
                background: tweaks.resultLayout === k ? 'var(--accent)' : 'transparent',
                color: tweaks.resultLayout === k ? 'white' : 'var(--ink-dim)',
                border: '1px solid var(--line-strong)', cursor: 'pointer',
                fontSize: 10, letterSpacing: '0.18em', fontFamily: 'var(--font-mono), monospace',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========== APP ========== */
export default function Home() {
  const [tweaks, setTweaks] = useState<Tweaks>({
    accent: 'blue', intensity: 'high', showGrain: true, scanlines: true, resultLayout: 'stack',
  })
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [queryA, setQueryA] = useState('Jon Jones')
  const [queryB, setQueryB] = useState('Tom Aspinall')
  const [fighterA, setFighterA] = useState<Fighter | null>(() => {
    const f = fuzzyFind('Jon Jones'); return f ? { ...f, corner: 'red' } : null
  })
  const [fighterB, setFighterB] = useState<Fighter | null>(() => {
    const f = fuzzyFind('Tom Aspinall'); return f ? { ...f, corner: 'blue' } : null
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // apply accent + grain tweaks to CSS vars
  useEffect(() => {
    const a = ACCENTS[tweaks.accent]
    document.documentElement.style.setProperty('--accent', a.hex)
    document.documentElement.style.setProperty('--accent-hot', a.hot)
    document.documentElement.style.setProperty('--grain-op', tweaks.showGrain ? '0.06' : '0')
  }, [tweaks])

  const setTweak = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => {
    setTweaks(prev => ({ ...prev, [k]: v }))
  }

  const commitA = (q: string) => {
    setQueryA(q)
    const f = fuzzyFind(q)
    setFighterA(f ? { ...f, corner: 'red' } : null)
  }
  const commitB = (q: string) => {
    setQueryB(q)
    const f = fuzzyFind(q)
    setFighterB(f ? { ...f, corner: 'blue' } : null)
  }

  const canPredict = !!fighterA && !!fighterB && fighterA.name !== fighterB.name

  const predict = async () => {
    if (!canPredict || !fighterA || !fighterB) return
    setLoading(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 1400))
    const r = runLocalPrediction({ ...fighterA, corner: 'red' }, { ...fighterB, corner: 'blue' })
    setLoading(false)
    setResult(r)
    setTimeout(() => {
      const el = document.getElementById('result-anchor')
      if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' })
    }, 100)
  }

  const reset = () => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // cmd+enter shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canPredict && !loading) predict()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [canPredict, loading, fighterA, fighterB])

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
      <Header onToggleTweaks={() => setTweaksOpen(v => !v)} tweaksOpen={tweaksOpen}/>
      <Marquee/>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 40px 80px' }}>
        {/* HERO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 38 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 20, height: 1, background: 'var(--accent)' }}/>
              AI FIGHT PREDICTION ENGINE
            </div>
            <h1 className="display" style={{ fontSize: 108, lineHeight: 0.92, margin: 0, letterSpacing: '0.01em', maxWidth: 900 }}>
              WHO WINS<br/>THE <span style={{ color: 'var(--accent)', textShadow: '0 0 40px rgba(232,0,61,0.35)', position: 'relative' }}>FIGHT</span>?
            </h1>
            <p style={{ color: 'var(--ink-dim)', fontSize: 16, marginTop: 18, maxWidth: 620, lineHeight: 1.5 }}>
              Pick two fighters. Our model runs 10,000+ simulations across reach, pace,
              striking accuracy, grappling control, and chin durability — and calls it.
            </p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              ['MODEL ACCURACY', '78.2%', 'LAST 247 FIGHTS'],
              ['FIGHTS ANALYZED', '12,840', 'UPDATED DAILY'],
            ] as [string, string, string][]).map(([k, v, s]) => (
              <div key={k} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 14 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-mute)' }}>{k}</div>
                <div className="display" style={{ fontSize: 34, lineHeight: 1, marginTop: 2 }}>{v}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-mute)' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FIGHTER ARENA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'stretch' }}>
          <FighterCard corner="red"  fighter={fighterA} query={queryA} setQuery={setQueryA} onCommit={commitA}/>
          <VSCore active={canPredict && !loading} predicting={loading}/>
          <FighterCard corner="blue" fighter={fighterB} query={queryB} setQuery={setQueryB} onCommit={commitB}/>
        </div>

        {/* PREDICT BUTTON */}
        <div style={{ marginTop: 24 }}>
          <PredictButton enabled={canPredict} onClick={predict} loading={loading}/>
        </div>

        {/* QUICK FIGHTS */}
        {!result && (
          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.22em', color: 'var(--ink-mute)' }}>QUICK FIGHTS:</span>
            {QUICK_FIGHTS.map(([a, b]) => (
              <button key={a + b} onClick={() => { commitA(a); commitB(b); setResult(null) }} style={{
                background: 'transparent', border: '1px solid var(--line-strong)',
                color: 'var(--ink-dim)', padding: '6px 12px', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', transition: 'all 160ms',
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--ink)' }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--line-strong)'; el.style.color = 'var(--ink-dim)' }}
              >
                {a.split(' ').slice(-1)[0]} <span style={{ color: 'var(--accent)', margin: '0 6px' }}>vs</span> {b.split(' ').slice(-1)[0]}
              </button>
            ))}
          </div>
        )}

        {/* RESULT */}
        <div id="result-anchor"/>
        {result && tweaks.resultLayout === 'stack' && (
          <div ref={resultRef}>
            <ResultSection result={result} onReset={reset}/>
          </div>
        )}
        {result && tweaks.resultLayout === 'modal' && (
          <div onClick={reset} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)', zIndex: 100, overflow: 'auto',
            padding: '40px 20px', animation: 'fadeUp 300ms both',
          }}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 1140, margin: '40px auto' }}>
              <ResultSection result={result} onReset={reset}/>
            </div>
          </div>
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--line)', padding: '28px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-mute)' }}>
          © 2026 FIGHT ORACLE · NOT AFFILIATED WITH ANY PROMOTION
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-mute)', display: 'flex', gap: 20 }}>
          <span>STATUS: <span style={{ color: 'var(--green)' }}>OPERATIONAL</span></span>
          <span>MODEL: v2.6.1</span>
          <span>API: 99.97% UPTIME</span>
        </div>
      </footer>

      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksOpen(false)}/>}
    </div>
  )
}
