import express from 'express';
import { protect, optionalAuth, requireRole, isOrganizer } from '../middleware/authMiddleware.js';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  getEventTickets,
  createRazorpayOrder,
  verifyPayment,
  failPayment,
  verifyTicket,
  verifyTicketPublic,
} from '../controllers/ticketController.js';

const router = express.Router();

// 🌐 Public Track / Verify Route
router.get('/track/:identifier', verifyTicketPublic);

// 🛡️ Customer & Guest Routes
// /my-tickets MUST come before /:id to prevent Express from treating 'my-tickets' as an ID
router.get('/my-tickets', protect, requireRole('customer'), getMyTickets);
router.post('/', optionalAuth, ...createTicket);
router.get('/:id', optionalAuth, getTicketById);
router.post('/:id/create-razorpay-order', optionalAuth, createRazorpayOrder);
router.post('/:id/verify-payment', optionalAuth, verifyPayment);
router.post('/:id/fail', optionalAuth, failPayment);

// 🛡️ Organizer Routes
router.post('/verify', protect, isOrganizer, verifyTicket);
router.get('/event/:eventId', protect, isOrganizer, getEventTickets);

export default router;
