'use client'

import { UpcomingPrediction } from '../types'

interface Props {
  prediction: UpcomingPrediction
  onClick: () => void
}

export default function UpcomingCard({ prediction, onClick }: Props) {
  const { fight, redFighter, blueFighter, winnerCorner, confidence } = prediction
  const aPct = winnerCorner === 'red' ? confidence : Math.round(100 - confidence)
  const bPct = 100 - aPct

  const initials = (name: string) =>
    name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', boxShadow: 'var(--card-shadow)', borderRadius: 12,
        padding: 20, cursor: 'pointer', transition: 'box-shadow 160ms, transform 160ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px var(--accent)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--card-shadow)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Event header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--line)',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)' }}>
            {fight.event.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2 }}>{fight.card}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{fight.date}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{fight.venue}</div>
        </div>
      </div>

      {/* Fighters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 14 }}>
        {/* Red */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent-soft)',
            border: `2px solid ${winnerCorner === 'red' ? 'var(--accent)' : 'var(--line)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: 'var(--accent)',
          }}>{initials(redFighter.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 800,
              color: winnerCorner === 'red' ? 'var(--ink)' : 'var(--ink-dim)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{redFighter.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>
              {redFighter.record} · {redFighter.weightClass}
            </div>
          </div>
        </div>

        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--bg)', border: '1px solid var(--line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900, color: 'var(--ink-dim)', flexShrink: 0,
        }}>VS</div>

        {/* Blue */}
        <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'var(--blue-soft)',
            border: `2px solid ${winnerCorner === 'blue' ? 'var(--blue)' : 'var(--line)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: 'var(--blue)',
          }}>{initials(blueFighter.name)}</div>
          <div style={{ minWidth: 0, textAlign: 'right', flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 800,
              color: winnerCorner === 'blue' ? 'var(--ink)' : 'var(--ink-dim)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{blueFighter.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>
              {blueFighter.record} · {blueFighter.weightClass}
            </div>
          </div>
        </div>
      </div>

      {/* Prediction bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${aPct}%`, background: 'var(--accent)', transition: 'width 600ms' }} />
          <div style={{ width: `${bPct}%`, background: 'var(--blue)', transition: 'width 600ms' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{aPct}%</span>
          <span style={{ color: 'var(--ink-mute)' }}>AI Prediction</span>
          <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{bPct}%</span>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-mute)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Click for full breakdown</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span>
      </div>
    </div>
  )
}
