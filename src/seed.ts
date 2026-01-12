import 'dotenv/config';
import { db, closeDatabase } from './db';
import { restaurants, tables } from './db/schema';
import { logger } from './utils/logger';

async function seed() {
  try {
    logger.info('Starting database seeding...');

    logger.info('Creating restaurants...');

    const [restaurant1] = await db
      .insert(restaurants)
      .values({
        name: 'The Italian Place',
        openingTime: '11:00:00',
        closingTime: '23:00:00',
        peakHourStart: '18:00:00',
        peakHourEnd: '21:00:00',
        peakHourMaxDuration: 90,
      })
      .returning();

    const [restaurant2] = await db
      .insert(restaurants)
      .values({
        name: 'Sushi Paradise',
        openingTime: '12:00:00',
        closingTime: '22:00:00',
        peakHourStart: '19:00:00',
        peakHourEnd: '21:30:00',
        peakHourMaxDuration: 120,
      })
      .returning();

    const [restaurant3] = await db
      .insert(restaurants)
      .values({
        name: 'The Steakhouse',
        openingTime: '17:00:00',
        closingTime: '23:30:00',
        peakHourStart: '19:00:00',
        peakHourEnd: '22:00:00',
        peakHourMaxDuration: 120,
      })
      .returning();

    logger.info(`Created 3 restaurants`);

    logger.info('Creating tables for The Italian Place...');
    const italianTables = [
      { tableNumber: 'T1', capacity: 2 },
      { tableNumber: 'T2', capacity: 2 },
      { tableNumber: 'T3', capacity: 4 },
      { tableNumber: 'T4', capacity: 4 },
      { tableNumber: 'T5', capacity: 4 },
      { tableNumber: 'T6', capacity: 6 },
      { tableNumber: 'T7', capacity: 6 },
      { tableNumber: 'T8', capacity: 8 },
    ];

    for (const table of italianTables) {
      await db.insert(tables).values({
        restaurantId: restaurant1.id,
        ...table,
      });
    }

    logger.info('Creating tables for Sushi Paradise...');
    const sushiTables = [
      { tableNumber: 'S1', capacity: 2 },
      { tableNumber: 'S2', capacity: 2 },
      { tableNumber: 'S3', capacity: 2 },
      { tableNumber: 'S4', capacity: 4 },
      { tableNumber: 'S5', capacity: 4 },
      { tableNumber: 'S6', capacity: 6 },
      { tableNumber: 'Bar-1', capacity: 8 },
    ];

    for (const table of sushiTables) {
      await db.insert(tables).values({
        restaurantId: restaurant2.id,
        ...table,
      });
    }

    logger.info('Creating tables for The Steakhouse...');
    const steakhouseTables = [
      { tableNumber: 'ST1', capacity: 2 },
      { tableNumber: 'ST2', capacity: 2 },
      { tableNumber: 'ST3', capacity: 4 },
      { tableNumber: 'ST4', capacity: 4 },
      { tableNumber: 'ST5', capacity: 6 },
      { tableNumber: 'ST6', capacity: 6 },
      { tableNumber: 'ST7', capacity: 8 },
      { tableNumber: 'Private-1', capacity: 10 },
    ];

    for (const table of steakhouseTables) {
      await db.insert(tables).values({
        restaurantId: restaurant3.id,
        ...table,
      });
    }

    logger.info(`Created ${italianTables.length + sushiTables.length + steakhouseTables.length} tables`);

    logger.info('Database seeded successfully!');
    logger.info(`Restaurants:`);
    logger.info(`  1. ${restaurant1.name} (ID: ${restaurant1.id}) - ${italianTables.length} tables`);
    logger.info(`  2. ${restaurant2.name} (ID: ${restaurant2.id}) - ${sushiTables.length} tables`);
    logger.info(`  3. ${restaurant3.name} (ID: ${restaurant3.id}) - ${steakhouseTables.length} tables`);
  } catch (error) {
    logger.error({ error }, 'Error seeding database');
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

seed();
