'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function AccountMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as HTMLElement)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="hidden sm:block relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-8 h-8 rounded border border-white/15 text-text-muted hover:text-white hover:border-white/30 transition-colors"
        aria-label="Account menu"
      >
        <span className="text-sm leading-none">☰</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-navy-light border border-white/10 shadow-xl z-50 min-w-[160px]">
          <Link href="/support" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-xs font-head font-bold tracking-widest text-text-muted hover:text-white hover:bg-white/5 transition-colors">
            SUPPORT
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-xs font-head font-bold tracking-widest text-text-muted hover:text-white hover:bg-white/5 transition-colors border-t border-white/5">
            SETTINGS
          </Link>
          <div className="border-t border-white/5 px-2 py-1">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  )
}
