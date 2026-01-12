import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  createReservation,
  checkAvailability,
  getReservations,
  updateReservation,
  cancelReservation,
  getAvailableSlots,
} from './reservation.controller';
import { validate } from '../../middlewares/validator';
import {
  createReservationSchema,
  checkAvailabilitySchema,
  getReservationsSchema,
  updateReservationSchema,
  cancelReservationSchema,
  getAvailableSlotsSchema,
} from './reservation.schema';

const router: ExpressRouter = Router();

router.post('/', validate(createReservationSchema.shape.body), createReservation);
router.get('/check-availability', validate(checkAvailabilitySchema.shape.query, 'query') as any, checkAvailability);
router.get('/available-slots', validate(getAvailableSlotsSchema.shape.query, 'query') as any, getAvailableSlots);
router.get('/', validate(getReservationsSchema.shape.query, 'query') as any, getReservations);
router.patch(
  '/:reservationId',
  validate(updateReservationSchema.shape.params, 'params') as any,
  validate(updateReservationSchema.shape.body),
  updateReservation,
);
router.delete('/:reservationId', validate(cancelReservationSchema.shape.params, 'params') as any, cancelReservation);

export default router;
