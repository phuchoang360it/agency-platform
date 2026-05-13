import * as migration_20260513_add_page_sections from './20260513_add_page_sections';
import * as migration_20260513_rename_page_type from './20260513_rename_page_type';

export const migrations = [
  {
    up: migration_20260513_add_page_sections.up,
    down: migration_20260513_add_page_sections.down,
    name: '20260513_add_page_sections',
  },
  {
    up: migration_20260513_rename_page_type.up,
    down: migration_20260513_rename_page_type.down,
    name: '20260513_rename_page_type',
  },
];
