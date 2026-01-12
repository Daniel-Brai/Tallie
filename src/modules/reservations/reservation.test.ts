import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Reservation API', () => {
  let restaurantId: number;
  let tableId: number;
  let reservationId: number;

  beforeAll(async () => {
    const restaurantResponse = await request(app).post('/api/v1/restaurants').send({
      name: 'Reservation Test Restaurant',
      openingTime: '10:00:00',
      closingTime: '22:00:00',
      peakHourStart: '18:00:00',
      peakHourEnd: '21:00:00',
      peakHourMaxDuration: 90,
    });
    restaurantId = restaurantResponse.body.data.restaurant.id;

    const table1Response = await request(app).post(`/api/v1/restaurants/${restaurantId}/tables`).send({ tableNumber: 'T1', capacity: 4 });
    tableId = table1Response.body.data.table.id;

    await request(app).post(`/api/v1/restaurants/${restaurantId}/tables`).send({ tableNumber: 'T2', capacity: 2 });

    await request(app).post(`/api/v1/restaurants/${restaurantId}/tables`).send({ tableNumber: 'T3', capacity: 6 });
  });

  describe('POST /api/v1/reservations', () => {
    it('should create a reservation', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0);

      const response = await request(app).post('/api/v1/reservations').send({
        restaurantId,
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        partySize: 4,
        reservationDate: tomorrow.toISOString(),
        duration: 120,
        notes: 'Window seat preferred',
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.reservation).toHaveProperty('id');
      expect(response.body.data.reservation.customerName).toBe('John Doe');
      expect(response.body.data.reservation.status).toBe('confirmed');

      reservationId = response.body.data.reservation.id;
    });

    it('should prevent double-booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 30, 0, 0); // 30 minutes after the first reservation

      const response = await request(app).post('/api/v1/reservations').send({
        restaurantId,
        tableId, // Same table as first reservation
        customerName: 'Jane Doe',
        customerPhone: '+1234567891',
        partySize: 2,
        reservationDate: tomorrow.toISOString(),
        duration: 120,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('not available');
    });

    it('should fail for party size exceeding table capacity', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      const response = await request(app).post('/api/v1/reservations').send({
        restaurantId,
        tableId, 
        customerName: 'Large Party',
        customerPhone: '+1234567892',
        partySize: 8, 
        reservationDate: tomorrow.toISOString(),
        duration: 120,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('insufficient');
    });

    it('should fail for reservation outside operating hours', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 0, 0, 0);

      const response = await request(app).post('/api/v1/reservations').send({
        restaurantId,
        customerName: 'Late Night',
        customerPhone: '+1234567893',
        partySize: 2,
        reservationDate: tomorrow.toISOString(),
        duration: 120,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('operating hours');
    });

    it('should enforce peak hour duration limits', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 30, 0, 0); // During peak hours

      const response = await request(app).post('/api/v1/reservations').send({
        restaurantId,
        customerName: 'Peak Hour Test',
        customerPhone: '+1234567894',
        partySize: 2,
        reservationDate: tomorrow.toISOString(),
        duration: 150, 
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('peak hours');
    });
  });

  describe('GET /api/v1/reservations/check-availability', () => {
    it('should check table availability', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      const response = await request(app).get('/api/v1/reservations/check-availability').query({
        restaurantId,
        date: tomorrow.toISOString(),
        partySize: 4,
        duration: 120,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('available');
    });
  });

  describe('GET /api/v1/reservations/available-slots', () => {
    it('should return available time slots', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await request(app).get('/api/v1/reservations/available-slots').query({
        restaurantId,
        date: dateStr,
        partySize: 4,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('slots');
      expect(Array.isArray(response.body.data.slots)).toBe(true);
    });
  });

  describe('GET /api/v1/reservations', () => {
    it('should get all reservations for a date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await request(app).get('/api/v1/reservations').query({
        restaurantId,
        date: dateStr,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.reservations)).toBe(true);
    });
  });

  describe('PATCH /api/v1/reservations/:reservationId', () => {
    it('should update a reservation', async () => {
      const response = await request(app).patch(`/api/v1/reservations/${reservationId}`).send({
        notes: 'Updated notes',
        status: 'confirmed',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.reservation.notes).toBe('Updated notes');
    });

    it('should fail to update non-existent reservation', async () => {
      const response = await request(app).patch('/api/v1/reservations/99999').send({
        notes: 'Test',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/reservations/:reservationId', () => {
    it('should cancel a reservation', async () => {
      const response = await request(app).delete(`/api/v1/reservations/${reservationId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.reservation.status).toBe('cancelled');
    });

    it('should fail to cancel already cancelled reservation', async () => {
      const response = await request(app).delete(`/api/v1/reservations/${reservationId}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already cancelled');
    });
  });
});
