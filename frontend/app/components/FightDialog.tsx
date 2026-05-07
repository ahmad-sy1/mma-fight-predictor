'use client'

import { useEffect } from 'react'
import { Fighter, PredictionFactor, UpcomingPrediction } from '../types'
import { initials } from '../lib/utils'

function FighterColumn({ fighter, isWinner, isRed, pct }: { fighter: Fighter; isWinner: boolean; isRed: boolean; pct: number }) {
  return (
    <div className="text-center">
      <div className={`w-[68px] h-[68px] rounded-full mx-auto flex items-center justify-center text-xl font-extrabold border-[3px] ${
        isRed
          ? `bg-accent-soft text-accent ${isWinner ? 'border-accent' : 'border-line'}`
          : `bg-blue-soft text-blue ${isWinner ? 'border-blue' : 'border-line'}`
      }`}>
        {initials(fighter.name)}
      </div>
      <div className="text-base font-extrabold mt-2.5">{fighter.name}</div>
      <div className="text-xs text-ink-mute">{fighter.record} · {fighter.weightClass}</div>
      <div className={`text-[26px] font-extrabold mt-1.5 ${isRed ? 'text-accent' : 'text-blue'}`}>{pct}%</div>
    </div>
  )
}

function FactorRow({ factor, rank, winnerIsRed }: { factor: PredictionFactor; rank: number; winnerIsRed: boolean }) {
  return (
    <div className="px-3.5 py-3 bg-section border border-line rounded-lg flex justify-between items-center">
      <div className="flex items-center gap-3">
        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold ${
          rank === 0
            ? winnerIsRed ? 'bg-accent text-white' : 'bg-blue text-white'
            : 'bg-line-strong text-ink-dim'
        }`}>{rank + 1}</span>
        <div className="text-[13px] font-semibold">{factor.label}</div>
      </div>
      <div className={`text-[13px] font-bold ${winnerIsRed ? 'text-accent' : 'text-blue'}`}>
        +{factor.delta.toFixed(1)}
      </div>
    </div>
  )
}

interface Props {
  prediction: UpcomingPrediction
  onClose: () => void
}

export default function FightDialog({ prediction, onClose }: Props) {
  const { fight, redFighter, blueFighter, winnerCorner, confidence, factors } = prediction
  const aPct = winnerCorner === 'red' ? confidence : Math.round(100 - confidence)
  const bPct = 100 - aPct
  const winnerIsRed = winnerCorner === 'red'
  const winnerName  = winnerIsRed ? redFighter.name : blueFighter.name

  const compRows: [string, string | number, string | number][] = [
    ['Win streak',    redFighter.winStreak,        blueFighter.winStreak],
    ['Reach (cm)',    redFighter.reachCms ?? '—',  blueFighter.reachCms ?? '—'],
    ['Sig str / min', redFighter.avgSigStr,         blueFighter.avgSigStr],
    ['Str accuracy',  `${redFighter.sigStrAcc}%`,  `${blueFighter.sigStrAcc}%`],
    ['TD avg',        redFighter.avgTD,             blueFighter.avgTD],
    ['KO wins',       redFighter.koWins,            blueFighter.koWins],
    ['Sub wins',      redFighter.subWins,           blueFighter.subWins],
    ['Age',           redFighter.age ?? '—',        blueFighter.age ?? '—'],
  ]

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[rgba(20,20,20,0.5)] backdrop-blur-sm z-[100] flex items-start justify-center py-10 px-5 overflow-y-auto"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface rounded-[14px] max-w-[720px] w-full shadow-[0_30px_80px_rgba(0,0,0,0.18)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex justify-between items-center">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-accent">
              {fight.event.toUpperCase()} · {fight.weightClass.toUpperCase()}
            </div>
            <div className="text-[13px] text-ink-dim mt-1">{fight.date} · {fight.location}</div>
          </div>
          <button
            onClick={onClose}
            className="bg-bg border-0 rounded-lg w-8 h-8 cursor-pointer text-lg text-ink-dim hover:text-ink transition-colors"
          >×</button>
        </div>

        <div className="p-6">
          {/* Fighter columns */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 mb-5">
            <FighterColumn fighter={redFighter}  isWinner={winnerIsRed}  isRed={true}  pct={aPct} />
            <div className="text-[13px] font-extrabold text-ink-mute">VS</div>
            <FighterColumn fighter={blueFighter} isWinner={!winnerIsRed} isRed={false} pct={bPct} />
          </div>

          {/* Split bar */}
          <div className="flex h-3 rounded-md overflow-hidden">
            <div className="bg-accent" style={{ width: `${aPct}%` }} />
            <div className="bg-blue"   style={{ width: `${bPct}%` }} />
          </div>

          {/* Oracle pick */}
          <div className="mt-[18px] px-4 py-3 bg-section border border-line rounded-[10px] flex items-center gap-3">
            <div className={`text-[11px] font-extrabold tracking-[0.14em] ${winnerIsRed ? 'text-accent' : 'text-blue'}`}>
              ORACLE PICK
            </div>
            <div className="text-[15px] font-bold">{winnerName} by {confidence}% confidence</div>
          </div>

          {/* Key comparison */}
          <div className="mt-5">
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-ink-dim mb-2.5">KEY COMPARISON</div>
            <div className="flex flex-col gap-1.5">
              {compRows.map(([label, va, vb]) => (
                <div key={label} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center text-[13px]">
                  <div className="text-right font-bold">{va}</div>
                  <div className="text-[10px] tracking-[0.14em] text-ink-mute uppercase">{label}</div>
                  <div className="font-bold">{vb}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Factors */}
          {factors.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] font-extrabold tracking-[0.14em] text-ink-dim mb-2.5">TOP DECIDING FACTORS</div>
              <div className="flex flex-col gap-2">
                {factors.map((f, i) => (
                  <FactorRow key={f.label} factor={f} rank={i} winnerIsRed={winnerIsRed} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
