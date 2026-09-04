import express from 'express';
import { protect, optionalAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  getEventTickets,
  createRazorpayOrder,
  verifyPayment,
  failPayment,
  verifyTicket,
} from '../controllers/ticketController.js';

const router = express.Router();

// ── Customer & Guest Routes ───────────────────────────────────────────────────
// /my-tickets MUST come before /:id to prevent Express from treating 'my-tickets' as an ID
router.get('/my-tickets', protect, requireRole('customer'), getMyTickets);
router.post('/', optionalAuth, ...createTicket);
router.get('/:id', optionalAuth, getTicketById);
router.post('/:id/create-razorpay-order', optionalAuth, createRazorpayOrder);
router.post('/:id/verify-payment', optionalAuth, verifyPayment);
router.post('/:id/fail', optionalAuth, failPayment);

// ── Organizer Routes ──────────────────────────────────────────────────────────
router.post('/verify', protect, requireRole('organizer'), verifyTicket);
router.get('/event/:eventId', protect, requireRole('organizer'), getEventTickets);

export default router;
