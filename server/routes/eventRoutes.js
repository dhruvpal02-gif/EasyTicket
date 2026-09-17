import express from 'express';
import { protect, optionalAuth, isOrganizer } from '../middleware/authMiddleware.js';
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

// 🌐 Public ------------------------------------------------------------------
router.get('/', getPublicEvents);

// 🛡️ Organizer-only ----------------------------------------------------------
// IMPORTANT: /my-events must be declared before /:id so Express doesn't
// treat the string "my-events" as an event ID parameter.
router.get('/my-events', protect, isOrganizer, getMyEvents);
router.post('/', protect, isOrganizer, ...createEvent);
router.put('/:id', protect, isOrganizer, ...updateEvent);
router.delete('/:id', protect, isOrganizer, deleteEvent);
router.patch('/:id/publish', protect, isOrganizer, publishEvent);
router.get('/:id/qr', protect, isOrganizer, getEventQr);

// 🌐 Public (single event) ----------------------------------------------------
router.get('/:id', getEventById);

export default router;
