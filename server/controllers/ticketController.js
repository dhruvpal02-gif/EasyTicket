import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import { customerPhotoUpload } from '../middleware/uploadMiddleware.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
import Razorpay from 'razorpay';

// ── Helpers ───────────────────────────────────────────────────────────────────
const runUploadIfMultipart = (req, res, next) => {
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
  if (isMultipart) {
    return customerPhotoUpload.single('attendeePhoto')(req, res, next);
  }
  next();
};

const generateTicketId = () => {
  return 'TKT-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const generateQRToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

// ── POST /api/tickets ──────────────────────────────────────────────────────────
export const createTicket = [
  runUploadIfMultipart,
  async (req, res) => {
    try {
      const { eventId, ticketTypeId, quantity, attendeeName, attendeeEmail, attendeePhone } = req.body;
      const qty = parseInt(quantity, 10);

      // 1. Basic validation
      if (!eventId || !ticketTypeId || !qty || !attendeeName || !attendeePhone) {
        return res.status(400).json({ message: 'All booking fields are required.' });
      }
      if (qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be at least 1.' });
      }

      // 2. Verify Event and Ticket Type
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: 'Event not found.' });

      const tType = event.ticketTypes.id(ticketTypeId);
      if (!tType) return res.status(404).json({ message: 'Ticket type not found.' });

      // 3. Verify Inventory
      if (tType.quantity - tType.sold < qty) {
        return res.status(400).json({ message: 'Not enough tickets available.' });
      }

      // 4. Atomic Inventory Update using Optimistic Concurrency Control
      const updateResult = await Event.updateOne(
        {
          _id: eventId,
          'ticketTypes._id': ticketTypeId,
          'ticketTypes.sold': tType.sold,
        },
        {
          $set: { 'ticketTypes.$.sold': tType.sold + qty }
        }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(409).json({ message: 'Inventory changed while booking. Please try again.' });
      }

      // 5. Calculate final price on server
      const totalAmount = tType.price * qty;

      // 6. Create the ticket record
      const isOrganizer = req.user && req.user.role === 'organizer';
      if (isOrganizer) {
        return res.status(403).json({ message: 'Organizers cannot book tickets.' });
      }

      const guestToken = req.user ? undefined : crypto.randomBytes(32).toString('hex');

      const ticket = await Ticket.create({
        ticketId: generateTicketId(),
        event: eventId,
        customer: req.user ? req.user._id : undefined,
        guestToken,
        ticketType: ticketTypeId,
        ticketTypeName: tType.name,
        quantity: qty,
        pricePerTicket: tType.price,
        totalAmount,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        attendeePhoto: req.file ? req.file.path : '', // Cloudinary secure_url
        status: 'pending',
        qrToken: generateQRToken(),
      });

      const responseObj = ticket.toObject();
      if (guestToken) {
        responseObj.guestToken = guestToken; // Explicitly pass it down
      }

      return res.status(201).json(responseObj);
    } catch (error) {
      console.error('createTicket error:', error.message);
      return res.status(500).json({ message: 'Server error while booking ticket.' });
    }
  },
];

// ── GET /api/tickets/my-tickets (Customer) ────────────────────────────────────
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id })
      .populate('event', 'title date time venue city image')
      .sort({ createdAt: -1 });

    return res.json(tickets);
  } catch (error) {
    console.error('getMyTickets error:', error.message);
    return res.status(500).json({ message: 'Server error fetching your tickets.' });
  }
};

// ── GET /api/tickets/:id (Customer or Organizer) ──────────────────────────────
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event', 'title date time venue city image organizer')
      .populate('customer', 'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    // Verify ownership or authorization
    const guestToken = req.headers['x-guest-token'] || req.query.guestToken;
    let authorized = false;

    if (req.user) {
      const isCustomer = req.user.role === 'customer' && ticket.customer && ticket.customer._id.toString() === req.user._id.toString();
      const isOrganizer = req.user.role === 'organizer' && ticket.event.organizer.toString() === req.user._id.toString();
      if (isCustomer || isOrganizer) authorized = true;
    }

    if (!req.user && ticket.guestToken && ticket.guestToken === guestToken) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Unauthorized to view this ticket.' });
    }

    // Prepare ticket object for response
    const ticketData = ticket.toObject();

    // Generate QR Code if paid and confirmed
    if (ticket.status === 'confirmed' && ticket.paymentStatus === 'paid') {
      const qrPayload = JSON.stringify({ t: ticket.ticketId, v: ticket.qrToken });
      try {
        ticketData.qrCodeDataUri = await QRCode.toDataURL(qrPayload, { width: 250, margin: 2 });
      } catch (err) {
        console.error('QR generation error:', err.message);
        ticketData.qrCodeDataUri = null;
      }
    } else {
      ticketData.qrCodeDataUri = null;
    }

    // Do not expose the qrToken directly in the JSON response body unless inside the QR code
    delete ticketData.qrToken;

    return res.json(ticketData);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid ticket ID.' });
    console.error('getTicketById error:', error.message);
    return res.status(500).json({ message: 'Server error fetching ticket details.' });
  }
};

// ── GET /api/tickets/event/:eventId (Organizer) ───────────────────────────────
export const getEventTickets = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this event.' });
    }

    const tickets = await Ticket.find({ event: req.params.eventId })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    return res.json(tickets);
  } catch (error) {
    console.error('getEventTickets error:', error.message);
    return res.status(500).json({ message: 'Server error fetching event tickets.' });
  }
};

