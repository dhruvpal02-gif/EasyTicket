import Event from '../models/Event.js';
import { eventImageUpload } from '../middleware/uploadMiddleware.js';
import QRCode from 'qrcode';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Runs Multer only when the request is multipart/form-data.
 * Falls back cleanly for JSON requests (used in tests / Postman with JSON body).
 */
const runUploadIfMultipart = (req, res, next) => {
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
  if (isMultipart) {
    return eventImageUpload.single('image')(req, res, next);
  }
  next();
};

/**
 * Parse ticketTypes from the request body.
 * When sent as FormData the field is a JSON string; when sent as JSON it is already an array.
 */
const parseTicketTypes = (raw) => {
  if (!raw) return [];
  if (typeof raw === 'string') return JSON.parse(raw);
  return raw;
};

/** Build the image value: prefer an uploaded file (Cloudinary URL), then a pasted URL, then keep existing. */
const resolveImage = (req, existing = '') => {
  if (req.file) return req.file.path; // Cloudinary secure_url
  if (req.body.imageUrl) return req.body.imageUrl.trim();
  return existing;
};

// ── POST /api/events ──────────────────────────────────────────────────────────
export const createEvent = [
  runUploadIfMultipart,
  async (req, res) => {
    try {
      const { title, description, date, time, venue, city, eventTemplate, entryPolicy } = req.body;

      if (!title || !description || !date || !time || !venue || !city) {
        return res.status(400).json({ message: 'All event fields are required.' });
      }

      let ticketTypes;
      try {
        ticketTypes = parseTicketTypes(req.body.ticketTypes);
      } catch {
        return res.status(400).json({ message: 'Invalid ticketTypes format.' });
      }

      if (!ticketTypes.length) {
        return res.status(400).json({ message: 'At least one ticket type is required.' });
      }

      const event = await Event.create({
        title,
        description,
        date,
        time,
        venue,
        city,
        image: resolveImage(req),
        // Always take organizer from the verified JWT — never from the request body
        organizer: req.user._id,
        ticketTypes,
        eventTemplate: eventTemplate || 'custom',
        entryPolicy: entryPolicy || 'single',
      });

      return res.status(201).json(event);
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(' ') });
      }
      console.error('createEvent error:', error.message);
      return res.status(500).json({ message: 'Server error while creating event.' });
    }
  },
];

// ── GET /api/events (Public) ──────────────────────────────────────────────────
export const getPublicEvents = async (req, res) => {
  try {
    const events = await Event.find({ isPublished: true })
      .populate('organizer', 'name email')
      .sort({ date: 1 });
    return res.json(events);
  } catch (error) {
    console.error('getPublicEvents error:', error.message);
    return res.status(500).json({ message: 'Server error fetching events.' });
  }
};

// ── GET /api/events/my-events ─────────────────────────────────────────────────
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ date: 1 });
    return res.json(events);
  } catch (error) {
    console.error('getMyEvents error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching your events.' });
  }
};

// ── GET /api/events/:id (Public / Optional Auth) ──────────────────────────────
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    // If event is not published, only the owner can view it
    if (!event.isPublished) {
      if (!req.user || req.user._id.toString() !== event.organizer._id.toString()) {
        return res.status(404).json({ message: 'Event not found or not yet published.' });
      }
    }

    return res.json(event);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid event ID format.' });
    console.error('getEventById error:', error.message);
    return res.status(500).json({ message: 'Server error fetching event details.' });
  }
};

// ── PUT /api/events/:id ───────────────────────────────────────────────────────
export const updateEvent = [
  runUploadIfMultipart,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found.' });

      // Ownership check — only the organizer who created the event can edit it
      if (event.organizer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not the owner of this event.' });
      }

      const { title, description, date, time, venue, city, eventTemplate, entryPolicy } = req.body;

      if (title)       event.title       = title;
      if (description) event.description = description;
      if (date)        event.date        = date;
      if (time)        event.time        = time;
      if (venue)       event.venue       = venue;
      if (city)        event.city        = city;
      if (eventTemplate) event.eventTemplate = eventTemplate;
      if (entryPolicy)   event.entryPolicy   = entryPolicy;

      const imageResolved = resolveImage(req, event.image);
      event.image = imageResolved;

      if (req.body.ticketTypes) {
        try {
          event.ticketTypes = parseTicketTypes(req.body.ticketTypes);
        } catch {
          return res.status(400).json({ message: 'Invalid ticketTypes format.' });
        }
      }

      const updated = await event.save();
      return res.json(updated);
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(' ') });
      }
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid event ID.' });
      }
      console.error('updateEvent error:', error.message);
      return res.status(500).json({ message: 'Server error while updating event.' });
    }
  },
];

// ── DELETE /api/events/:id ────────────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not the owner of this event.' });
    }

    await event.deleteOne();
    return res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }
    console.error('deleteEvent error:', error.message);
    return res.status(500).json({ message: 'Server error while deleting event.' });
  }
};

// ── PATCH /api/events/:id/publish (Organizer) ─────────────────────────────────
export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    // Verify ownership
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (event.isPublished) {
      return res.status(400).json({ message: 'Event is already published.' });
    }

    event.isPublished = true;
    event.publishedAt = new Date();
    await event.save();

    return res.json({ message: 'Event published successfully!', event });
  } catch (error) {
    console.error('publishEvent error:', error.message);
    return res.status(500).json({ message: 'Server error publishing event.' });
  }
};

// ── GET /api/events/:id/qr (Organizer) ────────────────────────────────────────
export const getEventQr = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (!event.isPublished) {
      return res.status(400).json({ message: 'Cannot generate QR for unpublished event.' });
    }

    // Generate public event URL
    // Pulls from FRONTEND_URL in production, otherwise defaults to local dev port
    const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = rawFrontendUrl.replace(/\/$/, ''); // safe stripping of trailing slashes
    const eventPublicUrl = `${frontendUrl}/events/${event._id}`;

    const qrDataUri = await QRCode.toDataURL(eventPublicUrl, { width: 300, margin: 2 });
    
    return res.json({
      url: eventPublicUrl,
      qrCodeDataUri: qrDataUri
    });
  } catch (error) {
    console.error('getEventQr error:', error.message);
    return res.status(500).json({ message: 'Server error generating event QR.' });
  }
};
