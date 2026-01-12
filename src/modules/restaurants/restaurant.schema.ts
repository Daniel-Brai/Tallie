import { z } from 'zod';
import moment from 'moment';

export const createRestaurantSchema = z.object({
  body: z
    .object({
      name: z.string({ message: 'Restaurant name is required' }).min(1, { message: 'Restaurant name cannot be empty' }),
      openingTime: z.string({ message: 'Opening time is required' }),
      closingTime: z.string({ message: 'Closing time is required' }),
      peakHourStart: z.string({ message: 'Peak hour start must be a string' }).optional(),
      peakHourEnd: z.string({ message: 'Peak hour end must be a string' }).optional(),
      peakHourMaxDuration: z
        .number({ message: 'Peak hour max duration must be a number' })
        .positive({ message: 'Peak hour max duration must be positive' })
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (!moment(data.openingTime, 'HH:mm:ss', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Opening time must be in HH:MM:SS format',
          path: ['openingTime'],
        });
      }

      if (!moment(data.closingTime, 'HH:mm:ss', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Closing time must be in HH:MM:SS format',
          path: ['closingTime'],
        });
      }

      if (data.peakHourStart && !moment(data.peakHourStart, 'HH:mm:ss', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Peak hour start must be in HH:MM:SS format',
          path: ['peakHourStart'],
        });
      }

      if (data.peakHourEnd && !moment(data.peakHourEnd, 'HH:mm:ss', true).isValid()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Peak hour end must be in HH:MM:SS format',
          path: ['peakHourEnd'],
        });
      }

      if (moment(data.openingTime, 'HH:mm:ss', true).isValid() && moment(data.closingTime, 'HH:mm:ss', true).isValid()) {
        const opening = moment(data.openingTime, 'HH:mm:ss');
        const closing = moment(data.closingTime, 'HH:mm:ss');

        if (!opening.isBefore(closing)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Opening time must be before closing time',
            path: ['openingTime'],
          });
        }
      }

      if (data.peakHourStart && data.peakHourEnd) {
        if (moment(data.peakHourStart, 'HH:mm:ss', true).isValid() && moment(data.peakHourEnd, 'HH:mm:ss', true).isValid()) {
          const peakStart = moment(data.peakHourStart, 'HH:mm:ss');
          const peakEnd = moment(data.peakHourEnd, 'HH:mm:ss');

          if (!peakStart.isBefore(peakEnd)) {
            ctx.addIssue({
              code: 'custom',
              message: 'Peak hour start must be before peak hour end',
              path: ['peakHourStart'],
            });
          }
        }
      }
    }),
});

export const addTableSchema = z.object({
  params: z.object({
    restaurant: z.coerce
      .number({ message: 'Restaurant ID is required' })
      .int({ message: 'Restaurant ID must be an integer' })
      .positive({ message: 'Restaurant ID must be positive' }),
  }),
  body: z.object({
    tableNumber: z.string({ message: 'Table number is required' }).min(1, { message: 'Table number cannot be empty' }),
    capacity: z
      .number({ message: 'Capacity is required' })
      .int({ message: 'Capacity must be an integer' })
      .positive({ message: 'Capacity must be a positive integer' }),
  }),
});

export const getRestaurantSchema = z.object({
  params: z.object({
    restaurant: z.coerce
      .number({ message: 'Restaurant ID is required' })
      .int({ message: 'Restaurant ID must be an integer' })
      .positive({ message: 'Restaurant ID must be positive' }),
  }),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>['body'];
export type AddTableInput = z.infer<typeof addTableSchema>['body'];
