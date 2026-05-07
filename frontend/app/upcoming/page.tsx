'use client'

import { useState, useEffect } from 'react'
import UpcomingCard from '../components/UpcomingCard'
import FightDialog from '../components/FightDialog'
import { Fighter, PredictionFactor, UpcomingFight, UpcomingPrediction } from '../types'
import { API_URL } from '../lib/constants'

export default function UpcomingPage() {
  const [fights, setFights]           = useState<UpcomingFight[]>([])
  const [predictions, setPredictions] = useState<(UpcomingPrediction | null)[]>([])
  const [loading, setLoading]         = useState(true)
  const [open, setOpen]               = useState<UpcomingPrediction | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/upcoming`)
      .then(r => r.json())
      .then(data => {
        const raw = data.fights as Array<{
          event: string; date: string; location: string; weightClass: string
          redFighter: string; blueFighter: string
          inDataset: boolean; prediction: Record<string, unknown> | null
        }>

        const mappedFights: UpcomingFight[] = raw.map(f => ({
          event: f.event, date: f.date, location: f.location,
          weightClass: f.weightClass, redFighter: f.redFighter, blueFighter: f.blueFighter,
        }))

        const mappedPreds: (UpcomingPrediction | null)[] = raw.map((f, i) => {
          if (!f.inDataset || !f.prediction) return null
          const p = f.prediction as Record<string, unknown>
          return {
            fight:        mappedFights[i],
            redFighter:   { ...(p.red_fighter  as Fighter), corner: 'red'  as const },
            blueFighter:  { ...(p.blue_fighter as Fighter), corner: 'blue' as const },
            winnerCorner: p.winner_corner as 'red' | 'blue',
            confidence:   p.confidence as number,
            factors:      p.factors as PredictionFactor[],
          }
        })

        setFights(mappedFights)
        setPredictions(mappedPreds)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="max-w-[1100px] mx-auto px-6 pt-12 pb-20">
      <div className="mb-9">
        <div className="text-[11px] font-extrabold tracking-[0.16em] text-accent">UPCOMING FIGHTS</div>
        <h1 className="text-[38px] font-extrabold leading-[1.1] mt-1.5 mb-2.5 tracking-[-0.02em]">
          Next on the card
        </h1>
        <p className="text-ink-dim text-[15px] max-w-[560px]">
          Oracle predictions for upcoming matchups. Click any fight for the full stat breakdown.
        </p>
      </div>

      {loading ? (
        <div className="text-ink-dim text-sm text-center py-[60px]">Loading upcoming fights…</div>
      ) : fights.length === 0 ? (
        <div className="text-ink-dim text-sm text-center py-[60px]">No upcoming fights found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {fights.map((fight, i) => {
            const pred = predictions[i]
            return pred ? (
              <UpcomingCard key={i} prediction={pred} onClick={() => setOpen(pred)} />
            ) : (
              <div key={i} className="bg-surface border border-line rounded-xl p-5 min-h-[140px]">
                <div className="text-[11px] font-extrabold tracking-[0.14em] text-accent mb-1">
                  {fight.event.toUpperCase()}
                </div>
                <div className="text-xs text-ink-dim mb-3.5">
                  {fight.date} · {fight.location}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>{fight.redFighter}</span>
                  <span className="text-ink-mute font-normal text-xs">vs</span>
                  <span>{fight.blueFighter}</span>
                </div>
                <div className="mt-2.5 text-xs text-ink-mute">
                  {fight.weightClass} · Not in dataset — no prediction available
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open && <FightDialog prediction={open} onClose={() => setOpen(null)} />}
    </main>
  )
}
