'use client'

import { useState, useEffect } from 'react'
import Header from './components/Header'
import FighterSearch from './components/FighterSearch'
import PredictButton from './components/PredictButton'
import ResultCard from './components/ResultCard'
import { Fighter, ModelInfo, PredictionResult } from './types'

const API_URL = 'http://localhost:8000'

export default function Home() {
  const [queryA, setQueryA]     = useState('')
  const [queryB, setQueryB]     = useState('')
  const [fighterA, setFighterA] = useState<Fighter | null>(null)
  const [fighterB, setFighterB] = useState<Fighter | null>(null)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [result, setResult]     = useState<PredictionResult | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/model/info`)
      .then(r => r.json())
      .then(setModelInfo)
      .catch(() => {})
  }, [])

  const fetchFighter = async (name: string, setFighter: (f: Fighter | null) => void, setLoading: (l: boolean) => void, corner: 'red' | 'blue') => {
    if (!name.trim()) { setFighter(null); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/fighters/${encodeURIComponent(name.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setFighter({ ...data, corner })
      } else {
        setFighter(null)
      }
    } catch {
      setFighter(null)
    } finally {
      setLoading(false)
    }
  }

  const commitA = (name: string) => {
    setQueryA(name)
    setResult(null)
    fetchFighter(name, setFighterA, setLoadingA, 'red')
  }

  const commitB = (name: string) => {
    setQueryB(name)
    setResult(null)
    fetchFighter(name, setFighterB, setLoadingB, 'blue')
  }

  const canPredict = !!fighterA && !!fighterB && fighterA.name !== fighterB.name && !loadingA && !loadingB

  const runPredict = async () => {
    if (!canPredict || !fighterA || !fighterB) return
    setPredicting(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ red_fighter: fighterA.name, blue_fighter: fighterB.name }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Voorspelling mislukt')
      }

      const data = await res.json()
      const winnerIsRed = data.winner_corner === 'red'
      const winnerInfo  = winnerIsRed ? data.red_fighter : data.blue_fighter
      const loserInfo   = winnerIsRed ? data.blue_fighter : data.red_fighter

      setResult({
        winner: {
          name:     data.winner,
          record:   winnerInfo.record,
          reachCms: winnerInfo.reachCms,
          age:      winnerInfo.age,
          stance:   winnerInfo.stance,
          corner:   data.winner_corner,
        },
        loser: {
          name:     data.loser,
          record:   loserInfo.record,
          reachCms: loserInfo.reachCms,
          age:      loserInfo.age,
          stance:   loserInfo.stance,
        },
        confidence: data.confidence,
        factors:    data.factors,
        method:     data.method,
        round:      data.round,
      })

      setTimeout(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis')
    } finally {
      setPredicting(false)
    }
  }

  // Cmd+Enter shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canPredict && !predicting) runPredict()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [canPredict, predicting, fighterA, fighterB])

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 48px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            display: 'inline-block',
            background: 'var(--red)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.24em',
            padding: '5px 12px',
            marginBottom: 20,
          }}>
            AI FIGHT PREDICTION
          </div>
          <h1 style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(64px, 10vw, 120px)',
            lineHeight: 0.9,
            letterSpacing: '0.02em',
            color: '#0a0a0a',
            margin: 0,
          }}>
            WHO WINS<br />
            <span style={{ color: 'var(--red)' }}>THE FIGHT?</span>
          </h1>
          <p style={{
            fontSize: 15,
            color: '#6b6b6b',
            marginTop: 20,
            maxWidth: 480,
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            Search two UFC fighters. Our Random Forest model analyzes their historical
            stats and predicts who wins.
          </p>
        </div>

        {/* Fighter selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, marginBottom: 0 }}>
          <FighterSearch
            corner="red"
            fighter={fighterA}
            query={queryA}
            setQuery={setQueryA}
            onCommit={commitA}
            loading={loadingA}
          />

          {/* VS divider */}
          <div style={{
            width: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            borderTop: '2px solid #0a0a0a',
            borderBottom: '2px solid #0a0a0a',
          }}>
            <span style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 36,
              letterSpacing: '0.06em',
              color: canPredict ? 'var(--red)' : '#ccc',
              transition: 'color 300ms',
            }}>VS</span>
          </div>

          <FighterSearch
            corner="blue"
            fighter={fighterB}
            query={queryB}
            setQuery={setQueryB}
            onCommit={commitB}
            loading={loadingB}
          />
        </div>

        {/* Predict button */}
        <div style={{ marginBottom: 40 }}>
          <PredictButton enabled={canPredict} loading={predicting} onClick={runPredict} />
        </div>

        {/* Hint */}
        {!result && !error && (
          <p style={{ fontSize: 11, color: '#aaa', fontWeight: 600, letterSpacing: '0.1em', textAlign: 'center' }}>
            {canPredict ? '⌘ + ENTER TO PREDICT' : 'SEARCH TWO FIGHTERS TO BEGIN'}
          </p>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '14px 20px',
            background: '#fef2f2',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        <div id="result" style={{ marginTop: 48 }}>
          {result && (
            <ResultCard result={result} modelInfo={modelInfo} onReset={() => { setResult(null); setError(null) }} />
          )}
        </div>
      </main>
    </div>
  )
}