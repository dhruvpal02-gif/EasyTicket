import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import './EventCard.css';

/** Formats a Date or ISO string as "Mon DD, YYYY" */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const EventCard = ({ event }) => {
  const available = event.ticketTypes?.some((t) => t.quantity - t.sold > 0);
  const minPrice  = event.ticketTypes?.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : null;

  return (
    <div className="event-card">
      <div className="event-card-img-wrap">
        {event.image ? (
          <img
            src={getImageUrl(event.image)}
            alt={event.title}
            className="event-card-img"
          />
        ) : (
          <div className="event-card-img-placeholder">🎪</div>
        )}
        {!available && <span className="event-card-badge sold-out">Sold Out</span>}
      </div>

      <div className="event-card-body">
        <p className="event-card-meta">
          {fmtDate(event.date)} &middot; {event.time} &middot; {event.city}
        </p>
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-venue">📍 {event.venue}</p>
        <div className="event-card-footer">
          <span className="event-card-price">
            {minPrice === 0 ? 'Free' : minPrice != null ? `From ₹${minPrice}` : ''}
          </span>
          <Link to={`/events/${event._id}`} className="btn btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
