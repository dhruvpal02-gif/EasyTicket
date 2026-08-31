import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import './BookingPage.css';

const BookingPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const ticketTypeId = searchParams.get('typeId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [ticketType, setTicketType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({
    attendeeName: user?.name || '',
    attendeeEmail: user?.email || '',
    attendeePhone: '',
  });
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    // If no ticket type selected, back to event
    if (!ticketTypeId) return navigate(`/events/${eventId}`);
    
    // Organizers cannot book tickets
    if (user?.role === 'organizer') return navigate(`/events/${eventId}`);

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
  }, [eventId, ticketTypeId, navigate, user]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (qty < 1) return setError('Quantity must be at least 1.');
    if (qty > (ticketType.quantity - ticketType.sold)) return setError('Not enough tickets available.');
    
    setBookingLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('ticketTypeId', ticketTypeId);
      formData.append('quantity', qty);
      formData.append('attendeeName', form.attendeeName);
      formData.append('attendeeEmail', form.attendeeEmail);
      formData.append('attendeePhone', form.attendeePhone);
      if (photo) formData.append('attendeePhoto', photo);

      const { data } = await api.post('/api/tickets', formData);
      // Redirect to payment flow
      navigate(`/payment/${data._id}`);
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
        <h1>Checkout</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="booking-layout">
        {/* Main Form */}
        <div className="booking-form-wrap">
          <form onSubmit={handleSubmit} className="booking-form" noValidate>
            <section className="form-section">
              <h2>1. Select Quantity</h2>
              <div className="form-group qty-group">
                <label>How many tickets?</label>
                <div className="qty-controls">
                  <button type="button" className="btn btn-outline qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>-</button>
                  <span className="qty-display">{qty}</span>
                  <button type="button" className="btn btn-outline qty-btn" onClick={() => setQty(Math.min(available, qty + 1))} disabled={qty >= available}>+</button>
                </div>
                <small className="help-text">{available} tickets available</small>
              </div>
            </section>

            <section className="form-section">
              <h2>2. Attendee Details</h2>
              <div className="form-group">
                <label htmlFor="attendeeName">Full Name</label>
                <input type="text" id="attendeeName" name="attendeeName" value={form.attendeeName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="attendeeEmail">Email</label>
                <input type="email" id="attendeeEmail" name="attendeeEmail" value={form.attendeeEmail} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="attendeePhone">Phone Number</label>
                <input type="tel" id="attendeePhone" name="attendeePhone" value={form.attendeePhone} onChange={handleChange} placeholder="e.g. +91 9876543210" required />
              </div>
              <div className="form-group">
                <label htmlFor="attendeePhoto">Photo ID (Optional for MVP)</label>
                <input type="file" id="attendeePhoto" accept="image/*" onChange={handlePhotoChange} className="file-input" />
              </div>
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
            <span>Total</span>
            <span>₹{totalAmount}</span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-full booking-submit-btn" 
            onClick={handleSubmit} 
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
          </button>
          <small className="help-text" style={{ textAlign: 'center', marginTop: '0.5rem', display: 'block' }}>
            Payments are simulated for this phase.
          </small>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
