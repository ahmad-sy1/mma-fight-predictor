import { Fighter } from '../types'

interface Props {
  a: Fighter
  b: Fighter
}

type Direction = 'higher' | 'lower'

const rows: [string, (f: Fighter) => number | string, Direction][] = [
  ['Win streak',        f => f.winStreak,                          'higher'],
  ['Longest win streak',f => f.longestWinStreak,                   'higher'],
  ['Wins',              f => f.wins,                               'higher'],
  ['Losses',            f => f.losses,                             'lower'],
  ['Total rounds',      f => f.totalRounds,                        'higher'],
  ['Title bouts',       f => f.titleBouts,                         'higher'],
  ['KO wins',           f => f.koWins,                             'higher'],
  ['Sub wins',          f => f.subWins,                            'higher'],
  ['Height (cm)',        f => f.heightCms,                          'higher'],
  ['Reach (cm)',         f => f.reachCms,                           'higher'],
  ['Age',               f => f.age,                                'lower'],
  ['Sig str / min',     f => f.avgSigStr,                          'higher'],
  ['Str accuracy %',    f => f.sigStrAcc,                          'higher'],
  ['TD avg',            f => f.avgTD,                              'higher'],
  ['TD accuracy %',     f => f.tdAcc,                              'higher'],
  ['Sub att / 15 min',  f => f.avgSubAtt,                          'higher'],
]

export default function DiffTable({ a, b }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      boxShadow: 'var(--card-shadow)',
      borderRadius: 12,
      padding: 20,
      marginTop: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: '0.16em',
        color: 'var(--ink-dim)', marginBottom: 14,
      }}>
        HEAD-TO-HEAD DIFFERENTIAL
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '3px 16px', fontSize: 13 }}>
        {/* header */}
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textAlign: 'right' }}>
          {a.name.toUpperCase()}
        </div>
        <div />
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--blue)' }}>
          {b.name.toUpperCase()}
        </div>

        {rows.map(([label, val, dir]) => {
          const va = val(a)
          const vb = val(b)
          const numA = typeof va === 'number' ? va : parseFloat(String(va))
          const numB = typeof vb === 'number' ? vb : parseFloat(String(vb))
          const aWins = dir === 'higher' ? numA > numB : numA < numB
          const bWins = dir === 'higher' ? numB > numA : numB < numA

          return (
            <>
              <div key={`${label}-a`} style={{
                textAlign: 'right', fontWeight: aWins ? 800 : 500,
                color: aWins ? 'var(--accent)' : 'var(--ink-dim)', padding: '3px 0',
              }}>{va}</div>
              <div key={`${label}-l`} style={{
                fontSize: 10.5, color: 'var(--ink-mute)', textAlign: 'center',
                alignSelf: 'center', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>{label}</div>
              <div key={`${label}-b`} style={{
                fontWeight: bWins ? 800 : 500,
                color: bWins ? 'var(--blue)' : 'var(--ink-dim)', padding: '3px 0',
              }}>{vb}</div>
            </>
          )
        })}
      </div>
    </div>
  )
}
