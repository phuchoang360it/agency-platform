'use client'
import React, { useEffect, useRef, useState } from 'react'
import { UploadModal } from './UploadModal'

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

async function buildBreadcrumbFromId(folderId: string): Promise<Crumb[]> {
  const chain: Crumb[] = []
  let currentId: string | null = folderId
  while (currentId) {
    const data = await fetch(`/api/media-folders/${currentId}?depth=0`).then(r => r.json()) as { name: string; parent?: string | { id: string } }
    chain.unshift({ id: currentId, name: data.name })
    const parent: string | { id: string } | undefined = data.parent
    currentId = parent
      ? (typeof parent === 'string' ? parent : (parent as { id: string }).id)
      : null
  }
  return [{ id: null, name: 'All folders' }, ...chain]
}

export const MediaFolderBrowser: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('folderId')
  })
  const [breadcrumb, setBreadcrumb] = useState<Crumb[]>([{ id: null, name: 'All folders' }])
  const [folders, setFolders] = useState<Folder[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [createFolderError, setCreateFolderError] = useState<string | null>(null)
  const [mediaPage, setMediaPage] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    return parseInt(new URLSearchParams(window.location.search).get('page') ?? '1', 10) || 1
  })
  const [mediaTotalPages, setMediaTotalPages] = useState(1)
  const [mediaTotalDocs, setMediaTotalDocs] = useState(0)
  const [mediaLimit, setMediaLimit] = useState(24)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [dropFile, setDropFile] = useState<File | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const currentFolderIdRef = useRef(currentFolderId)

  useEffect(() => {
    currentFolderIdRef.current = currentFolderId
  }, [currentFolderId])

  useEffect(() => {
    const folderId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('folderId')
      : null
    if (folderId) {
      buildBreadcrumbFromId(folderId).then(setBreadcrumb).catch(() => {})
    }

    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('folderId')
      const page = parseInt(params.get('page') ?? '1', 10) || 1
      if (id === currentFolderIdRef.current) {
        setMediaPage(page)
        return
      }
      currentFolderIdRef.current = id
      setLoading(true)
      setCurrentFolderId(id)
      setMediaPage(page)
      if (id) {
        buildBreadcrumbFromId(id).then(setBreadcrumb).catch(() => {})
      } else {
        setBreadcrumb([{ id: null, name: 'All folders' }])
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
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
        fetch(`/api/media?where[folder][equals]=${currentFolderId}&limit=${mediaLimit}&page=${mediaPage}&depth=0`).then(r => r.json()),
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
  }, [currentFolderId, mediaPage, mediaLimit])

  useEffect(() => {
    if (!selectedMedia) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedMedia(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedMedia])

  useEffect(() => {
    if (addingFolder && folderInputRef.current) {
      folderInputRef.current.focus()
    }
  }, [addingFolder])

  const updateUrl = (folderId: string | null, page = 1) => {
    const url = new URL(window.location.href)
    if (folderId) {
      url.searchParams.set('folderId', folderId)
    } else {
      url.searchParams.delete('folderId')
    }
    if (page > 1) {
      url.searchParams.set('page', String(page))
    } else {
      url.searchParams.delete('page')
    }
    window.history.pushState({}, '', url.toString())
  }

  const refreshContent = async () => {
    if (currentFolderId === null) return
    const [folderData, mediaData] = await Promise.all([
      fetch(`/api/media-folders?where[parent][equals]=${currentFolderId}&limit=100&depth=0`, { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/media?where[folder][equals]=${currentFolderId}&limit=${mediaLimit}&page=${mediaPage}&depth=0`, { credentials: 'include' }).then(r => r.json()),
    ])
    setFolders(folderData.docs ?? [])
    setMedia(mediaData.docs ?? [])
    setMediaTotalPages(mediaData.totalPages ?? 1)
    setMediaTotalDocs(mediaData.totalDocs ?? 0)
  }

  const handleDelete = async () => {
    if (!selectedMedia) return
    setDeleting(true)
    try {
      await fetch(`/api/media/${selectedMedia.id}`, { method: 'DELETE', credentials: 'include' })
      setMedia(prev => prev.filter(m => m.id !== selectedMedia.id))
      setMediaTotalDocs(prev => prev - 1)
      setDeleteConfirmOpen(false)
      setSelectedMedia(null)
      await refreshContent()
    } finally {
      setDeleting(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('_payload', JSON.stringify({ folder: currentFolderId, filename: file.name }))
    const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'include' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setUploadError((err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? 'Upload failed')
    }
    await refreshContent()
    setUploading(false)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentFolderId) return
    setCreatingFolder(true)
    setCreateFolderError(null)
    const res = await fetch('/api/media-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newFolderName.trim(), parent: currentFolderId }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setCreateFolderError((err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? 'Failed to create folder')
    } else {
      setAddingFolder(false)
      setNewFolderName('')
      await refreshContent()
    }
    setCreatingFolder(false)
  }

  const navigateInto = (folder: Folder) => {
    setLoading(true)
    setAddingFolder(false)
    setNewFolderName('')
    setCreateFolderError(null)
    setMediaPage(1)
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }])
    setCurrentFolderId(folder.id)
    updateUrl(folder.id, 1)
  }

  const navigateTo = (index: number) => {
    setLoading(true)
    setAddingFolder(false)
    setNewFolderName('')
    setCreateFolderError(null)
    setMediaPage(1)
    const crumb = breadcrumb[index]
    setBreadcrumb(prev => prev.slice(0, index + 1))
    setCurrentFolderId(crumb.id)
    updateUrl(crumb.id, 1)
  }

  const panelOpen = selectedMedia !== null
  const isInsideFolder = currentFolderId !== null

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
                type="button"
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

      {/* Root view — tenant folder grid only */}
      {!loading && !isInsideFolder && (
        folders.length === 0 ? (
          <p style={{ color: 'var(--theme-text)', opacity: 0.6 }}>No folders.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
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

      {/* Inside-folder view — toolbar + sub-folders + media */}
      {!loading && isInsideFolder && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setAddingFolder(true); setCreateFolderError(null) }}
              disabled={addingFolder}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                background: 'var(--theme-elevation-100)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '4px',
                cursor: addingFolder ? 'default' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                opacity: addingFolder ? 0.5 : 1,
              }}
            >
              + Add folder
            </button>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              disabled={uploading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                background: 'var(--theme-elevation-100)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '4px',
                cursor: uploading ? 'default' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                opacity: uploading ? 0.5 : 1,
              }}
            >
              {uploading ? 'Uploading…' : '+ Upload image'}
            </button>
            {uploadError && (
              <span style={{ fontSize: '0.8rem', color: 'var(--theme-error)', flexShrink: 1 }}>
                {uploadError}
              </span>
            )}
            <UploadModal
              key={dropFile?.name ?? 'btn'}
              open={uploadModalOpen}
              accepting="image/*,application/pdf"
              defaultFile={dropFile}
              onClose={() => { setUploadModalOpen(false); setDropFile(null) }}
              onUpload={async (file) => {
                setUploadModalOpen(false)
                setDropFile(null)
                await handleUpload(file)
              }}
            />
          </div>

          {/* Inline add-folder form */}
          {addingFolder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                ref={folderInputRef}
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName('') } }}
                style={{
                  padding: '0.4rem 0.625rem',
                  border: '1px solid var(--theme-border-color)',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                  minWidth: '180px',
                }}
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                style={{
                  padding: '0.4rem 0.875rem',
                  background: 'var(--theme-success)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: creatingFolder || !newFolderName.trim() ? 'default' : 'pointer',
                  opacity: creatingFolder || !newFolderName.trim() ? 0.6 : 1,
                }}
              >
                {creatingFolder ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setAddingFolder(false); setNewFolderName(''); setCreateFolderError(null) }}
                style={{
                  padding: '0.4rem 0.625rem',
                  background: 'none',
                  border: '1px solid var(--theme-border-color)',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--theme-text)',
                }}
              >
                Cancel
              </button>
              {createFolderError && (
                <span style={{ fontSize: '0.8rem', color: 'var(--theme-error)' }}>{createFolderError}</span>
              )}
            </div>
          )}

          {/* Sub-folders grid */}
          {folders.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
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
            </div>
          )}

          {/* Media drop zone + grid */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files?.length) {
                setDropFile(e.dataTransfer.files[0])
                setUploadModalOpen(true)
              }
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
                {dragOver ? 'Drop to upload' : 'No images in this folder. Drop files or click "Upload image" above.'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {media.map(item => {
                  const thumb = item.sizes?.thumbnail?.url ?? item.url
                  const isSelected = selectedMedia?.id === item.id
                  return (
                    <button
                      type="button"
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

          {/* Pagination controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={mediaPage <= 1}
              onClick={() => {
                const p = mediaPage - 1
                setMediaPage(p)
                updateUrl(currentFolderId, p)
              }}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'var(--theme-elevation-100)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: mediaPage <= 1 ? 'default' : 'pointer',
                opacity: mediaPage <= 1 ? 0.4 : 1,
                color: 'var(--theme-text)',
              }}
            >
              ← Prev
            </button>
            {mediaTotalPages > 1 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--theme-text)', opacity: 0.8 }}>
                Page {mediaPage} of {mediaTotalPages}
                {mediaTotalDocs > 0 && <span style={{ opacity: 0.6 }}> ({mediaTotalDocs} items)</span>}
              </span>
            )}
            <button
              type="button"
              disabled={mediaPage >= mediaTotalPages}
              onClick={() => {
                const p = mediaPage + 1
                setMediaPage(p)
                updateUrl(currentFolderId, p)
              }}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'var(--theme-elevation-100)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: mediaPage >= mediaTotalPages ? 'default' : 'pointer',
                opacity: mediaPage >= mediaTotalPages ? 0.4 : 1,
                color: 'var(--theme-text)',
              }}
            >
              Next →
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--theme-text)', opacity: 0.7, marginLeft: 'auto' }}>
              Per page:
              <select
                value={mediaLimit}
                onChange={e => {
                  setMediaLimit(Number(e.target.value))
                  setMediaPage(1)
                  updateUrl(currentFolderId, 1)
                }}
                style={{
                  padding: '0.25rem 0.375rem',
                  border: '1px solid var(--theme-border-color)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  background: 'var(--theme-bg)',
                  color: 'var(--theme-text)',
                  cursor: 'pointer',
                }}
              >
                {[12, 24, 48, 96].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
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
        {deleteConfirmOpen && selectedMedia && (
          <>
            <div
              onClick={() => setDeleteConfirmOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
            />
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--theme-bg)',
              border: '1px solid var(--theme-border-color)',
              borderRadius: '8px',
              padding: '1.5rem',
              zIndex: 201,
              width: '360px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--theme-text)' }}>Delete image?</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--theme-text)', opacity: 0.7 }}>
                &quot;{selectedMedia.filename}&quot; will be permanently deleted.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleting}
                  style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--theme-border-color)', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--theme-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: 'var(--theme-error)', color: '#FF0000', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: deleting ? 0.7 : 1 }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </>
        )}

        {selectedMedia && (
          <>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--theme-border-color)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                {selectedMedia.filename}
              </span>
              <button
                type="button"
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
            <div style={{ padding: '1rem 1.25rem 0.5rem', borderTop: '1px solid var(--theme-border-color)' }}>
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

            {/* Delete button */}
            <div style={{ padding: '0 1.25rem 1rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.625rem 1rem',
                  background: 'var(--theme-error)',
                  color: '#FF0000',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
