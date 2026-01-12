import { db } from '../../db';
import { restaurants, tables, Table } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AppError } from '../../middlewares/errorHandler';
import { CreateRestaurantInput, AddTableInput } from './restaurant.schema';
import status from 'http-status';

export class RestaurantService {
  async createRestaurant(data: CreateRestaurantInput) {
    const [restaurant] = await db
      .insert(restaurants)
      .values({
        ...data,
        totalTables: 0,
      })
      .returning();

    return restaurant;
  }

  async addTable(restaurantId: number, data: AddTableInput) {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new AppError(status.NOT_FOUND, 'Restaurant not found');
    }

    const [existingTable] = await db
      .select()
      .from(tables)
      .where(and(eq(tables.restaurantId, restaurantId), eq(tables.tableNumber, data.tableNumber)));

    if (existingTable) {
      throw new AppError(status.BAD_GATEWAY, `Table number ${data.tableNumber} already exists for this restaurant`);
    }

    const [table] = await db
      .insert(tables)
      .values({
        restaurantId,
        ...data,
      })
      .returning();

    await db
      .update(restaurants)
      .set({
        totalTables: sql`${restaurants.totalTables} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId));

    return table;
  }

  async getRestaurantDetails(restaurantId: number, date?: Date) {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new AppError(status.NOT_FOUND, 'Restaurant not found');
    }

    const restaurantTables = await db
      .select()
      .from(tables)
      .where(and(eq(tables.restaurantId, restaurantId), eq(tables.isActive, true)));

    let availableTables: Table[] | undefined;
    if (date) {
      availableTables = restaurantTables;
    }

    return {
      ...restaurant,
      tables: restaurantTables,
      availableTables,
    };
  }

  async listRestaurants() {
    const allRestaurants = await db.select().from(restaurants);
    return allRestaurants;
  }

  async getRestaurantTables(restaurantId: number) {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new AppError(status.NOT_FOUND, 'Restaurant not found');
    }

    const restaurantTables = await db.select().from(tables).where(eq(tables.restaurantId, restaurantId));

    return restaurantTables;
  }
}
