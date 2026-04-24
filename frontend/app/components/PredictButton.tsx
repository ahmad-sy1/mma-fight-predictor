import type { ReactNode } from 'react'

interface Props {
  enabled: boolean
  loading: boolean
  onClick: () => void
}

export default function PredictButton({ enabled, loading, onClick }: Props): ReactNode {
  return (
    <button
      onClick={onClick}
      disabled={!enabled || loading}
      style={{
        width: '100%',
        padding: '22px 40px',
        background: enabled && !loading ? 'var(--red)' : '#e5e5e5',
        color: enabled && !loading ? '#fff' : '#aaa',
        border: 'none',
        cursor: enabled && !loading ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-bebas)',
        fontSize: 32,
        letterSpacing: '0.08em',
        transition: 'background 200ms, transform 100ms',
        transform: 'scale(1)',
      }}
      onMouseEnter={e => { if (enabled && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#b91c1c' }}
      onMouseLeave={e => { if (enabled && !loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--red)' }}
    >
      <span>{loading ? 'ANALYZING FIGHT...' : 'PREDICT WINNER'}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {loading ? (
          <div style={{
            width: 22, height: 22,
            border: '2.5px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}/>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        )}
      </span>
    </button>
  )
}