// ── POST /api/tickets/:id/create-razorpay-order (Customer) ────────────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    // Verify ownership
    const guestToken = req.headers['x-guest-token'] || req.query.guestToken;
    let authorized = false;

    if (req.user && ticket.customer && ticket.customer.toString() === req.user._id.toString()) authorized = true;
    if (!req.user && ticket.guestToken && ticket.guestToken === guestToken) authorized = true;

    if (!authorized) {
      return res.status(403).json({ message: 'Unauthorized. You can only pay for your own tickets.' });
    }

    // Verify payable state
    if (ticket.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This ticket is already paid.' });
    }
    
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(ticket.totalAmount * 100), // paise
      currency: 'INR',
      receipt: ticket._id.toString(),
    };

    const order = await instance.orders.create(options);

    return res.json({ order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('createRazorpayOrder error:', error);
    return res.status(500).json({ message: 'Payment processing failed.' });
  }
};

// ── POST /api/tickets/:id/verify-payment (Customer) ───────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    const guestToken = req.headers['x-guest-token'] || req.query.guestToken;
    let authorized = false;
    if (req.user && ticket.customer && ticket.customer.toString() === req.user._id.toString()) authorized = true;
    if (!req.user && ticket.guestToken && ticket.guestToken === guestToken) authorized = true;
    if (!authorized) return res.status(403).json({ message: 'Unauthorized.' });

    if (ticket.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This ticket is already paid.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      ticket.paymentStatus = 'failed';
      ticket.status = 'cancelled';
      await ticket.save();
      return res.status(400).json({ message: 'Payment verification failed (Invalid signature).' });
    }

    ticket.paymentStatus = 'paid';
    ticket.status = 'confirmed';
    ticket.paymentId = razorpay_payment_id;
    ticket.paymentMethod = 'razorpay';
    ticket.paidAt = new Date();
    await ticket.save();

    return res.json({ message: 'Payment successful', ticket });
  } catch (error) {
    console.error('verifyPayment error:', error);
    return res.status(500).json({ message: 'Failed to verify payment.' });
  }
};

// ── POST /api/tickets/:id/fail (Customer) ─────────────────────────────────────
export const failPayment = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    const guestToken = req.headers['x-guest-token'] || req.query.guestToken;
    let authorized = false;

    if (req.user && ticket.customer && ticket.customer.toString() === req.user._id.toString()) authorized = true;
    if (!req.user && ticket.guestToken && ticket.guestToken === guestToken) authorized = true;

    if (!authorized) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (ticket.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Cannot fail a payment that is already paid.' });
    }

    ticket.paymentStatus = 'failed';
    ticket.status = 'cancelled';
    await ticket.save();

    return res.json({ message: 'Payment marked as failed', ticket });
  } catch (error) {
    console.error('failPayment error:', error.message);
    return res.status(500).json({ message: 'Failed to update payment status.' });
  }
};

// ── POST /api/tickets/verify (Organizer) ──────────────────────────────────────
export const verifyTicket = async (req, res) => {
  try {
    const { ticketId, qrToken } = req.body;

    if (!ticketId || !qrToken) {
      return res.status(400).json({ message: 'Missing ticketId or qrToken.' });
    }

    const ticket = await Ticket.findOne({ ticketId }).populate('event');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // 1. Organizer Ownership Verification
    if (ticket.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You can only verify tickets for your own events.' });
    }

    // 2. Token Verification
    if (ticket.qrToken !== qrToken) {
      return res.status(400).json({ message: 'Invalid QR token. Ticket verification failed.' });
    }

    // 3. Status Verification
    if (ticket.paymentStatus !== 'paid' || ticket.status !== 'confirmed') {
      return res.status(400).json({
        message: `Ticket is not valid for entry. Payment status: ${ticket.paymentStatus}, Ticket status: ${ticket.status}`,
      });
    }

    // 4. Entry Policy Check
    const entryPolicy = ticket.event.entryPolicy || 'single';

    if (entryPolicy === 'single') {
      // ── Single Entry ────────────────────────────────────────────────────
      if (ticket.isScanned) {
        return res.status(400).json({
          message: 'Ticket already used.',
          error: 'Ticket Already Used',
          scannedAt: ticket.scannedAt,
        });
      }

      ticket.isScanned = true;
      ticket.scannedAt = new Date();
      ticket.scanHistory.push(ticket.scannedAt);
      await ticket.save();
    } else {
      // ── Multiple Entry (mela, zoo, etc.) ────────────────────────────────
      const now = new Date();
      ticket.scanHistory.push(now);
      await ticket.save();
    }

    // 5. Return Safe Verification Data (includes attendeePhoto + scan info)
    return res.json({
      valid: true,
      entryPolicy,
      scanCount: ticket.scanHistory.length,
      ticket: {
        ticketId: ticket.ticketId,
        event: {
          title: ticket.event.title,
          date: ticket.event.date,
          time: ticket.event.time,
          venue: ticket.event.venue,
          city: ticket.event.city,
        },
        ticketTypeName: ticket.ticketTypeName,
        quantity: ticket.quantity,
        attendeeName: ticket.attendeeName,
        attendeePhoto: ticket.attendeePhoto,
        paymentStatus: ticket.paymentStatus,
        status: ticket.status,
        isScanned: ticket.isScanned,
        scannedAt: ticket.scannedAt,
      },
    });
  } catch (error) {
    console.error('verifyTicket error:', error.message);
    return res.status(500).json({ message: 'Server error during ticket verification.' });
  }
};
