import { Fighter } from '../types'

interface Props {
  a: Fighter
  b: Fighter
}

type Direction = 'higher' | 'lower'

const rows: [string, (f: Fighter) => number | string, Direction][] = [
  ['Win streak',        f => f.winStreak,         'higher'],
  ['Longest win streak',f => f.longestWinStreak,  'higher'],
  ['Wins',              f => f.wins,              'higher'],
  ['Losses',            f => f.losses,            'lower'],
  ['Total rounds',      f => f.totalRounds ?? 0,  'higher'],
  ['Title bouts',       f => f.titleBouts,        'higher'],
  ['KO wins',           f => f.koWins,            'higher'],
  ['Sub wins',          f => f.subWins,           'higher'],
  ['Height (cm)',        f => f.heightCms ?? 0,    'higher'],
  ['Reach (cm)',         f => f.reachCms ?? 0,     'higher'],
  ['Age',               f => f.age ?? 0,          'lower'],
  ['Sig str / min',     f => f.avgSigStr,         'higher'],
  ['Str accuracy %',    f => f.sigStrAcc,         'higher'],
  ['TD avg',            f => f.avgTD,             'higher'],
  ['TD accuracy %',     f => f.tdAcc,             'higher'],
  ['Sub att / 15 min',  f => f.avgSubAtt,         'higher'],
]

export default function DiffTable({ a, b }: Props) {
  return (
    <div className="bg-surface shadow-card rounded-xl p-5 mt-4">
      <div className="text-[11px] font-extrabold tracking-[0.16em] text-ink-dim mb-3.5">
        HEAD-TO-HEAD DIFFERENTIAL
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-[3px] text-[13px]">
        <div className="text-[10px] font-extrabold tracking-[0.14em] text-accent text-right">
          {a.name.toUpperCase()}
        </div>
        <div />
        <div className="text-[10px] font-extrabold tracking-[0.14em] text-blue">
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
              <div key={`${label}-a`} className={`text-right py-[3px] ${aWins ? 'font-extrabold text-accent' : 'font-medium text-ink-dim'}`}>
                {va}
              </div>
              <div key={`${label}-l`} className="text-[10.5px] text-ink-mute text-center self-center tracking-[0.08em] uppercase">
                {label}
              </div>
              <div key={`${label}-b`} className={`py-[3px] ${bWins ? 'font-extrabold text-blue' : 'font-medium text-ink-dim'}`}>
                {vb}
              </div>
            </>
          )
        })}
      </div>
    </div>
  )
}