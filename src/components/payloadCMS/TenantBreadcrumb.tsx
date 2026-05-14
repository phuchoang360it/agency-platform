'use client'
import { useFormFields } from '@payloadcms/ui'

export const TenantBreadcrumb: React.FC = () => {
  const tenantField = useFormFields(([fields]) => fields['tenant'])
  const tenantId = tenantField?.value as string | undefined

  if (!tenantId) return null

  return (
    <div style={{ padding: '0 0 1rem', marginBottom: '0.5rem' }}>
      <a
        href={`/admin/collections/tenants/${tenantId}`}
        style={{
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
        }}
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
    </div>
  )
}
