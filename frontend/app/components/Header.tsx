'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks: [string, string][] = [
  ['/', 'Predict'],
  ['/upcoming', 'Upcoming'],
  ['/about', 'About'],
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="py-[18px] px-8 border-b border-line bg-surface flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] rounded-lg bg-accent flex items-center justify-center text-white font-extrabold text-base">
          F
        </div>
        <span className="text-[17px] font-extrabold tracking-[-0.01em]">Fight Oracle</span>
      </div>

      <nav className="flex gap-7">
        {navLinks.map(([href, name]) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`no-underline text-sm font-semibold pb-1 border-b-2 transition-colors duration-200 ${
                active ? 'text-ink border-accent' : 'text-ink-dim border-transparent'
              }`}
            >
              {name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}