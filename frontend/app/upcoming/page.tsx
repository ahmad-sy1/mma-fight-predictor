'use client'

import { useState, useEffect } from 'react'
import UpcomingCard from '../components/UpcomingCard'
import FightDialog from '../components/FightDialog'
import { Fighter, PredictionFactor, UpcomingFight, UpcomingPrediction } from '../types'
import { API_URL } from '../lib/constants'

type FightWithPred = {
  fight: UpcomingFight
  prediction: UpcomingPrediction | null
}

type EventGroup = {
  name: string
  date: string
  location: string
  fights: FightWithPred[]
}

export default function UpcomingPage() {
  const [events, setEvents]   = useState<EventGroup[]>([])
  const [active, setActive]   = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState<UpcomingPrediction | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/upcoming`)
      .then(r => r.json())
      .then(data => {
        const raw = data.fights as Array<{
          event: string; date: string; location: string; weightClass: string
          redFighter: string; blueFighter: string
          inDataset: boolean; prediction: Record<string, unknown> | null
        }>

        const grouped: Record<string, EventGroup> = {}

        raw.forEach(f => {
          if (!grouped[f.event]) {
            grouped[f.event] = { name: f.event, date: f.date, location: f.location, fights: [] }
          }

          const fight: UpcomingFight = {
            event: f.event, date: f.date, location: f.location,
            weightClass: f.weightClass, redFighter: f.redFighter, blueFighter: f.blueFighter,
          }

          const prediction: UpcomingPrediction | null = f.inDataset && f.prediction
            ? {
                fight,
                redFighter:   { ...(f.prediction.red_fighter  as Fighter), corner: 'red'  as const },
                blueFighter:  { ...(f.prediction.blue_fighter as Fighter), corner: 'blue' as const },
                winnerCorner: f.prediction.winner_corner as 'red' | 'blue',
                confidence:   f.prediction.confidence as number,
                factors:      f.prediction.factors as PredictionFactor[],
              }
            : null

          grouped[f.event].fights.push({ fight, prediction })
        })

        const eventList = Object.values(grouped)
        setEvents(eventList)
        if (eventList.length > 0) setActive(eventList[0].name)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const currentEvent = events.find(e => e.name === active)

  return (
    <main className="max-w-[1100px] mx-auto px-6 pt-12 pb-20">
      <div className="mb-8">
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
      ) : events.length === 0 ? (
        <div className="text-ink-dim text-sm text-center py-[60px]">No upcoming fights found.</div>
      ) : (
        <>
          {/* Event tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
            {events.map(ev => (
              <button
                key={ev.name}
                onClick={() => setActive(ev.name)}
                className={`shrink-0 px-4 py-2.5 rounded-lg border text-left transition-all duration-150 ${
                  active === ev.name
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface border-line text-ink-dim hover:border-line-strong hover:text-ink'
                }`}
              >
                <div className="text-[11px] font-extrabold tracking-[0.1em] leading-tight">
                  {ev.name}
                </div>
                <div className={`text-[10px] mt-0.5 ${active === ev.name ? 'text-white/70' : 'text-ink-mute'}`}>
                  {ev.date}
                </div>
              </button>
            ))}
          </div>

          {/* Event info */}
          {currentEvent && (
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold tracking-[0.14em] text-ink-mute">
                  {currentEvent.location}
                </div>
              </div>
              <div className="text-xs text-ink-mute">
                {currentEvent.fights.length} fights · {currentEvent.fights.filter(f => f.prediction).length} predictions
              </div>
            </div>
          )}

          {/* Fights grid */}
          {currentEvent && (
            <div className="grid grid-cols-2 gap-4">
              {currentEvent.fights.map(({ fight, prediction }, i) =>
                prediction ? (
                  <UpcomingCard key={i} prediction={prediction} onClick={() => setOpen(prediction)} />
                ) : (
                  <div key={i} className="bg-surface border border-line rounded-xl p-5 min-h-[140px]">
                    <div className="text-[11px] font-extrabold tracking-[0.14em] text-ink-mute mb-1">
                      {fight.weightClass || 'Unknown weight class'}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold mt-3">
                      <span>{fight.redFighter}</span>
                      <span className="text-ink-mute font-normal text-xs">vs</span>
                      <span>{fight.blueFighter}</span>
                    </div>
                    <div className="mt-2.5 text-xs text-ink-mute">
                      Not in dataset — no prediction available
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {open && <FightDialog prediction={open} onClose={() => setOpen(null)} />}
    </main>
  )
}
