import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Made optional for guest bookings
    },
    guestToken: {
      type: String,
    },
    ticketType: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    ticketTypeName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    pricePerTicket: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true,
    },
    attendeeEmail: {
      type: String,
      trim: true,
      default: '',
    },
    attendeePhone: {
      type: String,
      required: true,
      trim: true,
    },
    attendeePhoto: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'razorpay', ''],
      default: '',
    },
    paymentId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
    },
    isScanned: {
      type: Boolean,
      default: false,
    },
    scannedAt: {
      type: Date,
    },
    scanHistory: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
