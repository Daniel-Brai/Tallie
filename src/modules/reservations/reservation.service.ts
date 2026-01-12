import { db } from '../../db';
import { restaurants, tables, reservations, waitlist } from '../../db/schema';
import { eq, and, lte, gte, or } from 'drizzle-orm';
import moment from 'moment';
import { AppError } from '../../middlewares/errorHandler';
import { CreateReservationInput, UpdateReservationInput } from './reservation.schema';
import { logger } from '../../utils/logger';
import status from 'http-status';

export class ReservationService {
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isWithinOperatingHours(dateTime: Date, openingTime: string, closingTime: string, duration: number): boolean {
    const hour = dateTime.getHours();
    const minute = dateTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    const openingMinutes = this.timeToMinutes(openingTime);
    const closingMinutes = this.timeToMinutes(closingTime);
    const endTimeMinutes = timeInMinutes + duration;

    if (closingMinutes < openingMinutes) {
      return timeInMinutes >= openingMinutes || endTimeMinutes <= closingMinutes;
    }

    return timeInMinutes >= openingMinutes && endTimeMinutes <= closingMinutes;
  }

  private isDuringPeakHours(dateTime: Date, peakHourStart?: string, peakHourEnd?: string): boolean {
    if (!peakHourStart || !peakHourEnd) return false;

    const hour = dateTime.getHours();
    const minute = dateTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    const peakStartMinutes = this.timeToMinutes(peakHourStart);
    const peakEndMinutes = this.timeToMinutes(peakHourEnd);

    return timeInMinutes >= peakStartMinutes && timeInMinutes <= peakEndMinutes;
  }

