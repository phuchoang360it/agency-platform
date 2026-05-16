import type { CollectionConfig, Payload } from 'payload'

async function resolveFolderPath(payload: Payload, folderVal: unknown): Promise<string> {
  const id = typeof folderVal === 'string' ? folderVal
    : typeof folderVal === 'number' ? String(folderVal)
    : folderVal && typeof folderVal === 'object'
      ? String((folderVal as { id?: string | number }).id ?? '')
      : ''
  if (!id) return ''

  const parts: string[] = []
  let currentId: string | null = id

  while (currentId) {
    const folderDoc = await payload.findByID({ collection: 'media-folders', id: currentId, depth: 0 }) as unknown as Record<string, unknown>
    if (!folderDoc) break
    parts.unshift(String(folderDoc.name ?? ''))
    const p: unknown = folderDoc.parent
    if (!p) { currentId = null; break }
    if (typeof p === 'string') { currentId = p }
    else if (typeof p === 'number') { currentId = String(p) }
    else { currentId = String((p as { id?: string | number }).id ?? '') || null }
  }

  return parts.join('/')
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  upload: {
    // Sizes for responsive images. Payload + Sharp generates these on upload.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 768, height: undefined, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const tenantVal = data.tenant
        if (!tenantVal) return data
        const tenantId =
          typeof tenantVal === 'string' ? tenantVal
          : typeof tenantVal === 'number' ? String(tenantVal)
          : String((tenantVal as { id: string | number }).id ?? '')
        if (!tenantId) return data
        try {
          const tenant = await req.payload.findByID({ collection: 'tenants', id: tenantId, depth: 0 })
          const tenantDoc = tenant as unknown as { slug?: string; name?: string }
          const slug = tenantDoc?.slug ?? 'media'
          const tenantName = tenantDoc?.name ?? slug
          const folderPath = await resolveFolderPath(req.payload, data.folder)
          const prefix = folderPath || tenantName
          return { ...data, prefix, tenantSlug: slug }
        } catch {
          return data
        }
      },
      async ({ data, originalDoc, operation, req }) => {
        if (
          operation !== 'update' ||
          !originalDoc?.filename ||
          !data.filename ||
          data.filename === originalDoc.filename ||
          req.file
        ) return data

        const { S3Client, CopyObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3')

        const s3 = new S3Client({
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.S3_REGION ?? 'us-east-1',
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
          },
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        })

        const bucket = process.env.S3_BUCKET ?? 'media'
        const prefix = (originalDoc.prefix as string | null) || 'media'
        const oldBase = (originalDoc.filename as string).replace(/\.[^.]+$/, '')
        const newBase = (data.filename as string).replace(/\.[^.]+$/, '')

        const renameObject = async (oldFilename: string, newFilename: string) => {
          const oldKey = `${prefix}/${oldFilename}`
          const newKey = `${prefix}/${newFilename}`
          await s3.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${oldKey}`, Key: newKey }))
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }))
        }

        await renameObject(originalDoc.filename as string, data.filename as string)

        const prevSizes = originalDoc.sizes as Record<string, { filename?: string } | null> | undefined
        if (prevSizes) {
          const updatedSizes: Record<string, unknown> = {}
          for (const [sizeName, sizeData] of Object.entries(prevSizes)) {
            if (!sizeData?.filename) continue
            const newSizeFilename = sizeData.filename.replace(oldBase, newBase)
            await renameObject(sizeData.filename, newSizeFilename)
            updatedSizes[sizeName] = { ...sizeData, filename: newSizeFilename }
          }
          return { ...data, sizes: { ...prevSizes, ...updatedSizes } }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
      label: 'File Name',
      admin: {
        hidden: false,
        readOnly: false,
        disableBulkEdit: false,
      },
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: { description: 'Alt text for accessibility and SEO.' },
    },
    {
      name: 'folder',
      type: 'relationship',
      relationTo: 'media-folders',
      admin: { position: 'sidebar' },
    },
    {
      name: 'tenantSlug',
      type: 'text',
      admin: { hidden: true },
    },
  ],
}
