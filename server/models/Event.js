import mongoose from 'mongoose';

// ── Ticket Type (embedded sub-document) ───────────────────────────────────────
const ticketTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ticket type name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  sold: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// ── Event ─────────────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    // Stores the filename of the uploaded image (served from /uploads/)
    // or a full URL if the organizer pastes a link.
    image: {
      type: String,
      default: '',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketTypes: {
      type: [ticketTypeSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'At least one ticket type is required',
      },
    },
    eventTemplate: {
      type: String,
      enum: ['mela', 'zoo', 'concert', 'custom'],
      default: 'custom',
    },
    entryPolicy: {
      type: String,
      enum: ['single', 'multiple'],
      default: 'single',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    requireAttendeePhoto: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
