'use client'

import { useState, useEffect } from 'react'
import Header from './components/Header'
import FighterSearch from './components/FighterSearch'
import PredictButton from './components/PredictButton'
import ResultCard from './components/ResultCard'
import DiffTable from './components/DiffTable'
import UpcomingCard from './components/UpcomingCard'
import FightDialog from './components/FightDialog'
import { Fighter, ModelInfo, PredictionResult, UpcomingFight, UpcomingPrediction } from './types'

const API_URL = 'http://localhost:8000'

const UPCOMING_FIGHTS: UpcomingFight[] = [
  { event: 'UFC 318',        date: 'May 3, 2026',  venue: 'T-Mobile Arena, Las Vegas', card: 'Heavyweight Title',      redFighter: 'Jon Jones',      blueFighter: 'Stipe Miocic' },
  { event: 'UFC 318',        date: 'May 3, 2026',  venue: 'T-Mobile Arena, Las Vegas', card: 'Lightweight',            redFighter: 'Conor McGregor', blueFighter: 'Dustin Poirier' },
  { event: 'UFC Fight Night', date: 'May 17, 2026', venue: 'UFC Apex, Las Vegas',       card: 'Middleweight',           redFighter: 'Israel Adesanya',blueFighter: 'Robert Whittaker' },
  { event: 'UFC 319',        date: 'Jun 7, 2026',  venue: 'Kaseya Center, Miami',      card: 'Featherweight Title',    redFighter: 'Max Holloway',   blueFighter: 'Conor McGregor' },
]

/* ---------- Predict page ---------- */
function PredictPage({ modelInfo }: { modelInfo: ModelInfo | null }) {
  const [queryA, setQueryA]   = useState('')
  const [queryB, setQueryB]   = useState('')
  const [fighterA, setFighterA] = useState<Fighter | null>(null)
  const [fighterB, setFighterB] = useState<Fighter | null>(null)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [result, setResult]   = useState<PredictionResult | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const fetchFighter = async (
    name: string,
    setFighter: (f: Fighter | null) => void,
    setLoading: (l: boolean) => void,
    corner: 'red' | 'blue',
  ) => {
    if (!name.trim()) { setFighter(null); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/fighters/${encodeURIComponent(name.trim())}`)
      if (res.ok) setFighter({ ...await res.json(), corner })
      else setFighter(null)
    } catch { setFighter(null) }
    finally { setLoading(false) }
  }

  const commitA = (name: string) => { setQueryA(name); setResult(null); fetchFighter(name, setFighterA, setLoadingA, 'red') }
  const commitB = (name: string) => { setQueryB(name); setResult(null); fetchFighter(name, setFighterB, setLoadingB, 'blue') }

  const canPredict = !!fighterA && !!fighterB && fighterA.name !== fighterB.name && !loadingA && !loadingB

  const runPredict = async () => {
    if (!canPredict || !fighterA || !fighterB) return
    setPredicting(true); setResult(null); setError(null)
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ red_fighter: fighterA.name, blue_fighter: fighterB.name }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? 'Prediction failed') }
      const data = await res.json()
      const winnerIsRed = data.winner_corner === 'red'
      const wInfo = winnerIsRed ? data.red_fighter : data.blue_fighter
      const lInfo = winnerIsRed ? data.blue_fighter : data.red_fighter
      setResult({
        winner: { ...wInfo, corner: data.winner_corner },
        loser:  { ...lInfo },
        confidence: data.confidence,
        factors: data.factors,
        method: data.method,
        round: data.round,
      })
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally { setPredicting(false) }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canPredict && !predicting) runPredict()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [canPredict, predicting, fighterA, fighterB])

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>
          Who wins the fight?
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 15, marginTop: 10, maxWidth: 520, margin: '10px auto 0' }}>
          Pick two UFC fighters. We compare records, striking, grappling, and more to predict the winner.
        </p>
      </div>

      {/* Fighter cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'start' }}>
        <FighterSearch corner="red"  fighter={fighterA} query={queryA} setQuery={setQueryA} onCommit={commitA} loading={loadingA} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, paddingTop: 80 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--surface)', border: `2px solid ${canPredict ? 'var(--accent)' : 'var(--line)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, color: canPredict ? 'var(--accent)' : 'var(--ink-mute)',
            transition: 'border-color 300ms, color 300ms',
          }}>VS</div>
        </div>

        <FighterSearch corner="blue" fighter={fighterB} query={queryB} setQuery={setQueryB} onCommit={commitB} loading={loadingB} />
      </div>

      {/* Predict button */}
      <div style={{ marginTop: 16 }}>
        <PredictButton enabled={canPredict} loading={predicting} onClick={runPredict} />
      </div>

      {/* Hint */}
      {!result && !error && (
        <p style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: '0.1em', textAlign: 'center', marginTop: 12 }}>
          {canPredict ? '⌘ + ENTER TO PREDICT' : 'SEARCH TWO FIGHTERS TO BEGIN'}
        </p>
      )}

      {/* Quick picks */}
      {!result && !predicting && (
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>Try:</span>
          {[
            ['Jon Jones', 'Stipe Miocic'],
            ['Conor McGregor', 'Dustin Poirier'],
            ['Israel Adesanya', 'Robert Whittaker'],
          ].map(([a, b]) => (
            <button
              key={a + b}
              onClick={() => { commitA(a); commitB(b); setResult(null) }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--line)',
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                color: 'var(--ink-dim)', cursor: 'pointer',
              }}
            >
              {a.split(' ').slice(-1)[0]} vs {b.split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>
      )}

      {/* Diff table (shown when both fighters loaded, no result yet) */}
      {fighterA && fighterB && fighterA.name !== fighterB.name && !result && !predicting && (
        <DiffTable a={fighterA} b={fighterB} />
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 20, padding: '14px 20px', background: 'var(--accent-soft)',
          border: '1px solid var(--accent)', borderRadius: 8,
          color: 'var(--accent)', fontSize: 13, fontWeight: 600,
        }}>⚠ {error}</div>
      )}

      {/* Result */}
      <div id="result">
        {result && <ResultCard result={result} modelInfo={modelInfo} onReset={() => { setResult(null); setError(null) }} />}
      </div>
    </main>
  )
}

