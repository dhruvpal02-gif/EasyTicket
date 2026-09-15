import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import './BookingPage.css';

const BookingPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const ticketTypeId = searchParams.get('typeId');
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [ticketType, setTicketType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({
    attendeeName: '',
    whatsappNumber: '',
  });
  const [attendeePhoto, setAttendeePhoto] = useState(null);

  useEffect(() => {
    if (!ticketTypeId) return navigate(`/events/${eventId}`);
    
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/api/events/${eventId}`);
        setEvent(data);
        const tType = data.ticketTypes.find(t => t._id === ticketTypeId);
        if (!tType) {
          setError('Ticket type not found.');
        } else {
          setTicketType(tType);
        }
      } catch (err) {
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, ticketTypeId, navigate]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttendeePhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (qty < 1) return setError('Number of members must be at least 1.');
    if (qty > (ticketType.quantity - ticketType.sold)) return setError('Not enough tickets available.');
    
    // Strict 10-digit validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(form.whatsappNumber)) {
      return setError('Please enter a valid 10-digit WhatsApp number.');
    }
    
    if (event.requireAttendeePhoto && !attendeePhoto) {
      return setError('An attendee photo is required for this event.');
    }
    
    setBookingLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('ticketTypeId', ticketTypeId);
      formData.append('quantity', qty);
      formData.append('attendeeName', form.attendeeName);
      formData.append('attendeePhone', form.whatsappNumber);
      if (attendeePhoto) {
        formData.append('attendeePhoto', attendeePhoto);
      }

      const { data } = await api.post('/api/tickets', formData);
      // Redirect to payment flow
      if (data.guestToken) {
        navigate(`/payment/${data._id}?guestToken=${data.guestToken}`);
      } else {
        navigate(`/payment/${data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading checkout...</p></div>;
  if (!event || !ticketType) return <div className="page-container"><div className="alert alert-error">{error || 'Invalid booking.'}</div></div>;

  const available = ticketType.quantity - ticketType.sold;
  const totalAmount = ticketType.price * qty;

  return (
    <div className="page-container booking-container">
      <div className="booking-header">
        <Link to={`/events/${eventId}`} className="back-link">← Back to Event</Link>
        <h1>Guest Checkout</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="booking-layout">
        {/* Main Form */}
        <div className="booking-form-wrap">
          <form onSubmit={handleSubmit} className="booking-form" noValidate>
            <section className="form-section">
              <h2>1. Number of Members</h2>
              <div className="form-group qty-group">
                <label>How many people are attending?</label>
                <div className="qty-controls">
                  <button type="button" className="btn btn-outline qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>-</button>
                  <span className="qty-display">{qty}</span>
                  <button type="button" className="btn btn-outline qty-btn" onClick={() => setQty(Math.min(available, qty + 1))} disabled={qty >= available}>+</button>
                </div>
                <small className="help-text">{available} slots available</small>
              </div>
            </section>

            <section className="form-section">
              <h2>2. Contact Details</h2>
              <div className="form-group">
                <label htmlFor="attendeeName">Full Name</label>
                <input type="text" id="attendeeName" name="attendeeName" value={form.attendeeName} onChange={handleChange} placeholder="e.g. Rahul Kumar" required />
              </div>
              <div className="form-group">
                <label htmlFor="whatsappNumber">WhatsApp Number (10 digits)</label>
                <input type="tel" id="whatsappNumber" name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} placeholder="9876543210" pattern="\d{10}" maxLength="10" required />
              </div>
              {event.requireAttendeePhoto && (
                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem', display: 'block' }}>
                    Attendee Photo Required *
                  </label>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                    The event organizer requires a clear photo of your face for identity verification at the gate.
                  </p>
                  
                  <div style={{ position: 'relative', width: '100%', border: attendeePhoto ? '2px solid #10b981' : '2px dashed #cbd5e1', borderRadius: '12px', background: attendeePhoto ? '#ecfdf5' : '#f8fafc', padding: '2rem 1rem', textAlign: 'center', transition: 'all 0.2s ease', cursor: 'pointer', overflow: 'hidden' }}>
                    <input 
                      type="file" 
                      id="attendeePhoto" 
                      accept="image/*"
                      capture="user"
                      onChange={handleImageChange}
                      required
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    
                    {!attendeePhoto ? (
                      <div style={{ pointerEvents: 'none' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '48px', height: '48px', margin: '0 auto', color: '#94a3b8' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                        </svg>
                        <p style={{ marginTop: '0.75rem', fontWeight: '500', color: '#475569' }}>Tap to upload visitor photo</p>
                      </div>
                    ) : (
                      <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '40px', height: '40px', color: '#10b981', marginBottom: '0.5rem' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p style={{ fontWeight: '600', color: '#065f46', marginBottom: '0.25rem' }}>Successfully Uploaded</p>
                        <p style={{ fontSize: '0.85rem', color: '#047857', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attendeePhoto.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="booking-summary">
          <h2>Order Summary</h2>
          <div className="summary-event">
            <h3>{event.title}</h3>
            <p>📍 {event.venue}, {event.city}</p>
          </div>
          <div className="summary-ticket">
            <div className="summary-row">
              <span>{ticketType.name} x {qty}</span>
              <span>₹{ticketType.price * qty}</span>
            </div>
          </div>
          <div className="summary-total">
            <span>Total Price</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>₹{totalAmount}</span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-full booking-submit-btn" 
            onClick={handleSubmit} 
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
