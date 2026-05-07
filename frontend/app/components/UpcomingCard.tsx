'use client'

import { UpcomingPrediction } from '../types'
import { initials } from '../lib/utils'

interface Props {
  prediction: UpcomingPrediction
  onClick: () => void
}

export default function UpcomingCard({ prediction, onClick }: Props) {
  const { fight, redFighter, blueFighter, winnerCorner, confidence } = prediction
  const aPct = winnerCorner === 'red' ? confidence : Math.round(100 - confidence)
  const bPct = 100 - aPct

  return (
    <div
      onClick={onClick}
      className="bg-surface shadow-card rounded-xl p-5 cursor-pointer transition-all duration-[160ms] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12),0_0_0_1px_var(--color-accent)] hover:-translate-y-0.5"
    >
      {/* Event header */}
      <div className="flex justify-between items-center mb-3.5 pb-3 border-b border-line">
        <div>
          <div className="text-[11px] font-extrabold tracking-[0.14em] text-accent">
            {fight.event.toUpperCase()}
          </div>
          <div className="text-xs text-ink-dim mt-0.5">{fight.weightClass}</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold">{fight.date}</div>
          <div className="text-[11px] text-ink-mute">{fight.location}</div>
        </div>
      </div>

      {/* Fighters */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5">
        {/* Red corner */}
        <div className="flex items-center gap-2.5">
          <div className={`w-11 h-11 rounded-full shrink-0 bg-accent-soft flex items-center justify-center text-sm font-extrabold text-accent border-2 ${
            winnerCorner === 'red' ? 'border-accent' : 'border-line'
          }`}>
            {initials(redFighter.name)}
          </div>
          <div className="min-w-0">
            <div className={`text-sm font-extrabold truncate ${winnerCorner === 'red' ? 'text-ink' : 'text-ink-dim'}`}>
              {redFighter.name}
            </div>
            <div className="text-[11px] text-ink-mute mt-px">
              {redFighter.record} · {redFighter.weightClass}
            </div>
          </div>
        </div>

        <div className="w-[34px] h-[34px] rounded-full bg-bg border border-line-strong flex items-center justify-center text-[10px] font-black text-ink-dim shrink-0">
          VS
        </div>

        {/* Blue corner */}
        <div className="flex flex-row-reverse items-center gap-2.5">
          <div className={`w-11 h-11 rounded-full shrink-0 bg-blue-soft flex items-center justify-center text-sm font-extrabold text-blue border-2 ${
            winnerCorner === 'blue' ? 'border-blue' : 'border-line'
          }`}>
            {initials(blueFighter.name)}
          </div>
          <div className="min-w-0 text-right flex-1">
            <div className={`text-sm font-extrabold truncate ${winnerCorner === 'blue' ? 'text-ink' : 'text-ink-dim'}`}>
              {blueFighter.name}
            </div>
            <div className="text-[11px] text-ink-mute mt-px">
              {blueFighter.record} · {blueFighter.weightClass}
            </div>
          </div>
        </div>
      </div>

      {/* Prediction bar */}
      <div className="mt-4">
        <div className="flex h-2 rounded overflow-hidden">
          <div className="bg-accent transition-[width] duration-[600ms]" style={{ width: `${aPct}%` }} />
          <div className="bg-blue transition-[width] duration-[600ms]" style={{ width: `${bPct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[11px]">
          <span className="text-accent font-bold">{aPct}%</span>
          <span className="text-ink-mute">AI Prediction</span>
          <span className="text-blue font-bold">{bPct}%</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-ink-mute flex justify-between">
        <span>Click for full breakdown</span>
        <span className="text-accent font-bold">→</span>
      </div>
    </div>
  )
}
