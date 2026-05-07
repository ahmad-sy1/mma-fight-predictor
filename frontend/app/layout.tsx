import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Fight Oracle',
  description: 'AI-powered MMA fight prediction engine',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <Header />
        {children}
      </body>
    </html>
  )
}
