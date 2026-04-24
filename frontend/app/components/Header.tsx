'use client'

interface Props {
  page: string
  setPage: (p: string) => void
}

export default function Header({ page, setPage }: Props) {
  return (
    <header style={{
      padding: '18px 32px',
      borderBottom: '1px solid var(--line)',
      background: 'var(--surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: 16,
        }}>F</div>
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Fight Oracle
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 28 }}>
        {[['predict', 'Predict'], ['upcoming', 'Upcoming'], ['about', 'About']].map(([key, name]) => (
          <a
            key={key}
            href="#"
            onClick={e => { e.preventDefault(); setPage(key) }}
            style={{
              color: page === key ? 'var(--ink)' : 'var(--ink-dim)',
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              borderBottom: page === key ? '2px solid var(--accent)' : '2px solid transparent',
              paddingBottom: 4,
            }}
          >{name}</a>
        ))}
      </nav>
    </header>
  )
}