import { pgTable, serial, varchar, integer, timestamp, time, boolean, text, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const reservationStatusEnum = pgEnum('reservation_status', [
  'pending',
  'confirmed',
  'completed',
  'cancelled'
]);

export const waitlistStatusEnum = pgEnum('waitlist_status', [
  'waiting',
  'seated',
  'cancelled',
  'expired'
]);

export const restaurants = pgTable('restaurants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  openingTime: time('opening_time').notNull(), // e.g., '10:00:00'
  closingTime: time('closing_time').notNull(), // e.g., '22:00:00'
  totalTables: integer('total_tables').notNull().default(0),
  peakHourStart: time('peak_hour_start'), // Optional: e.g., '18:00:00'
  peakHourEnd: time('peak_hour_end'), // Optional: e.g., '21:00:00'
  peakHourMaxDuration: integer('peak_hour_max_duration'), // Minutes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  tableNumber: varchar('table_number', { length: 50 }).notNull(),
  capacity: integer('capacity').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueTableNumber: unique().on(table.restaurantId, table.tableNumber)
}));

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  tableId: integer('table_id')
    .notNull()
    .references(() => tables.id, { onDelete: 'cascade' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  partySize: integer('party_size').notNull(),
  reservationDate: timestamp('reservation_date').notNull(),
  duration: integer('duration').notNull(), // Duration in minutes
  endTime: timestamp('end_time').notNull(), // Calculated: reservationDate + duration
  status: reservationStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const waitlist = pgTable('waitlist', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  partySize: integer('party_size').notNull(),
  requestedDate: timestamp('requested_date').notNull(),
  status: waitlistStatusEnum('status').default('waiting').notNull(),
  position: integer('position'), // Position in queue
  notified: boolean('notified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});


export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  tables: many(tables),
  reservations: many(reservations),
  waitlist: many(waitlist)
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tables.restaurantId],
    references: [restaurants.id]
  }),
  reservations: many(reservations)
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [reservations.restaurantId],
    references: [restaurants.id]
  }),
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id]
  })
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [waitlist.restaurantId],
    references: [restaurants.id]
  })
}));

export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;