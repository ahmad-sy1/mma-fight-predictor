'use client'

import type { ReactNode } from 'react'

export default function Header(): ReactNode {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '2px solid #0a0a0a',
      padding: '0 48px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 10, height: 10,
          background: '#dc2626',
          borderRadius: '50%',
        }}/>
        <span style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 22,
          letterSpacing: '0.08em',
          color: '#0a0a0a',
        }}>
          FIGHT ORACLE
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 32 }}>
        {['Predict', 'About'].map((item, i) => (
          <a key={item} href="#" style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            color: i === 0 ? '#dc2626' : '#6b6b6b',
            borderBottom: i === 0 ? '2px solid #dc2626' : '2px solid transparent',
            paddingBottom: 2,
          }}>{item}</a>
        ))}
      </nav>
    </header>
  )
}