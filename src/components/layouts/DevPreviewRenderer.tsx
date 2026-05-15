'use client'

import { ready } from '@payloadcms/live-preview'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { TenantPageRenderer } from './TenantPageRenderer'
import type { TenantConfig } from '@/lib/tenant/types'
import type { Page } from '@/payload-types'

type Props = {
  config: TenantConfig
  page: Page
  locale: string
}

// Live preview overlay keyed to server page version.
// Key combines id + updatedAt so the overlay auto-invalidates after router.refresh().
type PageOverlay = { key: string; merged: Page }

function pageKey(p: Page) {
  return `${p.id}:${p.updatedAt}`
}

export function DevPreviewRenderer({ config, page, locale }: Props) {
  const router = useRouter()
  // null = no live edits yet; overlay invalidates when server page version changes
  const [overlay, setOverlay] = useState<PageOverlay | null>(null)
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const hasSentReady = useRef(false)

  // Use overlay only while it matches the current server page version.
  // When page changes (e.g. after router.refresh()), overlay is ignored automatically.
  const liveData = overlay?.key === pageKey(page) ? overlay.merged : page

  useEffect(() => {
    if (!hasSentReady.current) {
      hasSentReady.current = true
      ready({ serverURL })
    }

    const handler = (event: MessageEvent) => {
      if (event.origin !== serverURL || !event.data || typeof event.data !== 'object') return

      if (event.data.type === 'payload-live-preview' && event.data.data) {
        const incoming = event.data.data as Partial<Page>
        setOverlay(prev => {
          const key = pageKey(page)
          const base = prev?.key === key ? prev.merged : page
          return {
            key,
            merged: {
              ...base,
              ...incoming,
              // Preserve populated tenant — form data has it as an ID
              tenant: base.tenant,
              // Keep populated backgroundImage when form data only has an ID
              heroSection: incoming.heroSection
                ? {
                    ...base.heroSection,
                    ...(incoming.heroSection as typeof base.heroSection),
                    backgroundImage:
                      typeof (incoming.heroSection as typeof base.heroSection)?.backgroundImage === 'object'
                        ? (incoming.heroSection as typeof base.heroSection)?.backgroundImage
                        : base.heroSection?.backgroundImage,
                  }
                : base.heroSection,
              // Keep populated ogImage when form data only has an ID
              meta: incoming.meta
                ? {
                    ...base.meta,
                    ...(incoming.meta as typeof base.meta),
                    ogImage:
                      typeof (incoming.meta as typeof base.meta)?.ogImage === 'object'
                        ? (incoming.meta as typeof base.meta)?.ogImage
                        : base.meta?.ogImage,
                  }
                : base.meta,
            } as Page,
          }
        })
      } else if (event.data.type === 'payload-document-event') {
        // After autosave/publish: fetch latest draft from server; overlay invalidates automatically
        router.refresh()
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [router, serverURL, page])

  return <TenantPageRenderer config={config} page={liveData} locale={locale} />
}
