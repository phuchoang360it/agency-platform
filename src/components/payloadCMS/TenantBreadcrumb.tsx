'use client'
import { useEffect, useState } from 'react'
import { useFormFields, useLocale } from '@payloadcms/ui'

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--theme-text)',
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: '0.375rem',
  textDecoration: 'none',
  transition: 'background 0.15s, border-color 0.15s',
}

export const TenantBreadcrumb: React.FC = () => {
  const tenantField = useFormFields(([fields]) => fields['tenant'])
  const slugField = useFormFields(([fields]) => fields['slug'])
  const locale = useLocale()
  const tenantId = tenantField?.value as string | undefined
  const [tenantDomain, setTenantDomain] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenants/${tenantId}?depth=0`)
      .then(r => r.json())
      .then(data => setTenantDomain(data?.domains?.[0]?.domain ?? null))
      .catch(() => setTenantDomain(null))
  }, [tenantId])

  if (!tenantId) return null

  const slug = slugField?.value as string | undefined
  const localeCode = locale?.code ?? 'en'
  const slugPath = slug && slug !== 'home' ? `/${slug}` : ''
  const websiteUrl = tenantDomain
    ? process.env.NODE_ENV === 'development'
      ? `${window.location.origin}/tenant/${tenantDomain}/${localeCode}${slugPath}`
      : `https://${tenantDomain}/${localeCode}${slugPath}`
    : null

  return (
    <div style={{ padding: '0 0 1rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <a
        href={`/admin/collections/tenants/${tenantId}`}
        style={btnStyle}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.background = 'var(--theme-elevation-100)'
          el.style.borderColor = 'var(--theme-elevation-250)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.background = 'var(--theme-elevation-50)'
          el.style.borderColor = 'var(--theme-elevation-150)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <path d="M8.5 2.5L4 7l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Tenant
      </a>
      <a
        href={websiteUrl ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...btnStyle,
          ...(websiteUrl ? {} : { opacity: 0.4, pointerEvents: 'none' }),
        }}
        onMouseEnter={e => {
          if (!websiteUrl) return
          const el = e.currentTarget
          el.style.background = 'var(--theme-elevation-100)'
          el.style.borderColor = 'var(--theme-elevation-250)'
        }}
        onMouseLeave={e => {
          if (!websiteUrl) return
          const el = e.currentTarget
          el.style.background = 'var(--theme-elevation-50)'
          el.style.borderColor = 'var(--theme-elevation-150)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2.5 11.5L11.5 2.5M11.5 2.5H6.5M11.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Go to website
      </a>
    </div>
  )
}
