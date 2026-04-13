'use client'

import { useState } from 'react'

const fields = [
  'LoseStreakDif', 'WinStreakDif', 'LongestWinStreakDif',
  'WinDif', 'LossDif', 'TotalRoundDif', 'TotalTitleBoutDif',
  'KODif', 'SubDif', 'HeightDif', 'ReachDif', 'AgeDif',
  'SigStrDif', 'AvgSubAttDif', 'AvgTDDif', 'RedOdds', 'BlueOdds'
]

export default function Home() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(field: string, value: string) {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setResult(null)

    const input = Object.fromEntries(
      fields.map(f => [f, parseFloat(values[f] ?? '0')])
    )

    const res = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })

    const data = await res.json()
    setResult(data.winner)
    setLoading(false)
  }

  return (
    <main style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1rem' }}>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        MMA Fight Predictor
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Vul de statistieken in en voorspel de winnaar
      </p>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {fields.map(field => (
          <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{field}</label>
            <input
              type="number"
              onChange={e => handleChange(field, e.target.value)}
              style={{
                width: '120px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                color: 'var(--text)',
                textAlign: 'right',
                fontSize: '0.875rem'
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: '1.25rem',
          width: '100%',
          background: 'var(--accent)',
          color: '#0d1b2a',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '0.75rem',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Bezig...' : 'Voorspel winnaar'}
      </button>

      {result && (
        <div style={{
          marginTop: '1.5rem',
          background: 'var(--surface)',
          border: '1px solid var(--accent)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Voorspelde winnaar</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{result}</p>
        </div>
      )}

    </main>
  )
}