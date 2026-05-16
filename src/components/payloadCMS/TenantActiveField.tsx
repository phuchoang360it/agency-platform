'use client'
import { useField } from '@payloadcms/ui'
import React from 'react'

export const TenantActiveField: React.FC = () => {
  const { value, setValue } = useField<boolean>({ path: 'active' })
  const active = !!value

  return (
    <div style={{ padding: '0.75rem 0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-800)',
          }}
        >
          Active
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => setValue(!active)}
          style={{
            width: '2.25rem',
            height: '1.25rem',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            backgroundColor: active ? 'var(--theme-success-500, #22c55e)' : 'var(--theme-elevation-300)',
            position: 'relative',
            transition: 'background-color 0.18s ease',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: active ? 'calc(100% - 1rem - 2px)' : '2px',
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.18s ease',
              display: 'block',
            }}
          />
        </button>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: active ? 'var(--theme-success-500, #22c55e)' : 'var(--theme-elevation-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {active ? 'On' : 'Off'}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: '0.78rem',
          color: 'var(--theme-elevation-500)',
          lineHeight: 1.45,
        }}
      >
        {active
          ? 'Tenant is live — pages are served to visitors.'
          : 'Tenant is hidden — pages will not be served.'}
      </p>
    </div>
  )
}
