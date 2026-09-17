import PageLoader from '../components/PageLoader';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { getImageUrl } from '../utils/imageUtils';
import './EventDetailPage.css';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/events/${id}`);
        setEvent(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Event not found.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleBook = (ticketTypeId) => {
    navigate(`/book/${id}?typeId=${ticketTypeId}`);
  };

  if (loading) return <PageLoader text="Loading event..." />;
  if (error)   return <div className="page-container"><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="page-container">
      <Link to="/" className="back-link">← Back to Events</Link>

      <div className="event-detail-hero">
        {event.image ? (
          <img src={getImageUrl(event.image)} alt={event.title} className="event-detail-img" />
        ) : (
          <div className="event-detail-img-placeholder">🎪</div>
        )}
      </div>

      <div className="event-detail-body">
        <div className="event-detail-main">
          <div className="event-detail-header">
            <h1>
              {event.title}
              {!event.isPublished && (
                <span style={{ fontSize: '0.8rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '1rem', verticalAlign: 'middle', fontWeight: 'bold' }}>
                  DRAFT PREVIEW
                </span>
              )}
            </h1>
          </div>

          <div className="event-detail-meta">
            <span>📅 {fmtDate(event.date)} at {event.time}</span>
            <span>📍 {event.venue}, {event.city}</span>
            {event.organizer && <span>🎪 By {event.organizer.name}</span>}
          </div>

          <div className="event-detail-description">
            <h2>About this event</h2>
            <p>{event.description}</p>
          </div>
        </div>

        <div className="event-detail-tickets">
          <h2>Tickets</h2>
          {event.ticketTypes?.map((t, i) => {
            const remaining = t.quantity - t.sold;
            return (
              <div key={i} className={`ticket-type-card ${remaining === 0 ? 'sold-out' : ''}`}>
                <div>
                  <p className="ticket-type-name">{t.name}</p>
                  {t.description && <p className="ticket-type-desc">{t.description}</p>}
                  <p className="ticket-type-avail">
                    {remaining > 0 ? `${remaining} remaining` : 'Sold out'}
                  </p>
                </div>
                <div className="ticket-type-action">
                  <div className="ticket-type-price">
                    {t.price === 0 ? 'Free' : `₹${t.price}`}
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    disabled={remaining === 0 || user?.role === 'organizer'}
                    onClick={() => handleBook(t._id)}
                  >
                    {remaining === 0 ? 'Sold Out' : 'Get Ticket'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

