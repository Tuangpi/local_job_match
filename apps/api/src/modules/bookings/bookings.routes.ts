import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getBookingController,
  transitionBookingStatusController,
  cancelBookingController,
  createReviewController,
  createReportByBookingController,
} from './bookings.controller.js';

export const bookingsRouter: Router = Router();

bookingsRouter.get('/:bookingId', requireAuth, getBookingController);
bookingsRouter.post('/:bookingId/status', requireAuth, transitionBookingStatusController);
bookingsRouter.post('/:bookingId/cancel', requireAuth, cancelBookingController);
bookingsRouter.post('/:bookingId/reviews', requireAuth, createReviewController);
bookingsRouter.post('/:bookingId/reports', requireAuth, createReportByBookingController);