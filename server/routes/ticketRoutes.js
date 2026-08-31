import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  getEventTickets,
  processPayment,
  failPayment,
  verifyTicket,
} from '../controllers/ticketController.js';

const router = express.Router();

// ── Customer Routes ───────────────────────────────────────────────────────────
// /my-tickets MUST come before /:id to prevent Express from treating 'my-tickets' as an ID
router.get('/my-tickets', protect, requireRole('customer'), getMyTickets);
router.post('/', protect, requireRole('customer'), ...createTicket);
router.get('/:id', protect, requireRole('customer', 'organizer'), getTicketById);
router.post('/:id/pay', protect, requireRole('customer'), processPayment);
router.post('/:id/fail', protect, requireRole('customer'), failPayment);

// ── Organizer Routes ──────────────────────────────────────────────────────────
router.post('/verify', protect, requireRole('organizer'), verifyTicket);
router.get('/event/:eventId', protect, requireRole('organizer'), getEventTickets);

export default router;
