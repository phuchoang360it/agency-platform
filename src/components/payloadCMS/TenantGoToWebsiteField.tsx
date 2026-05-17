'use client'
import { useDocumentInfo, useLocale } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

export const TenantGoToWebsiteField: React.FC = () => {
  const { id } = useDocumentInfo()
  const locale = useLocale()
  const [domain, setDomain] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/tenants/${id}?depth=0`)
      .then(r => r.json())
      .then((data: { domains?: { domain: string }[] }) => {
        setDomain(data.domains?.[0]?.domain ?? null)
      })
      .catch(() => setDomain(null))
  }, [id])

  if (!id) return null

  const localeCode = locale?.code ?? 'en'
  const websiteUrl = domain
    ? process.env.NODE_ENV === 'development'
      ? `${window.location.origin}/tenant/${domain}/${localeCode}/`
      : `https://${domain}/${localeCode}/`
    : null

  return (
    <div style={{ padding: '0.75rem 0 1rem' }}>
      <p
        style={{
          margin: '0 0 0.5rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-800)',
        }}
      >
        Website
      </p>
      <a
        href={websiteUrl ?? '#'}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          border: '1px solid var(--theme-elevation-200)',
          fontSize: '0.8rem',
          fontWeight: 500,
          textDecoration: 'none',
          color: 'var(--theme-text)',
          backgroundColor: 'var(--theme-elevation-50)',
          ...(websiteUrl ? {} : { opacity: 0.4, pointerEvents: 'none' }),
        }}
      >
        Go to website →
      </a>
    </div>
  )
}
