'use client'
import { useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Folder = { id: string; name: string }
type MediaItem = {
  id: string
  filename?: string
  alt?: string
  url?: string
  mimeType?: string
  sizes?: { thumbnail?: { url?: string } }
}
type Crumb = { id: string | null; name: string }

function extractId(v: unknown): string | null {
  if (!v) return null
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if ('id' in obj) return String(obj.id)
    // Payload polymorphic relationship: { relationTo: 'tenants', value: id | doc }
    if ('value' in obj) return extractId(obj.value)
  }
  return null
}

type PickerProps = {
  onSelect: (item: MediaItem) => void
  onClose: () => void
  initialFolderId?: string
  initialFolderName?: string
  tenantId?: string | null
}

const FolderPicker: React.FC<PickerProps> = ({ onSelect, onClose, initialFolderId, initialFolderName, tenantId }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId ?? null)
  const [breadcrumb, setBreadcrumb] = useState<Crumb[]>(
    initialFolderId
      ? [{ id: initialFolderId, name: initialFolderName ?? 'Media' }]
      : [],
  )
  const [folders, setFolders] = useState<Folder[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mediaPage, setMediaPage] = useState(1)
  const [mediaTotalPages, setMediaTotalPages] = useState(1)
  const [mediaTotalDocs, setMediaTotalDocs] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const LIMIT = 24
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentFolderId) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('_payload', JSON.stringify({
      alt: file.name,
      folder: currentFolderId,
      ...(tenantId ? { tenant: tenantId } : {}),
    }))
    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      const json = await res.json() as { doc?: MediaItem } | MediaItem
      // Payload v3 wraps response: { doc: { ... } }
      const uploaded: MediaItem = (json as { doc?: MediaItem }).doc ?? (json as MediaItem)
      if (uploaded?.id) {
        onSelect(uploaded)
      } else {
        setRefreshKey(k => k + 1)
      }
    } catch {
      setRefreshKey(k => k + 1)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Fallback: if parent didn't resolve tenantRoot in time, auto-navigate into tenant folder on mount
  useEffect(() => {
    if (currentFolderId !== null || !tenantId) return
    fetch(`/api/media-folders?where[tenant][equals]=${tenantId}&where[parent][exists]=false&limit=1&depth=0`)
      .then(r => r.json())
      .then((data: { docs?: Folder[] }) => {
        const folder = data.docs?.[0]
        if (folder) {
          setBreadcrumb([{ id: folder.id, name: folder.name }])
          setCurrentFolderId(folder.id)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentFolderId === null) {
      fetch('/api/media-folders?where[parent][exists]=false&limit=100&depth=0')
        .then(r => r.json())
        .then(data => {
          setFolders(data.docs ?? [])
          setMedia([])
          setMediaTotalPages(1)
          setMediaTotalDocs(0)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      Promise.all([
        fetch(`/api/media-folders?where[parent][equals]=${currentFolderId}&limit=100&depth=0`).then(r => r.json()),
        fetch(`/api/media?where[folder][equals]=${currentFolderId}&limit=${LIMIT}&page=${mediaPage}&depth=0`).then(r => r.json()),
      ])
        .then(([folderData, mediaData]) => {
          setFolders(folderData.docs ?? [])
          setMedia(mediaData.docs ?? [])
          setMediaTotalPages(mediaData.totalPages ?? 1)
          setMediaTotalDocs(mediaData.totalDocs ?? 0)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [currentFolderId, mediaPage, refreshKey])

  const navigateInto = (folder: Folder) => {
    setLoading(true)
    setMediaPage(1)
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }])
    setCurrentFolderId(folder.id)
  }

  const navigateTo = useCallback((index: number) => {
    setLoading(true)
    setMediaPage(1)
    const crumb = breadcrumb[index]
    setBreadcrumb(prev => prev.slice(0, index + 1))
    setCurrentFolderId(crumb.id)
  }, [breadcrumb])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Modal header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--theme-border-color)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--theme-text)' }}>Choose Media</span>
          <button
            type="button"
            onClick={() => {
              const url = initialFolderId
                ? `/admin/collections/media-folders?folderId=${initialFolderId}`
                : '/admin/collections/media-folders'
              window.open(url, '_blank')
              onClose()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.55rem',
              background: 'none',
              color: 'var(--theme-elevation-500)',
              border: '1px solid var(--theme-border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
            title="Open media folders in new tab"
          >
            Go to media folders
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, color: 'var(--theme-text)', padding: '0 0.25rem' }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.75rem 1.25rem', flexWrap: 'wrap', borderBottom: '1px solid var(--theme-border-color)', flexShrink: 0 }}>
        {breadcrumb.map((crumb, i) => {
          const isLast = i === breadcrumb.length - 1
          return (
            <React.Fragment key={(crumb.id ?? 'root') + i}>
              {i > 0 && <span style={{ color: 'var(--theme-text)', opacity: 0.4 }}>/</span>}
              <button
                type="button"
                onClick={() => !isLast && navigateTo(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.2rem 0.35rem',
                  cursor: isLast ? 'default' : 'pointer',
                  color: isLast ? 'var(--theme-text)' : 'var(--theme-elevation-900)',
                  fontWeight: isLast ? 600 : 400,
                  fontSize: '0.875rem',
                  borderRadius: '4px',
                  textDecoration: isLast ? 'none' : 'underline',
                }}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          )
        })}
        {currentFolderId !== null && (
          <>
            <button
              type="button"
              disabled={uploading}
              onClick={() => uploadInputRef.current?.click()}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.65rem',
                background: 'var(--theme-elevation-100)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '4px',
                cursor: uploading ? 'default' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                opacity: uploading ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              {uploading ? 'Uploading…' : '+ Upload image'}
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
          </>
        )}
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {loading && <p style={{ color: 'var(--theme-text)', opacity: 0.6 }}>Loading…</p>}

        {!loading && (
          <>
            {/* Folders grid */}
            {folders.length > 0 && (
              <div style={{ marginBottom: media.length > 0 ? '1.5rem' : 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.875rem' }}>
                  {folders.map(folder => (
                    <button
                      type="button"
                      key={folder.id}
                      onClick={() => navigateInto(folder)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '1.25rem 0.75rem',
                        background: 'var(--theme-elevation-50)',
                        border: '1px solid var(--theme-border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-elevation-500)' }}>
                        <path d="M3 7a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.414 1.414A2 2 0 0 0 12.414 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                      </svg>
                      <span style={{ fontSize: '0.78rem', color: 'var(--theme-text)', wordBreak: 'break-all' }}>
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {media.length === 0 && folders.length === 0 && (
              <p style={{ color: 'var(--theme-text)', opacity: 0.6 }}>No media in this folder.</p>
            )}

            {media.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.875rem' }}>
                {media.map(item => {
                  const thumb = item.sizes?.thumbnail?.url ?? item.url
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => onSelect(item)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem',
                        background: 'var(--theme-elevation-50)',
                        border: '1px solid var(--theme-border-color)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0,
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-success)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border-color)' }}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={item.alt ?? item.filename ?? ''}
                          style={{ width: '100%', height: '90px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '90px', background: 'var(--theme-elevation-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                        </div>
                      )}
                      <span style={{ fontSize: '0.72rem', padding: '0 0.5rem 0.5rem', wordBreak: 'break-all', opacity: 0.8, color: 'var(--theme-text)' }}>
                        {item.filename}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {mediaTotalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  disabled={mediaPage <= 1}
                  onClick={() => { setLoading(true); setMediaPage(p => p - 1) }}
                  style={{ padding: '0.375rem 0.75rem', background: 'var(--theme-elevation-100)', border: '1px solid var(--theme-border-color)', borderRadius: '4px', fontSize: '0.875rem', cursor: mediaPage <= 1 ? 'default' : 'pointer', opacity: mediaPage <= 1 ? 0.4 : 1, color: 'var(--theme-text)' }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--theme-text)', opacity: 0.8 }}>
                  Page {mediaPage} of {mediaTotalPages} ({mediaTotalDocs} items)
                </span>
                <button
                  type="button"
                  disabled={mediaPage >= mediaTotalPages}
                  onClick={() => { setLoading(true); setMediaPage(p => p + 1) }}
                  style={{ padding: '0.375rem 0.75rem', background: 'var(--theme-elevation-100)', border: '1px solid var(--theme-border-color)', borderRadius: '4px', fontSize: '0.875rem', cursor: mediaPage >= mediaTotalPages ? 'default' : 'pointer', opacity: mediaPage >= mediaTotalPages ? 0.4 : 1, color: 'var(--theme-text)' }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

type TenantRoot = { id: string; name: string }

type Props = {
  field: { label?: string; name: string }
  path: string
}

export const FolderMediaPickerField: React.FC<Props> = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const { value: tenantValue } = useField<unknown>({ path: 'tenant' })
  const [preview, setPreview] = useState<MediaItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [tenantRoot, setTenantRoot] = useState<TenantRoot | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Resolve tenant's root media folder whenever tenant changes
  useEffect(() => {
    const tenantId = extractId(tenantValue)
    let cancelled = false
    void (async () => {
      if (!tenantId) {
        setTenantRoot(null)
        return
      }
      try {
        const data = await fetch(
          `/api/media-folders?where[tenant][equals]=${tenantId}&where[parent][exists]=false&limit=1&depth=0`,
        ).then(r => r.json()) as { docs?: { id: string; name: string }[] }
        if (cancelled) return
        const folder = data.docs?.[0]
        setTenantRoot(folder ? { id: folder.id, name: folder.name } : null)
      } catch {
        if (!cancelled) setTenantRoot(null)
      }
    })()
    return () => { cancelled = true }
  }, [tenantValue])

  // Fetch preview when selected media ID changes
  useEffect(() => {
    if (!value) return
    let cancelled = false
    fetch(`/api/media/${value}?depth=0`)
      .then(r => r.json())
      .then((data: MediaItem) => { if (!cancelled) setPreview(data) })
      .catch(() => { if (!cancelled) setPreview(null) })
    return () => { cancelled = true }
  }, [value])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const handleSelect = (item: MediaItem) => {
    setValue(item.id)
    setPreview(item)
    setModalOpen(false)
  }

  const thumb = preview?.sizes?.thumbnail?.url ?? preview?.url

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Label */}
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--theme-elevation-800)', marginBottom: '0.5rem' }}>
        {field.label ?? field.name}
      </label>

      {/* Current selection */}
      {value && preview ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-border-color)', borderRadius: '6px', marginBottom: '0.5rem' }}>
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt={preview.alt ?? preview.filename ?? ''} style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '56px', height: '40px', background: 'var(--theme-elevation-100)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.2rem' }}>🖼️</span>
            </div>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--theme-text)', wordBreak: 'break-all', flex: 1 }}>
            {preview.filename}
          </span>
          <button
            type="button"
            onClick={() => { setValue(null as unknown as string); setPreview(null) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-error)', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, padding: '0.25rem' }}
            aria-label="Remove"
          >
            × Remove
          </button>
        </div>
      ) : null}

      {/* Choose / Change button — always enabled, modal handles missing tenant root */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.45rem 0.875rem',
          background: 'var(--theme-elevation-100)',
          color: 'var(--theme-text)',
          border: '1px solid var(--theme-border-color)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 500,
        }}
      >
        {value ? 'Choose different' : 'Choose image'}
      </button>

      {/* Modal — rendered via portal so it escapes any stacking context (live preview, transforms) */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={backdropRef}
          onClick={e => { if (e.target === backdropRef.current) setModalOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            style={{
              background: 'var(--theme-bg)',
              borderRadius: '8px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
              width: 'min(860px, 92vw)',
              height: 'min(620px, 88vh)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <FolderPicker
              onSelect={handleSelect}
              onClose={() => setModalOpen(false)}
              initialFolderId={tenantRoot?.id}
              initialFolderName={tenantRoot?.name}
              tenantId={extractId(tenantValue)}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
