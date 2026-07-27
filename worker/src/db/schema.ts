import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  address: text('address').primaryKey(),
  points: integer('points').notNull(),
  forkLevel: integer('forkLevel').notNull(),
  lastUpdated: text('lastUpdated'), // D1/SQLite maneja DATETIME como texto o numérico por defecto
});

export const syncState = sqliteTable('sync_state', {
  id: integer('id').primaryKey(),
  lastProcessedBlock: integer('lastProcessedBlock').notNull(),
});
