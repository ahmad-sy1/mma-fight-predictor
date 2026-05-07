'use client'

import { useState, useEffect } from 'react'
import { ModelInfo, PredictionFactor, PredictionResult } from '../types'

function FactorRow({ factor, rank, winnerIsRed }: { factor: PredictionFactor; rank: number; winnerIsRed: boolean }) {
  return (
    <div className="flex justify-between items-center px-3.5 py-3 bg-section border border-line rounded-lg">
      <span className="flex items-center gap-3">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          rank === 0
            ? winnerIsRed ? 'bg-accent text-white' : 'bg-blue text-white'
            : 'bg-line-strong text-ink-dim'
        }`}>{rank + 1}</span>
        <span>
          <span className="font-semibold block text-[13px]">{factor.label}</span>
          {factor.sub && <span className="text-[11.5px] text-ink-mute">{factor.sub}</span>}
        </span>
      </span>
      <span className={`font-bold text-sm ${winnerIsRed ? 'text-accent' : 'text-blue'}`}>
        +{factor.delta.toFixed(1)}
      </span>
    </div>
  )
}

interface Props {
  result: PredictionResult
  modelInfo: ModelInfo | null
  onReset: () => void
}

export default function ResultCard({ result, modelInfo, onReset }: Props) {
  const { winner, loser, confidence, factors, method, round } = result
  const [bar, setBar] = useState(0)
  const winnerIsRed = winner.corner === 'red'

  useEffect(() => {
    const t = setTimeout(() => setBar(confidence), 120)
    return () => clearTimeout(t)
  }, [confidence])

  return (
    <div className="mt-6 bg-surface shadow-card rounded-xl p-7 animate-fade-up">
      <div className={`text-[11px] font-extrabold tracking-[0.16em] mb-1.5 ${winnerIsRed ? 'text-accent' : 'text-blue'}`}>
        PREDICTION
      </div>
      <div className="text-[30px] font-extrabold leading-[1.15]">
        {winner.name}{' '}
        <span className="text-ink-dim font-medium text-[17px]">defeats {loser.name}</span>
      </div>

      {/* Confidence */}
      <div className="mt-[22px]">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[13px] text-ink-dim font-medium">Confidence</span>
          <span className={`text-[26px] font-extrabold ${winnerIsRed ? 'text-accent' : 'text-blue'}`}>
            {confidence.toFixed(1)}%
          </span>
        </div>
        <div className="h-[10px] bg-section border border-line rounded-md overflow-hidden">
          <div
            className={`h-full rounded-md transition-[width] duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] ${winnerIsRed ? 'bg-accent' : 'bg-blue'}`}
            style={{ width: `${bar}%` }}
          />
        </div>
      </div>

      {/* Method + Round */}
      <div className="grid grid-cols-2 gap-2.5 mt-[18px]">
        {[['Method', method], ['Est. Round', round]].map(([k, v]) => (
          <div key={k} className="px-3.5 py-3 bg-section border border-line rounded-lg">
            <div className="text-[10px] font-extrabold tracking-[0.14em] text-ink-dim mb-1">{k.toUpperCase()}</div>
            <div className="text-base font-bold text-ink">{v}</div>
          </div>
        ))}
      </div>

      {/* Deciding factors */}
      <div className="mt-[26px]">
        <div className="text-xs font-bold tracking-[0.08em] text-ink-dim mb-2.5">TOP DECIDING FACTORS</div>
        <div className="flex flex-col gap-2">
          {factors.map((f, i) => (
            <FactorRow key={f.label} factor={f} rank={i} winnerIsRed={winnerIsRed} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-[22px] pt-4 border-t border-line flex justify-between items-center">
        <button
          onClick={onReset}
          className="px-3.5 py-2 bg-transparent border border-line-strong rounded-lg text-ink-dim cursor-pointer text-[13px] font-semibold hover:text-ink transition-colors"
        >
          ← New prediction
        </button>
        <span className="text-[11px] text-ink-mute">
          Random Forest · {modelInfo ? `${modelInfo.accuracy}% acc` : '—'} · {modelInfo ? `${modelInfo.total_fights.toLocaleString()} fights` : '—'}
        </span>
      </div>
    </div>
  )
}
