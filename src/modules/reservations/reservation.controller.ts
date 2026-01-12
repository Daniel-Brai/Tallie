import { Request, Response } from 'express';
import { ReservationService } from './reservation.service';
import { asyncHandler } from '../../middlewares/errorHandler';
import status from 'http-status';
import z from 'zod';
import {
  cancelReservationSchema,
  checkAvailabilitySchema,
  createReservationSchema,
  getAvailableSlotsSchema,
  getReservationsSchema,
  updateReservationSchema,
} from './reservation.schema';

const reservationService = new ReservationService();

export const createReservation = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as z.infer<typeof createReservationSchema>['body'];

  const reservation = await reservationService.createReservation(payload);

  res.status(status.OK).json({
    status: 'success',
    data: { reservation },
  });
});

export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { restaurant, date, partySize, duration } = req.query as unknown as z.infer<typeof checkAvailabilitySchema>['query'];

  const availability = await reservationService.checkAvailability(restaurant, new Date(date), partySize, duration);

  res.status(status.OK).json({
    status: 'success',
    data: availability,
  });
});

export const getReservations = asyncHandler(async (req: Request, res: Response) => {
  const { restaurant, date } = req.query as unknown as z.infer<typeof getReservationsSchema>['query'];

  const reservations = await reservationService.getReservationsByDate(restaurant, date);

  res.status(status.OK).json({
    status: 'success',
    data: { reservations, count: reservations.length },
  });
});

export const updateReservation = asyncHandler(async (req: Request, res: Response) => {
  const { reservationId } = req.params as unknown as z.infer<typeof updateReservationSchema>['params'];
  const reservation = await reservationService.updateReservation(reservationId, req.body);

  res.status(status.OK).json({
    status: 'success',
    data: { reservation },
  });
});

export const cancelReservation = asyncHandler(async (req: Request, res: Response) => {
  const { reservationId } = req.params as unknown as z.infer<typeof cancelReservationSchema>['params'];
  const reservation = await reservationService.cancelReservation(reservationId);

  res.status(status.OK).json({
    status: 'success',
    data: { reservation },
    message: 'Reservation cancelled successfully',
  });
});

export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { restaurant, date, partySize } = req.query as unknown as z.infer<typeof getAvailableSlotsSchema>['query'];

  const slots = await reservationService.getAvailableTimeSlots(restaurant, date, partySize);

  res.status(status.OK).json({
    status: 'success',
    data: slots,
  });
});
