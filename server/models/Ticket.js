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
      required: true,
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
      required: true,
      trim: true,
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
      enum: ['card', 'upi', 'netbanking', ''],
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
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
