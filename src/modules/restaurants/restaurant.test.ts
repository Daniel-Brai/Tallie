import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Restaurant API', () => {
  let restaurantId: number;
  let tableId: number;

  describe('POST /api/v1/restaurants', () => {
    it('should create a new restaurant', async () => {
      const response = await request(app).post('/api/v1/restaurants').send({
        name: 'Test Restaurant',
        openingTime: '10:00:00',
        closingTime: '22:00:00',
        peakHourStart: '18:00:00',
        peakHourEnd: '21:00:00',
        peakHourMaxDuration: 90,
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.restaurant).toHaveProperty('id');
      expect(response.body.data.restaurant.name).toBe('Test Restaurant');

      restaurantId = response.body.data.restaurant.id;
    });

    it('should fail without required fields', async () => {
      const response = await request(app).post('/api/v1/restaurants').send({
        name: 'Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/restaurants', () => {
    it('should list all restaurants', async () => {
      const response = await request(app).get('/api/v1/restaurants');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.restaurants)).toBe(true);
    });
  });

  describe('POST /api/v1/restaurants/:restaurantId/tables', () => {
    beforeAll(async () => {
      if (!restaurantId) {
        const response = await request(app).post('/api/v1/restaurants').send({
          name: 'Test Restaurant for Tables',
          openingTime: '10:00:00',
          closingTime: '22:00:00',
        });
        restaurantId = response.body.data.restaurant.id;
      }
    });

    it('should add a table to a restaurant', async () => {
      const response = await request(app).post(`/api/v1/restaurants/${restaurantId}/tables`).send({
        tableNumber: 'T1',
        capacity: 4,
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.table).toHaveProperty('id');
      expect(response.body.data.table.tableNumber).toBe('T1');
      expect(response.body.data.table.capacity).toBe(4);

      tableId = response.body.data.table.id;
    });

    it('should prevent duplicate table numbers', async () => {
      const response = await request(app).post(`/api/v1/restaurants/${restaurantId}/tables`).send({
        tableNumber: 'T1',
        capacity: 4,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail with invalid restaurant ID', async () => {
      const response = await request(app).post('/api/v1/restaurants/99999/tables').send({
        tableNumber: 'T2',
        capacity: 4,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/restaurants/:restaurantId', () => {
    it('should get restaurant details with tables', async () => {
      const response = await request(app).get(`/api/v1/restaurants/${restaurantId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.restaurant).toHaveProperty('id');
      expect(Array.isArray(response.body.data.restaurant.tables)).toBe(true);
    });

    it('should fail with invalid restaurant ID', async () => {
      const response = await request(app).get('/api/v1/restaurants/99999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/restaurants/:restaurantId/tables', () => {
    it('should get all tables for a restaurant', async () => {
      const response = await request(app).get(`/api/v1/restaurants/${restaurantId}/tables`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.tables)).toBe(true);
    });
  });
});
