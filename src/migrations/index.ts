import * as migration_20260516_092824 from './20260516_092824';

export const migrations = [
  {
    up: migration_20260516_092824.up,
    down: migration_20260516_092824.down,
    name: '20260516_092824'
  },
];
