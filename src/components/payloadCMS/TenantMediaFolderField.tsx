'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

export const TenantMediaFolderField: React.FC = () => {
  const { id } = useDocumentInfo()
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/media-folders?where[tenant][equals]=${id}&where[parent][exists]=false&limit=1&depth=0`)
      .then(r => r.json())
      .then((data: { docs?: { id: string | number }[] }) => {
        const folderId = data.docs?.[0]?.id
        setHref(
          folderId
            ? `/admin/collections/media-folders?folderId=${folderId}`
            : '/admin/collections/media-folders',
        )
      })
      .catch(() => setHref('/admin/collections/media-folders'))
  }, [id])

  if (!id) return null

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
        Media
      </p>
      <a
        href={href ?? '#'}
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
        }}
      >
        Open Media Folder →
      </a>
    </div>
  )
}
