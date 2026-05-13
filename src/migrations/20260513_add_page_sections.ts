import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Adds structured content group columns to pages / pages_locales.
// Old layout block tables (pages_layout_*) are intentionally left in place — no data loss.
// Run: pnpm migrate

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── Non-localized columns on pages ──────────────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "pages"
      ADD COLUMN IF NOT EXISTS "hero_section_cta_href" varchar,
      ADD COLUMN IF NOT EXISTS "hero_section_background_image_id" integer,
      ADD COLUMN IF NOT EXISTS "contact_details_phone" varchar,
      ADD COLUMN IF NOT EXISTS "contact_details_email" varchar,
      ADD COLUMN IF NOT EXISTS "cta_section_primary_href" varchar,
      ADD COLUMN IF NOT EXISTS "cta_section_secondary_href" varchar;
  `)

  // ── FK for backgroundImage → media ─────────────────────────────────────────
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'pages_hero_section_background_image_id_media_id_fk'
      ) THEN
        ALTER TABLE "pages"
          ADD CONSTRAINT "pages_hero_section_background_image_id_media_id_fk"
          FOREIGN KEY ("hero_section_background_image_id")
          REFERENCES "public"."media"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `)

  // ── Index on background image ───────────────────────────────────────────────
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "pages_hero_section_background_image_idx"
      ON "pages" USING btree ("hero_section_background_image_id");
  `)

  // ── Localized columns on pages_locales ──────────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "pages_locales"
      ADD COLUMN IF NOT EXISTS "hero_section_heading" varchar,
      ADD COLUMN IF NOT EXISTS "hero_section_subheading" varchar,
      ADD COLUMN IF NOT EXISTS "hero_section_cta_label" varchar,
      ADD COLUMN IF NOT EXISTS "features_section_heading" varchar,
      ADD COLUMN IF NOT EXISTS "body_content" jsonb,
      ADD COLUMN IF NOT EXISTS "contact_details_address" varchar,
      ADD COLUMN IF NOT EXISTS "contact_details_hours" varchar,
      ADD COLUMN IF NOT EXISTS "cta_section_heading" varchar,
      ADD COLUMN IF NOT EXISTS "cta_section_body" varchar,
      ADD COLUMN IF NOT EXISTS "cta_section_primary_label" varchar,
      ADD COLUMN IF NOT EXISTS "cta_section_secondary_label" varchar;
  `)

  // ── featuresSection.features array table ────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_features_section_features" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "icon" varchar
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_features_section_features_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'pages_features_section_features_parent_id_fk'
      ) THEN
        ALTER TABLE "pages_features_section_features"
          ADD CONSTRAINT "pages_features_section_features_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'pages_features_section_features_locales_parent_id_fk'
      ) THEN
        ALTER TABLE "pages_features_section_features_locales"
          ADD CONSTRAINT "pages_features_section_features_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."pages_features_section_features"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "pages_features_section_features_order_idx"
      ON "pages_features_section_features" USING btree ("_order");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "pages_features_section_features_parent_id_idx"
      ON "pages_features_section_features" USING btree ("_parent_id");
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "pages_features_section_features_locales_locale_parent_id_uni"
      ON "pages_features_section_features_locales" USING btree ("_locale","_parent_id");
  `)

  // ── Same additions for _pages_v (draft versions) ────────────────────────────
  await db.execute(sql`
    ALTER TABLE "_pages_v"
      ADD COLUMN IF NOT EXISTS "version_hero_section_cta_href" varchar,
      ADD COLUMN IF NOT EXISTS "version_hero_section_background_image_id" integer,
      ADD COLUMN IF NOT EXISTS "version_contact_details_phone" varchar,
      ADD COLUMN IF NOT EXISTS "version_contact_details_email" varchar,
      ADD COLUMN IF NOT EXISTS "version_cta_section_primary_href" varchar,
      ADD COLUMN IF NOT EXISTS "version_cta_section_secondary_href" varchar;
  `)

  await db.execute(sql`
    ALTER TABLE "_pages_v_locales"
      ADD COLUMN IF NOT EXISTS "version_hero_section_heading" varchar,
      ADD COLUMN IF NOT EXISTS "version_hero_section_subheading" varchar,
      ADD COLUMN IF NOT EXISTS "version_hero_section_cta_label" varchar,
      ADD COLUMN IF NOT EXISTS "version_features_section_heading" varchar,
      ADD COLUMN IF NOT EXISTS "version_body_content" jsonb,
      ADD COLUMN IF NOT EXISTS "version_contact_details_address" varchar,
      ADD COLUMN IF NOT EXISTS "version_contact_details_hours" varchar,
      ADD COLUMN IF NOT EXISTS "version_cta_section_heading" varchar,
      ADD COLUMN IF NOT EXISTS "version_cta_section_body" varchar,
      ADD COLUMN IF NOT EXISTS "version_cta_section_primary_label" varchar,
      ADD COLUMN IF NOT EXISTS "version_cta_section_secondary_label" varchar;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_pages_v_version_features_section_features" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "icon" varchar,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_pages_v_version_features_section_features_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = '_pages_v_version_features_section_features_parent_id_fk'
      ) THEN
        ALTER TABLE "_pages_v_version_features_section_features"
          ADD CONSTRAINT "_pages_v_version_features_section_features_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = '_pages_v_version_features_section_features_locales_parent_fk'
      ) THEN
        ALTER TABLE "_pages_v_version_features_section_features_locales"
          ADD CONSTRAINT "_pages_v_version_features_section_features_locales_parent_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."_pages_v_version_features_section_features"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_pages_v_version_features_section_features_order_idx"
      ON "_pages_v_version_features_section_features" USING btree ("_order");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_pages_v_version_features_section_features_parent_id_idx"
      ON "_pages_v_version_features_section_features" USING btree ("_parent_id");
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "_pages_v_version_features_section_features_locales_locale_pa"
      ON "_pages_v_version_features_section_features_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove features section tables
  await db.execute(sql`DROP TABLE IF EXISTS "pages_features_section_features_locales" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "pages_features_section_features" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_pages_v_version_features_section_features_locales" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_pages_v_version_features_section_features" CASCADE;`)

  // Remove new columns from pages
  await db.execute(sql`
    ALTER TABLE "pages"
      DROP COLUMN IF EXISTS "hero_section_cta_href",
      DROP COLUMN IF EXISTS "hero_section_background_image_id",
      DROP COLUMN IF EXISTS "contact_details_phone",
      DROP COLUMN IF EXISTS "contact_details_email",
      DROP COLUMN IF EXISTS "cta_section_primary_href",
      DROP COLUMN IF EXISTS "cta_section_secondary_href";
  `)

  await db.execute(sql`
    ALTER TABLE "pages_locales"
      DROP COLUMN IF EXISTS "hero_section_heading",
      DROP COLUMN IF EXISTS "hero_section_subheading",
      DROP COLUMN IF EXISTS "hero_section_cta_label",
      DROP COLUMN IF EXISTS "features_section_heading",
      DROP COLUMN IF EXISTS "body_content",
      DROP COLUMN IF EXISTS "contact_details_address",
      DROP COLUMN IF EXISTS "contact_details_hours",
      DROP COLUMN IF EXISTS "cta_section_heading",
      DROP COLUMN IF EXISTS "cta_section_body",
      DROP COLUMN IF EXISTS "cta_section_primary_label",
      DROP COLUMN IF EXISTS "cta_section_secondary_label";
  `)

  await db.execute(sql`
    ALTER TABLE "_pages_v"
      DROP COLUMN IF EXISTS "version_hero_section_cta_href",
      DROP COLUMN IF EXISTS "version_hero_section_background_image_id",
      DROP COLUMN IF EXISTS "version_contact_details_phone",
      DROP COLUMN IF EXISTS "version_contact_details_email",
      DROP COLUMN IF EXISTS "version_cta_section_primary_href",
      DROP COLUMN IF EXISTS "version_cta_section_secondary_href";
  `)

  await db.execute(sql`
    ALTER TABLE "_pages_v_locales"
      DROP COLUMN IF EXISTS "version_hero_section_heading",
      DROP COLUMN IF EXISTS "version_hero_section_subheading",
      DROP COLUMN IF EXISTS "version_hero_section_cta_label",
      DROP COLUMN IF EXISTS "version_features_section_heading",
      DROP COLUMN IF EXISTS "version_body_content",
      DROP COLUMN IF EXISTS "version_contact_details_address",
      DROP COLUMN IF EXISTS "version_contact_details_hours",
      DROP COLUMN IF EXISTS "version_cta_section_heading",
      DROP COLUMN IF EXISTS "version_cta_section_body",
      DROP COLUMN IF EXISTS "version_cta_section_primary_label",
      DROP COLUMN IF EXISTS "version_cta_section_secondary_label";
  `)
}
