'use client'
import React, { useEffect, useRef, useState } from 'react'

type Folder = { id: string; name: string }
type MediaItem = {
  id: string
  filename?: string
  alt?: string
  url?: string
  mimeType?: string
  width?: number
  height?: number
  filesize?: number
  sizes?: { thumbnail?: { url?: string } }
}

type Crumb = { id: string | null; name: string }

function formatBytes(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const MediaFolderBrowser: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Crumb[]>([{ id: null, name: 'All folders' }])
  const [folders, setFolders] = useState<Folder[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [mode, setMode] = useState<'folders' | 'media'>('folders')
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const folderQuery =
      currentFolderId === null
        ? '/api/media-folders?where[parent][exists]=false&limit=100&depth=0'
        : `/api/media-folders?where[parent][equals]=${currentFolderId}&limit=100&depth=0`

    fetch(folderQuery)
      .then(r => r.json())
      .then(async (data) => {
        const childFolders: Folder[] = data.docs ?? []
        if (childFolders.length > 0) {
          setFolders(childFolders)
          setMedia([])
          setMode('folders')
          setLoading(false)
        } else if (currentFolderId !== null) {
          const mediaData = await fetch(
            `/api/media?where[folder][equals]=${currentFolderId}&limit=100&depth=0`,
          ).then(r => r.json())
          setMedia(mediaData.docs ?? [])
          setFolders([])
          setMode('media')
          setLoading(false)
        } else {
          setFolders([])
          setMedia([])
          setMode('folders')
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [currentFolderId])

  useEffect(() => {
    if (!selectedMedia) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedMedia(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedMedia])

  const refreshMedia = async () => {
    if (currentFolderId === null) return
    const data = await fetch(
      `/api/media?where[folder][equals]=${currentFolderId}&limit=100&depth=0`,
      { credentials: 'include' },
    ).then(r => r.json())
    setMedia(data.docs ?? [])
  }

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    setUploadError(null)
    let lastError: string | null = null
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('_payload', JSON.stringify({ folder: currentFolderId }))
      const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        lastError = (err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? 'Upload failed'
      }
    }
    if (lastError) setUploadError(lastError)
    await refreshMedia()
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const navigateInto = (folder: Folder) => {
    setLoading(true)
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }])
    setCurrentFolderId(folder.id)
  }

  const navigateTo = (index: number) => {
    setLoading(true)
    const crumb = breadcrumb[index]
    setBreadcrumb(prev => prev.slice(0, index + 1))
    setCurrentFolderId(crumb.id)
  }

  const panelOpen = selectedMedia !== null

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {breadcrumb.map((crumb, i) => {
          const isLast = i === breadcrumb.length - 1
          return (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: 'var(--theme-text)', opacity: 0.4 }}>/</span>}
              <button
                onClick={() => !isLast && navigateTo(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.25rem 0.375rem',
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
      </nav>

      {loading && <p style={{ color: 'var(--theme-text)', opacity: 0.6 }}>Loading…</p>}

      {/* Folder grid */}
      {!loading && mode === 'folders' && (
        folders.length === 0 ? (
          <p style={{ color: 'var(--theme-text)', opacity: 0.6 }}>No folders.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => navigateInto(folder)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1.25rem 1rem',
                  background: 'var(--theme-elevation-50)',
                  border: '1px solid var(--theme-border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-elevation-500)' }}>
                    <path d="M3 7a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.414 1.414A2 2 0 0 0 12.414 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                  </svg>
                <span style={{ fontSize: '0.8rem', color: 'var(--theme-text)', wordBreak: 'break-all' }}>
                  {folder.name}
                </span>
              </button>
            ))}
          </div>
        )
      )}

      {/* Media grid */}
      {!loading && mode === 'media' && (
        <>
          {/* Upload toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                background: 'var(--theme-success)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: uploading ? 'default' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? 'Uploading…' : '+ Upload image'}
            </button>
            {uploadError && (
              <span style={{ fontSize: '0.8rem', color: 'var(--theme-error)', flexShrink: 1 }}>
                {uploadError}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.length) handleUpload(e.target.files) }}
            />
          </div>

          {/* Drop zone / grid */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files)
            }}
            style={{
              borderRadius: '6px',
              border: dragOver ? '2px dashed var(--theme-success)' : '2px dashed transparent',
              padding: dragOver ? '0.5rem' : '0',
              transition: 'border-color 0.15s, padding 0.15s',
            }}
          >
            {media.length === 0 ? (
              <p style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                {dragOver ? 'Drop to upload' : 'No media in this folder. Drop files or click "Upload image" above.'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {media.map(item => {
                  const thumb = item.sizes?.thumbnail?.url ?? item.url
                  const isSelected = selectedMedia?.id === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem',
                        background: 'var(--theme-elevation-50)',
                        border: isSelected
                          ? '2px solid var(--theme-success)'
                          : '1px solid var(--theme-border-color)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0,
                      }}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={item.alt ?? item.filename ?? ''}
                          style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100px', background: 'var(--theme-elevation-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '2rem' }}>🖼️</span>
                        </div>
                      )}
                      <span style={{ fontSize: '0.75rem', padding: '0 0.5rem 0.5rem', wordBreak: 'break-all', opacity: 0.8, color: 'var(--theme-text)' }}>
                        {item.filename}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Backdrop */}
      {panelOpen && (
        <div
          onClick={() => setSelectedMedia(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 100,
          }}
        />
      )}

      {/* Right-side detail panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '380px',
          background: 'var(--theme-bg)',
          borderLeft: '1px solid var(--theme-border-color)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 101,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s ease',
        }}
      >
        {selectedMedia && (
          <>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--theme-border-color)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                {selectedMedia.filename}
              </span>
              <button
                onClick={() => setSelectedMedia(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, color: 'var(--theme-text)', flexShrink: 0, padding: '0.125rem 0.25rem' }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Image preview */}
            <div style={{ background: 'var(--theme-elevation-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', borderBottom: '1px solid var(--theme-border-color)' }}>
              {selectedMedia.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt ?? selectedMedia.filename ?? ''}
                  style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '4px' }}
                />
              ) : (
                <span style={{ fontSize: '3rem' }}>🖼️</span>
              )}
            </div>

            {/* Metadata */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', flexGrow: 1 }}>
              {[
                { label: 'Alt text', value: selectedMedia.alt || '—' },
                { label: 'Type', value: selectedMedia.mimeType || '—' },
                { label: 'Dimensions', value: selectedMedia.width && selectedMedia.height ? `${selectedMedia.width} × ${selectedMedia.height} px` : '—' },
                { label: 'Size', value: formatBytes(selectedMedia.filesize) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--theme-text)', opacity: 0.5, minWidth: '80px', flexShrink: 0 }}>{label}</span>
                  <span style={{ color: 'var(--theme-text)', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Edit button */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--theme-border-color)' }}>
              <a
                href={`/admin/collections/media/${selectedMedia.id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.625rem 1rem',
                  background: 'var(--theme-success)',
                  color: '#fff',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Open editor
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
