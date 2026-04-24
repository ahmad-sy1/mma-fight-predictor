interface Props {
  enabled: boolean
  loading: boolean
  onClick: () => void
}

export default function PredictButton({ enabled, loading, onClick }: Props) {
  const active = enabled && !loading
  return (
    <button
      onClick={onClick}
      disabled={!active}
      style={{
        width: '100%',
        padding: '16px 24px',
        background: active ? 'var(--accent)' : 'var(--line-strong)',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        fontSize: 16, fontWeight: 700,
        letterSpacing: '-0.01em',
        cursor: active ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'background 150ms',
      }}
      onMouseEnter={e => { if (active) (e.currentTarget as HTMLButtonElement).style.background = '#c5002f' }}
      onMouseLeave={e => { if (active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
    >
      {loading && (
        <div style={{
          width: 18, height: 18,
          border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {loading ? 'Predicting…' : 'Predict Winner →'}
    </button>
  )
}