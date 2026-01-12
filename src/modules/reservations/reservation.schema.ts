import { z } from 'zod';
import moment from 'moment';

export const createReservationSchema = z.object({
  body: z
    .object({
      restaurant: z
        .number({ message: 'Restaurant ID is required' })
        .int({ message: 'Restaurant ID must be an integer' })
        .positive({ message: 'Restaurant ID must be positive' }),
      tableId: z
        .number({ message: 'Table ID must be a number' })
        .int({ message: 'Table ID must be an integer' })
        .positive({ message: 'Table ID must be positive' })
        .optional(),
      customerName: z.string({ message: 'Customer name is required' }).min(1, { message: 'Customer name cannot be empty' }),
      customerEmail: z.email({ message: 'Invalid email format' }),
      customerPhone: z.string({ message: 'Customer phone is required' }),
      partySize: z
        .number({ message: 'Party size is required' })
        .int({ message: 'Party size must be an integer' })
        .positive({ message: 'Party size must be a positive integer' }),
      reservationDate: z.string({ message: 'Reservation date is required' }),
      startTime: z.string({ message: 'Start time is required' }),
      duration: z
        .number({ message: 'Duration is required' })
        .int({ message: 'Duration must be an integer' })
        .positive({ message: 'Duration must be a positive integer' }),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!moment(data.reservationDate, 'YYYY-MM-DD', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Reservation date must be in YYYY-MM-DD format',
          path: ['reservationDate'],
        });
      }
      if (!moment(data.startTime, 'HH:mm:ss', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Start time must be in HH:MM:SS format',
          path: ['startTime'],
        });
      }

      if (moment(data.reservationDate, 'YYYY-MM-DD', true).isValid()) {
        const reservationDate = moment(data.reservationDate, 'YYYY-MM-DD');
        if (reservationDate.isBefore(moment(), 'day')) {
          ctx.addIssue({
            code: 'custom',
            message: 'Reservation date must be today or in the future',
            path: ['reservationDate'],
          });
        }
      }
    }),
});

export const checkAvailabilitySchema = z.object({
  query: z
    .object({
      restaurant: z.coerce
        .number({ message: 'Restaurant ID is required' })
        .int({ message: 'Restaurant ID must be an integer' })
        .positive({ message: 'Restaurant ID must be positive' }),
      date: z.string({ message: 'Date is required' }),
      partySize: z.coerce
        .number({ message: 'Party size is required' })
        .int({ message: 'Party size must be an integer' })
        .positive({ message: 'Party size must be positive' }),
      duration: z.coerce
        .number({ message: 'Duration must be a number' })
        .int({ message: 'Duration must be an integer' })
        .positive({ message: 'Duration must be positive' })
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (!moment(data.date, 'YYYY-MM-DD', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Date must be in YYYY-MM-DD format',
          path: ['date'],
        });
      }
    }),
});

export const getReservationsSchema = z.object({
  query: z
    .object({
      restaurant: z.coerce
        .number({ message: 'Restaurant ID is required' })
        .int({ message: 'Restaurant ID must be an integer' })
        .positive({ message: 'Restaurant ID must be positive' }),
      date: z.string({ message: 'Date is required' }),
    })
    .superRefine((data, ctx) => {
      if (!moment(data.date, 'YYYY-MM-DD', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Date must be in YYYY-MM-DD format',
          path: ['date'],
        });
      }
    }),
});

export const updateReservationSchema = z.object({
  params: z.object({
    reservationId: z.coerce
      .number({ message: 'Reservation ID is required' })
      .int({ message: 'Reservation ID must be an integer' })
      .positive({ message: 'Reservation ID must be positive' }),
  }),
  body: z
    .object({
      reservationDate: z.string({ message: 'Reservation date must be a string' }).optional(),
      startTime: z.string({ message: 'Start time must be a string' }).optional(),
      duration: z
        .number({ message: 'Duration must be a number' })
        .int({ message: 'Duration must be an integer' })
        .positive({ message: 'Duration must be positive' })
        .optional(),
      status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'], { message: 'Invalid status' }).optional(),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.reservationDate && !moment(data.reservationDate, 'YYYY-MM-DD', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Reservation date must be in YYYY-MM-DD format',
          path: ['reservationDate'],
        });
      }
      if (data.startTime && !moment(data.startTime, 'HH:mm:ss', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Start time must be in HH:MM:SS format',
          path: ['startTime'],
        });
      }
    }),
});

export const cancelReservationSchema = z.object({
  params: z.object({
    reservationId: z.coerce
      .number({ message: 'Reservation ID is required' })
      .int({ message: 'Reservation ID must be an integer' })
      .positive({ message: 'Reservation ID must be positive' }),
  }),
});

export const getAvailableSlotsSchema = z.object({
  query: z
    .object({
      restaurant: z.coerce
        .number({ message: 'Restaurant ID is required' })
        .int({ message: 'Restaurant ID must be an integer' })
        .positive({ message: 'Restaurant ID must be positive' }),
      date: z.string({ message: 'Date is required' }),
      partySize: z.coerce
        .number({ message: 'Party size is required' })
        .int({ message: 'Party size must be an integer' })
        .positive({ message: 'Party size must be positive' }),
    })
    .superRefine((data, ctx) => {
      if (!moment(data.date, 'YYYY-MM-DD', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Date must be in YYYY-MM-DD format',
          path: ['date'],
        });
      }
    }),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>['body'];
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>['body'];