  private async isTableAvailable(tableId: number, startTime: Date, endTime: Date, excludeReservationId?: number): Promise<boolean> {
    const query = db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.tableId, tableId),
          or(eq(reservations.status, 'pending'), eq(reservations.status, 'confirmed')),
          or(
            and(lte(reservations.reservationDate, startTime), gte(reservations.endTime, startTime)),
            and(lte(reservations.reservationDate, endTime), gte(reservations.endTime, endTime)),
            and(gte(reservations.reservationDate, startTime), lte(reservations.endTime, endTime)),
          ),
        ),
      );

    if (excludeReservationId) {
      const conflictingReservations = await query;
      return !conflictingReservations.some((r) => r.id !== excludeReservationId);
    }

    const conflictingReservations = await query;
    return conflictingReservations.length === 0;
  }

  private async findSuitableTable(restaurantId: number, partySize: number, startTime: Date, endTime: Date): Promise<number | null> {
    const suitableTables = await db
      .select()
      .from(tables)
      .where(and(eq(tables.restaurantId, restaurantId), eq(tables.isActive, true), gte(tables.capacity, partySize)))
      .orderBy(tables.capacity);

    for (const table of suitableTables) {
      const available = await this.isTableAvailable(table.id, startTime, endTime);
      if (available) {
        return table.id;
      }
    }

    return null;
  }

  private sendConfirmation(customerName: string, customerPhone: string, reservationDate: Date, restaurantName: string): void {
    logger.info(
      {
        event: 'reservation_confirmed',
        customerName,
        customerPhone,
        restaurantName,
        reservationDate: reservationDate.toISOString(),
      },
      'Reservation confirmed',
    );
  }

  async createReservation(data: CreateReservationInput) {
    const { restaurant, tableId, customerName, customerPhone, partySize, reservationDate, duration, notes } = data;

    const [restaurantData] = await db.select().from(restaurants).where(eq(restaurants.id, restaurant));

    if (!restaurantData) {
      throw new AppError(status.NOT_FOUND, 'Restaurant not found');
    }

    const startTime = moment(reservationDate).toDate();
    const endTime = moment(startTime).add(duration, 'minutes').toDate();

    if (!this.isWithinOperatingHours(startTime, restaurantData.openingTime, restaurantData.closingTime, duration)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Reservation must be within operating hours (${restaurantData.openingTime} - ${restaurantData.closingTime})`,
      );
    }

    const isPeakHour = this.isDuringPeakHours(
      startTime,
      restaurantData.peakHourStart || undefined,
      restaurantData.peakHourEnd || undefined,
    );

    if (isPeakHour && restaurantData.peakHourMaxDuration && duration > restaurantData.peakHourMaxDuration) {
      throw new AppError(
        status.BAD_REQUEST,
        `During peak hours (${restaurantData.peakHourStart} - ${restaurantData.peakHourEnd}), maximum reservation duration is ${restaurantData.peakHourMaxDuration} minutes`,
      );
    }

    let assignedTableId: number;

    if (tableId) {
      const [table] = await db
        .select()
        .from(tables)
        .where(and(eq(tables.id, tableId), eq(tables.restaurantId, restaurant)));

      if (!table) {
        throw new AppError(status.NOT_FOUND, 'Table not found');
      }

      if (table.capacity < partySize) {
        throw new AppError(status.BAD_REQUEST, `Table capacity (${table.capacity}) is insufficient for party size (${partySize})`);
      }

      const available = await this.isTableAvailable(tableId, startTime, endTime);
      if (!available) {
        throw new AppError(status.CONFLICT, 'Table is not available for the requested time slot');
      }

      assignedTableId = tableId;
    } else {
      const foundTableId = await this.findSuitableTable(restaurant, partySize, startTime, endTime);

      if (!foundTableId) {
        const [waitlistEntry] = await db
          .insert(waitlist)
          .values({
            restaurantId: restaurant,
            customerName,
            customerPhone,
            partySize,
            requestedDate: startTime,
            status: 'waiting',
          })
          .returning();

        throw new AppError(
          status.CONFLICT,
          `No tables available for party of ${partySize} at the requested time. You have been added to the waitlist (Position: ${waitlistEntry.id})`,
        );
      }

      assignedTableId = foundTableId;
    }

    const [reservation] = await db
      .insert(reservations)
      .values({
        restaurantId: restaurant,
        tableId: assignedTableId,
        customerName,
        customerPhone,
        partySize,
        reservationDate: startTime,
        duration,
        endTime,
        status: 'confirmed',
        notes,
      })
      .returning();

    this.sendConfirmation(customerName, customerPhone, startTime, restaurantData.name);

    return reservation;
  }

  async checkAvailability(restaurantId: number, date: Date, partySize: number, duration: number = 120) {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new AppError(status.NOT_FOUND, 'Restaurant not found');
    }

    const endTime = new Date(date.getTime() + duration * 60000);
    const tableId = await this.findSuitableTable(restaurantId, partySize, date, endTime);

    return {
      available: tableId !== null,
      tableId,
      message: tableId ? 'Table available for the requested time' : `No tables available for party of ${partySize} at the requested time`,
    };
  }

  async getReservationsByDate(restaurantId: number, date: string) {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new AppError(status.NOT_FOUND, 'Restaurant not found');
    }

    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    const dayReservations = await db
      .select({
        id: reservations.id,
        customerName: reservations.customerName,
        customerPhone: reservations.customerPhone,
        partySize: reservations.partySize,
        reservationDate: reservations.reservationDate,
        duration: reservations.duration,
        endTime: reservations.endTime,
        status: reservations.status,
        notes: reservations.notes,
        tableNumber: tables.tableNumber,
        tableCapacity: tables.capacity,
      })
      .from(reservations)
      .innerJoin(tables, eq(reservations.tableId, tables.id))
      .where(
        and(
          eq(reservations.restaurantId, restaurantId),
          gte(reservations.reservationDate, startOfDay),
          lte(reservations.reservationDate, endOfDay),
        ),
      )
      .orderBy(reservations.reservationDate);

    return dayReservations;
  }

  async updateReservation(reservationId: number, data: UpdateReservationInput) {
    const [existingReservation] = await db.select().from(reservations).where(eq(reservations.id, reservationId));

    if (!existingReservation) {
      throw new AppError(status.NOT_FOUND, 'Reservation not found');
    }

    if (existingReservation.status === 'cancelled') {
      throw new AppError(status.BAD_REQUEST, 'Cannot update a cancelled reservation');
    }

    const updateData: any = { ...data, updatedAt: new Date() };

    if (data.reservationDate || data.startTime || data.duration) {
      const newDate = data.reservationDate || moment(existingReservation.reservationDate).format('YYYY-MM-DD');
      const newTime = data.startTime || moment(existingReservation.reservationDate).format('HH:mm:ss');
      const newStartTime = moment(`${newDate} ${newTime}`, 'YYYY-MM-DD HH:mm:ss').toDate();
      const newDuration = data.duration || existingReservation.duration;

      updateData.reservationDate = newStartTime;
      updateData.endTime = moment(newStartTime).add(newDuration, 'minutes').toDate();

      const available = await this.isTableAvailable(existingReservation.tableId, newStartTime, updateData.endTime, reservationId);

      if (!available) {
        throw new AppError(status.CONFLICT, 'Table is not available for the new time slot');
      }
    }

    const [updatedReservation] = await db.update(reservations).set(updateData).where(eq(reservations.id, reservationId)).returning();

    return updatedReservation;
  }

  async cancelReservation(reservationId: number) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, reservationId));

    if (!reservation) {
      throw new AppError(status.NOT_FOUND, 'Reservation not found');
    }

    if (reservation.status === 'cancelled') {
      throw new AppError(status.BAD_REQUEST, 'Reservation is already cancelled');
    }

    const [cancelledReservation] = await db
      .update(reservations)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, reservationId))
      .returning();

    return cancelledReservation;
  }

  async getAvailableTimeSlots(restaurantId: number, date: string, partySize: number) {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new AppError(404, 'Restaurant not found');
    }

    const openingMinutes = this.timeToMinutes(restaurant.openingTime);
    const closingMinutes = this.timeToMinutes(restaurant.closingTime);
    const slotInterval = 30; // 30-minute intervals
    const defaultDuration = 120; // 2 hours default

    const availableSlots: Array<{ time: string; available: boolean; tableId?: number }> = [];

    const targetDate = moment(date).startOf('day').toDate();

    for (let minutes = openingMinutes; minutes < closingMinutes; minutes += slotInterval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      const slotTime = moment(targetDate).hours(hours).minutes(mins).seconds(0).toDate();
      const slotEndTime = moment(slotTime).add(defaultDuration, 'minutes').toDate();

      const endHour = slotEndTime.getHours();
      const endMinute = slotEndTime.getMinutes();
      const endTimeInMinutes = endHour * 60 + endMinute;

      if (endTimeInMinutes > closingMinutes) {
        continue;
      }

      const tableId = await this.findSuitableTable(restaurantId, partySize, slotTime, slotEndTime);

      availableSlots.push({
        time: slotTime.toISOString(),
        available: tableId !== null,
        tableId: tableId || undefined,
      });
    }

    return {
      date,
      partySize,
      defaultDuration,
      operatingHours: {
        opening: restaurant.openingTime,
        closing: restaurant.closingTime,
      },
      slots: availableSlots,
    };
  }
}
