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

export function DevPreviewRenderer({ config, page, locale }: Props) {
  const router = useRouter()
  const [liveData, setLiveData] = useState<Page>(page)
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const hasSentReady = useRef(false)

  // Sync when server provides fresh data (e.g. after router.refresh())
  useEffect(() => {
    setLiveData(page)
  }, [page])

  useEffect(() => {
    if (!hasSentReady.current) {
      hasSentReady.current = true
      ready({ serverURL })
    }

    const handler = (event: MessageEvent) => {
      if (event.origin !== serverURL || !event.data || typeof event.data !== 'object') return

      if (event.data.type === 'payload-live-preview' && event.data.data) {
        const incoming = event.data.data as Partial<Page>
        setLiveData(prev => ({
          ...prev,
          ...incoming,
          // Preserve populated tenant — form data has it as an ID
          tenant: prev.tenant,
          // Keep populated backgroundImage when form data only has an ID
          heroSection: incoming.heroSection
            ? {
                ...prev.heroSection,
                ...(incoming.heroSection as typeof prev.heroSection),
                backgroundImage:
                  typeof (incoming.heroSection as typeof prev.heroSection)?.backgroundImage === 'object'
                    ? (incoming.heroSection as typeof prev.heroSection)?.backgroundImage
                    : prev.heroSection?.backgroundImage,
              }
            : prev.heroSection,
          // Keep populated ogImage when form data only has an ID
          meta: incoming.meta
            ? {
                ...prev.meta,
                ...(incoming.meta as typeof prev.meta),
                ogImage:
                  typeof (incoming.meta as typeof prev.meta)?.ogImage === 'object'
                    ? (incoming.meta as typeof prev.meta)?.ogImage
                    : prev.meta?.ogImage,
              }
            : prev.meta,
        } as Page))
      } else if (event.data.type === 'payload-document-event') {
        // After autosave/publish: sync latest draft from server
        router.refresh()
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [router, serverURL])

  return <TenantPageRenderer config={config} page={liveData} locale={locale} />
}
