'use client'

import { useState } from 'react'
import type { TenantConfig } from '@/lib/tenant/types'
import { devLinkPrefix } from '@/lib/tenant/devLinkPrefix'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'

type Props = {
  config: TenantConfig
  locale: string
  currentSlug?: string
}

export function Nav({ config, locale, currentSlug = '' }: Props) {
  const [open, setOpen] = useState(false)
  const prefix = devLinkPrefix(config)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a
          href={`${prefix}/${locale}`}
          className="font-bold text-xl tracking-tight text-primary"
        >
          {config.name}
        </a>

        <ul className="hidden md:flex items-center gap-1">
          {config.navigation?.map((item) => {
            const href = `${prefix}/${locale}${item.slug ? `/${item.slug}` : ''}`
            const active = currentSlug === (item.slug || 'home')
            return (
              <li key={item.slug}>
                <a
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary bg-primary/8 font-semibold'
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {item.label[locale] ?? item.label['en'] ?? item.slug}
                </a>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1">
            <LocaleSwitcher
              config={config}
              locale={locale}
              currentSlug={currentSlug}
              className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors"
              activeClassName="bg-primary text-white"
              inactiveClassName="text-gray-400 hover:text-primary hover:bg-primary/5"
            />
          </div>

          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-3 space-y-1">
          {config.navigation?.map((item) => {
            const href = `${prefix}/${locale}${item.slug ? `/${item.slug}` : ''}`
            return (
              <a
                key={item.slug}
                href={href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors"
              >
                {item.label[locale] ?? item.label['en'] ?? item.slug}
              </a>
            )
          })}
          <div className="flex gap-2 px-4 pt-2 pb-1">
            <LocaleSwitcher
              config={config}
              locale={locale}
              currentSlug={currentSlug}
              className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide"
              activeClassName="bg-primary text-white"
              inactiveClassName="text-gray-400 hover:text-primary"
            />
          </div>
        </div>
      )}
    </header>
  )
}
