import PageLoader from '../components/PageLoader';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './MyTicketsPage.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const MyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await api.get('/api/tickets/my-tickets');
        setTickets(data);
      } catch (err) {
        setError('Failed to load your tickets.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="page-container">
      <div className="mytickets-header">
        <h1>My Tickets</h1>
        <p>View and manage your event bookings</p>
      </div>

      {loading && <PageLoader text="Loading your tickets..." fullScreen={false} />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && tickets.length === 0 && (
        <div className="mytickets-empty">
          <p>You haven&apos;t booked any tickets yet.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Events</Link>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="tickets-grid">
          {tickets.map(ticket => (
            <div key={ticket._id} className="ticket-card">
              <div className="ticket-card-header">
                <span className="ticket-id">#{ticket.ticketId}</span>
                <span className={`ticket-status status-${ticket.status}`}>{ticket.status}</span>
              </div>
              <div className="ticket-card-body">
                <h3>{ticket.event?.title || 'Event Unavailable'}</h3>
                <p className="ticket-meta">📅 {fmtDate(ticket.event?.date)}</p>
                <p className="ticket-meta">📍 {ticket.event?.venue}</p>
                
                <div className="ticket-type-info">
                  <p><strong>{ticket.ticketTypeName}</strong></p>
                  <p>Qty: {ticket.quantity}</p>
                  <p className="ticket-total">Total: ₹{ticket.totalAmount}</p>
                </div>
              </div>
              <div className="ticket-card-footer">
                {ticket.paymentStatus === 'pending' || ticket.paymentStatus === 'failed' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/payment/${ticket._id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>Complete Payment</Link>
                    <Link to={`/tickets/${ticket._id}`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>Details</Link>
                  </div>
                ) : (
                  <Link to={`/tickets/${ticket._id}`} className="btn btn-outline btn-full">View Details</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
