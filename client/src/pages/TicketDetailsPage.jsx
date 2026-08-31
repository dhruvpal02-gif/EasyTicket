import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './TicketDetailsPage.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const TicketDetailsPage = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data } = await api.get(`/api/tickets/${id}`);
        setTicket(data);
      } catch (err) {
        setError('Failed to load ticket details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="page-container"><p>Loading ticket...</p></div>;
  if (error || !ticket) return <div className="page-container"><div className="alert alert-error">{error || 'Ticket not found.'}</div></div>;

  return (
    <div className="page-container ticket-detail-container">
      <div className="ticket-actions no-print">
        <Link to="/my-tickets" className="back-link">← Back to My Tickets</Link>
        {ticket.status === 'confirmed' && (
          <button className="btn btn-outline" onClick={handlePrint}>🖨️ Print / Save PDF</button>
        )}
      </div>
      
      <div className="ticket-paper">
        <div className="ticket-top">
          <div className="ticket-branding">EasyTicket</div>
          <div className={`ticket-status-badge status-${ticket.status}`}>{ticket.status}</div>
        </div>

        {ticket.event.image && (
          <div className="ticket-hero-img">
            <img src={ticket.event.image.startsWith('/uploads') ? ticket.event.image : ticket.event.image} alt={ticket.event.title} />
          </div>
        )}

        <div className="ticket-body">
          <h1 className="ticket-event-title">{ticket.event.title}</h1>
          <div className="ticket-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Date & Time</span>
              <span className="meta-value">{fmtDate(ticket.event.date)}<br/>{ticket.event.time}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Venue</span>
              <span className="meta-value">{ticket.event.venue}<br/>{ticket.event.city}</span>
            </div>
          </div>
        </div>

        <div className="ticket-tear-line"></div>

        <div className="ticket-details-section">
          <div className="ticket-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Ticket Type</span>
              <span className="meta-value">{ticket.ticketTypeName}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Quantity</span>
              <span className="meta-value">{ticket.quantity}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Attendee Name</span>
              <span className="meta-value">{ticket.attendeeName}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Ticket ID</span>
              <span className="meta-value" style={{ fontFamily: 'monospace' }}>{ticket.ticketId}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Total Amount</span>
              <span className="meta-value" style={{ color: '#4f46e5', fontWeight: '800' }}>₹{ticket.totalAmount}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Payment Status</span>
              <span className="meta-value" style={{ textTransform: 'capitalize' }}>
                {ticket.paymentStatus}
              </span>
            </div>
            {ticket.paymentId && (
              <div className="meta-item">
                <span className="meta-label">Payment ID</span>
                <span className="meta-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{ticket.paymentId}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        {ticket.status === 'confirmed' && ticket.qrCodeDataUri ? (
          <>
            <div className="ticket-tear-line"></div>
            <div className="ticket-qr-section">
              <p className="meta-label" style={{ textAlign: 'center', marginBottom: '1rem' }}>Scan at Entry</p>
              <img src={ticket.qrCodeDataUri} alt="Entry QR Code" className="qr-image" />
              <p className="qr-hint">Keep this QR code private</p>
            </div>
          </>
        ) : null}

        <div className="ticket-footer no-print">
          {ticket.paymentStatus === 'pending' || ticket.paymentStatus === 'failed' ? (
            <div>
              <p style={{ color: '#b91c1c', marginBottom: '0.75rem', fontWeight: '600' }}>Payment is required to confirm this ticket.</p>
              <Link to={`/payment/${ticket._id}`} className="btn btn-primary">Pay Now</Link>
            </div>
          ) : (
            <p>Please present this digital ticket at the venue.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
