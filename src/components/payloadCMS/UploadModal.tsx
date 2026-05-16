'use client'
import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  accepting?: string
  defaultFile?: File | null
  onUpload: (file: File) => Promise<void>
  onClose: () => void
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot !== -1 ? name.slice(dot) : ''
}

export const UploadModal: React.FC<Props> = ({ open, accepting = 'image/*,application/pdf', defaultFile, onUpload, onClose }) => {
  const [file, setFile] = useState<File | null>(defaultFile ?? null)
  const [filename, setFilename] = useState(defaultFile?.name ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setFilename('')
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    setFile(picked)
    setFilename(picked.name)
  }

  const handleSubmit = async () => {
    if (!file || !filename.trim()) return
    setUploading(true)
    try {
      const ext = getExtension(file.name)
      const base = filename.trim()
      const finalName = ext && !base.endsWith(ext) ? base + ext : base
      const renamed = new File([file], finalName, { type: file.type })
      await onUpload(renamed)
      reset()
    } finally {
      setUploading(false)
    }
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--theme-bg)',
          borderRadius: '8px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          width: 'min(440px, 92vw)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--theme-text)' }}>Upload image</span>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, color: 'var(--theme-text)', padding: '0 0.25rem' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* File field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--theme-elevation-800)' }}>
            File
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '0.45rem 0.875rem',
                background: 'var(--theme-elevation-100)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '4px',
                cursor: uploading ? 'default' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Choose file
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--theme-text)', opacity: file ? 1 : 0.45, wordBreak: 'break-all' }}>
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accepting}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Filename field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--theme-elevation-800)' }}>
            File name
          </label>
          <input
            type="text"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            placeholder="Enter file name"
            disabled={uploading}
            style={{
              padding: '0.45rem 0.625rem',
              border: '1px solid var(--theme-border-color)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              background: 'var(--theme-bg)',
              color: 'var(--theme-text)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid var(--theme-border-color)',
              background: 'none',
              cursor: uploading ? 'default' : 'pointer',
              fontSize: '0.875rem',
              color: 'var(--theme-text)',
              opacity: uploading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || !filename.trim() || uploading}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--theme-success)',
              color: '#fff',
              cursor: !file || !filename.trim() || uploading ? 'default' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              opacity: !file || !filename.trim() || uploading ? 0.6 : 1,
            }}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