/* ---------- Upcoming page ---------- */
function UpcomingPage() {
  const [predictions, setPredictions] = useState<(UpcomingPrediction | null)[]>(UPCOMING_FIGHTS.map(() => null))
  const [open, setOpen] = useState<UpcomingPrediction | null>(null)

  useEffect(() => {
    UPCOMING_FIGHTS.forEach(async (fight, i) => {
      try {
        const res = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ red_fighter: fight.redFighter, blue_fighter: fight.blueFighter }),
        })
        if (!res.ok) return
        const data = await res.json()
        setPredictions(prev => {
          const next = [...prev]
          next[i] = {
            fight,
            redFighter:  { ...data.red_fighter,  corner: 'red'  as const },
            blueFighter: { ...data.blue_fighter, corner: 'blue' as const },
            winnerCorner: data.winner_corner as 'red' | 'blue',
            confidence:   data.confidence,
            factors:      data.factors,
          }
          return next
        })
      } catch { /* fighter not in dataset — skip */ }
    })
  }, [])

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--accent)' }}>UPCOMING FIGHTS</div>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, margin: '6px 0 10px', letterSpacing: '-0.02em' }}>
          Next on the card
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 15, maxWidth: 560 }}>
          Oracle predictions for upcoming matchups. Click any fight for the full stat breakdown.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {predictions.map((p, i) =>
          p ? (
            <UpcomingCard key={i} prediction={p} onClick={() => setOpen(p)} />
          ) : (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
              padding: 20, minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-mute)', fontSize: 13,
            }}>
              Loading…
            </div>
          )
        )}
      </div>

      {open && <FightDialog prediction={open} onClose={() => setOpen(null)} />}
    </main>
  )
}

/* ---------- About page ---------- */
function AboutPage() {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 8 }}>ABOUT</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Fight Oracle</h1>
      <p style={{ color: 'var(--ink-dim)', fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
        Fight Oracle uses a Random Forest model trained on over 5,000 historical UFC bouts to predict fight outcomes.
        It analyses 17 statistical features — striking output, grappling, win streaks, physical attributes, and more —
        to calculate win probability for any two fighters in the dataset.
      </p>
      <p style={{ color: 'var(--ink-dim)', fontSize: 15, lineHeight: 1.7 }}>
        This is a data science project. Predictions are based on historical patterns and are for entertainment purposes only.
        Not betting advice.
      </p>
    </main>
  )
}

/* ---------- Root ---------- */
export default function Home() {
  const [page, setPage] = useState('predict')
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/model/info`)
      .then(r => r.json())
      .then(setModelInfo)
      .catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header page={page} setPage={setPage} />
      {page === 'predict'  && <PredictPage modelInfo={modelInfo} />}
      {page === 'upcoming' && <UpcomingPage />}
      {page === 'about'    && <AboutPage />}
    </div>
  )
}
