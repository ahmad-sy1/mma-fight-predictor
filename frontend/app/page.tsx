'use client'

import { useState, useEffect } from 'react'
import FighterSearch from './components/FighterSearch'
import PredictButton from './components/PredictButton'
import ResultCard from './components/ResultCard'
import DiffTable from './components/DiffTable'
import { Fighter, ModelInfo, PredictionResult } from './types'
import { API_URL } from './lib/constants'

const SAMPLE_FIGHTS = [
  ['Jon Jones', 'Stipe Miocic'],
  ['Conor McGregor', 'Dustin Poirier'],
  ['Israel Adesanya', 'Robert Whittaker'],
]

function usePrediction() {
  const [fighterA, setFighterA] = useState<Fighter | null>(null)
  const [fighterB, setFighterB] = useState<Fighter | null>(null)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/model/info`).then(r => r.json()).then(setModelInfo).catch(() => {})
  }, [])

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

  return {
    fighterA, setFighterA, loadingA, setLoadingA,
    fighterB, setFighterB, loadingB, setLoadingB,
    predicting, result, setResult,
    error, setError,
    modelInfo, canPredict, runPredict,
    fetchFighter,
  }
}

export default function PredictPage() {
  const [queryA, setQueryA] = useState('')
  const [queryB, setQueryB] = useState('')
  const {
    fighterA, setFighterA, loadingA, setLoadingA,
    fighterB, setFighterB, loadingB, setLoadingB,
    predicting, result, setResult,
    error, setError,
    modelInfo, canPredict, runPredict,
    fetchFighter,
  } = usePrediction()

  const commitA = (name: string) => { setQueryA(name); setResult(null); fetchFighter(name, setFighterA, setLoadingA, 'red') }
  const commitB = (name: string) => { setQueryB(name); setResult(null); fetchFighter(name, setFighterB, setLoadingB, 'blue') }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canPredict && !predicting) runPredict()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [canPredict, predicting, fighterA, fighterB])

  return (
    <main className="max-w-[1100px] mx-auto px-6 pt-12 pb-20">
      <div className="text-center mb-9">
        <h1 className="text-[42px] font-extrabold leading-[1.1] m-0 tracking-[-0.02em]">
          Who wins the fight?
        </h1>
        <p className="text-ink-dim text-[15px] mt-2.5 max-w-[520px] mx-auto">
          Pick two UFC fighters. We compare records, striking, grappling, and more to predict the winner.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <FighterSearch corner="red"  fighter={fighterA} query={queryA} setQuery={setQueryA} onCommit={commitA} loading={loadingA} />
        <div className="flex items-center justify-center w-12 pt-20">
          <div className={`w-10 h-10 rounded-full bg-surface border-2 flex items-center justify-center text-xs font-black transition-all duration-300 ${
            canPredict ? 'border-accent text-accent' : 'border-line text-ink-mute'
          }`}>VS</div>
        </div>
        <FighterSearch corner="blue" fighter={fighterB} query={queryB} setQuery={setQueryB} onCommit={commitB} loading={loadingB} />
      </div>

      <div className="mt-4">
        <PredictButton enabled={canPredict} loading={predicting} onClick={runPredict} />
      </div>

      {!result && !error && (
        <p className="text-[11px] text-ink-mute font-extrabold tracking-[0.1em] text-center mt-3">
          {canPredict ? '⌘ + ENTER TO PREDICT' : 'SEARCH TWO FIGHTERS TO BEGIN'}
        </p>
      )}

      {!result && !predicting && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <span className="text-xs text-ink-dim self-center">Try:</span>
          {SAMPLE_FIGHTS.map(([a, b]) => (
            <button
              key={a + b}
              onClick={() => { commitA(a); commitB(b); setResult(null) }}
              className="bg-surface border border-line px-3 py-1.5 rounded-full text-xs font-medium text-ink-dim cursor-pointer hover:text-ink hover:border-line-strong transition-colors"
            >
              {a.split(' ').slice(-1)[0]} vs {b.split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>
      )}

      {fighterA && fighterB && fighterA.name !== fighterB.name && !result && !predicting && (
        <DiffTable a={fighterA} b={fighterB} />
      )}

      {error && (
        <div className="mt-5 px-5 py-3.5 bg-accent-soft border border-accent rounded-lg text-accent text-[13px] font-semibold">
          ⚠ {error}
        </div>
      )}

      <div id="result">
        {result && <ResultCard result={result} modelInfo={modelInfo} onReset={() => { setResult(null); setError(null) }} />}
      </div>
    </main>
  )
}
