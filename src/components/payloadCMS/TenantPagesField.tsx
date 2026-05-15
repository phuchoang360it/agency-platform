'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

type PageRow = { id: string; title?: string; slug: string; pageTemplate?: string; updatedAt: string }

export const TenantPagesField: React.FC = () => {
  const { id } = useDocumentInfo()
  const [pages, setPages] = useState<PageRow[]>([])
  // Track which tenant id the current pages belong to.
  // loading is true when id is set but fetch for it hasn't completed yet.
  const [fetchedForId, setFetchedForId] = useState<typeof id>(undefined)
  const loading = !!id && fetchedForId !== id

  useEffect(() => {
    if (!id) return
    fetch(`/api/pages?where[tenant][equals]=${id}&limit=100&depth=0`)
      .then(r => r.json())
      .then(data => {
        setPages(data.docs ?? [])
        setFetchedForId(id)
      })
      .catch(() => {
        setPages([])
        setFetchedForId(id)
      })
  }, [id])

  if (!id)
    return (
      <p style={{ padding: '1rem 0', color: 'var(--theme-text)' }}>Save tenant first to see pages.</p>
    )

  if (loading) return <p style={{ padding: '1rem 0' }}>Loading pages…</p>

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Pages</h3>
      {pages.length === 0 ? (
        <p>No pages yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--theme-border-color)' }}>
              <th style={{ padding: '0.5rem' }}>Title</th>
              <th style={{ padding: '0.5rem' }}>Slug</th>
              <th style={{ padding: '0.5rem' }}>Template</th>
              <th style={{ padding: '0.5rem' }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {pages.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--theme-border-color)' }}>
                <td style={{ padding: '0.5rem' }}>
                  <a href={`/admin/collections/pages/${p.id}`} target="_blank" rel="noreferrer">
                    {p.title || '(untitled)'}
                  </a>
                </td>
                <td style={{ padding: '0.5rem' }}>{p.slug}</td>
                <td style={{ padding: '0.5rem' }}>{p.pageTemplate ?? '—'}</td>
                <td style={{ padding: '0.5rem' }}>{new Date(p.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
