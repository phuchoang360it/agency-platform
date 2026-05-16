import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { Media } from './collections/Media'
import { MediaFolders } from './collections/MediaFolders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // ── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— 360IT Platform',
    },
  },

  // ── Collections ────────────────────────────────────────────────────────────
  collections: [Tenants, Users, Pages, Media, MediaFolders],

  // ── Editor ─────────────────────────────────────────────────────────────────
  editor: lexicalEditor(),

  // ── Localisation ───────────────────────────────────────────────────────────
  // Platform-wide locales. Tenant-enabled subsets are enforced at the frontend
  // / sitemap level, NOT here. Payload stores content for all locales;
  // the frontend filters which ones are publicly accessible per tenant.
  localization: {
    locales: [
      { label: 'Deutsch', code: 'de' },
      { label: 'English', code: 'en' },
      { label: 'Tiếng Việt', code: 'vi' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  // ── Database ───────────────────────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
    },
  }),

  // ── Plugins ────────────────────────────────────────────────────────────────
  plugins: [
    // S3 / MinIO storage — DB stores metadata, bucket stores files.
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          disableLocalStorage: true,
          generateFileURL: ({ filename: fname, prefix: docPrefix }) => {
            const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000'
            const bucket = process.env.S3_BUCKET ?? 'media'
            const slug = docPrefix || 'media'
            // Path-style URL required for MinIO: http://host:9000/bucket/tenant/file
            return `${endpoint}/${bucket}/${slug}/${fname}`
          },
        },
      },
      bucket: process.env.S3_BUCKET ?? 'media',
      config: {
        endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
        region: process.env.S3_REGION ?? 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      },
    }),

    // Multi-tenant plugin: adds a `tenant` relationship field to scoped collections
    // and filters admin queries so editors only see their assigned tenant's content.
    // Super-admins bypass the filter (userHasAccessToAllTenants).
    multiTenantPlugin({
      collections: {
        pages: {},
        media: {},
        'media-folders': {},
      },

      // We define the tenants array field manually in Users.ts for custom access + condition
      tenantsArrayField: {
        includeDefaultField: false,
      },

      useUsersTenantFilter: false,

      userHasAccessToAllTenants: (user) => {
        const u = user as unknown as { roles?: string; accessAllTenants?: boolean }
        return u.roles === 'super-admin' || u.roles === 'admin' || u.accessAllTenants === true
      },
    }),
  ],

  // ── Init ──────────────────────────────────────────────────────────────────
  onInit: async (payload) => {
    const { totalDocs } = await payload.find({
      collection: 'users',
      limit: 1,
      pagination: false,
    })
    if (totalDocs === 0) {
      const email = process.env.PAYLOAD_CMS_ROOT_EMAIL
      const password = process.env.PAYLOAD_CMS_ROOT_PASSWORD
      if (!email || !password) {
        payload.logger.warn('PAYLOAD_CMS_ROOT_EMAIL or PAYLOAD_CMS_ROOT_PASSWORD not set — skipping root user seed')
        return
      }
      await payload.create({
        collection: 'users',
        data: { email, password, roles: 'super-admin' },
      })
      payload.logger.info(`Root user created: ${email}`)
    }
  },

  // ── General ────────────────────────────────────────────────────────────────
  secret: process.env.PAYLOAD_SECRET ?? '',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    disable: false,
  },
})
