import express from 'express';
import { protect, optionalAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  createEvent,
  getPublicEvents,
  getMyEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventQr
} from '../controllers/eventController.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', getPublicEvents);

// ── Organizer-only ────────────────────────────────────────────────────────────
// IMPORTANT: /my-events must be declared before /:id so Express doesn't
// treat the string "my-events" as an event ID parameter.
router.get('/my-events', protect, requireRole('organizer'), getMyEvents);
router.post('/', protect, requireRole('organizer'), ...createEvent);
router.put('/:id', protect, requireRole('organizer'), ...updateEvent);
router.delete('/:id', protect, requireRole('organizer'), deleteEvent);
router.patch('/:id/publish', protect, requireRole('organizer'), publishEvent);
router.get('/:id/qr', protect, requireRole('organizer'), getEventQr);

// ── Public (single event) ─────────────────────────────────────────────────────
router.get('/:id', getEventById);

export default router;
