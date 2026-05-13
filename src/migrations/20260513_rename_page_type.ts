import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Renames the pageType select field → pageTemplate text field.
// Run: pnpm migrate

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages" RENAME COLUMN "page_type" TO "page_template";
  `)
  await db.execute(sql`
    ALTER TABLE "_pages_v" RENAME COLUMN "version_page_type" TO "version_page_template";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages" RENAME COLUMN "page_template" TO "page_type";
  `)
  await db.execute(sql`
    ALTER TABLE "_pages_v" RENAME COLUMN "version_page_template" TO "version_page_type";
  `)
}
