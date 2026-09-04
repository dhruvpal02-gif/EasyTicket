import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import './TicketDetailsPage.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const TicketDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('guestToken');
  const ticketRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const headers = guestToken ? { 'X-Guest-Token': guestToken } : {};
        const { data } = await api.get(`/api/tickets/${id}`, { headers });
        setTicket(data);
      } catch (err) {
        setError('Failed to load ticket details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, guestToken]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    
    try {
      // Temporarily hide actions we don't want in the screenshot
      const actions = ticketRef.current.querySelector('.ticket-footer-actions');
      if (actions) actions.style.display = 'none';

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // High quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      if (actions) actions.style.display = 'flex';

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = `Ticket_${ticket.ticketId}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating ticket image:', err);
      alert('Failed to download ticket image.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading ticket...</p></div>;
  if (error || !ticket) return <div className="page-container"><div className="alert alert-error">{error || 'Ticket not found.'}</div></div>;

  return (
    <div className="page-container ticket-detail-container">
      <div className="ticket-actions no-print">
        {guestToken ? (
          <Link to="/" className="back-link">← Back to Events</Link>
        ) : (
          <Link to="/my-tickets" className="back-link">← Back to My Tickets</Link>
        )}
        {ticket.status === 'confirmed' && (
          <button className="btn btn-outline" onClick={handlePrint}>🖨️ Print / Save PDF</button>
        )}
      </div>
      
      <div className="ticket-paper" ref={ticketRef}>
        <div className="ticket-top">
          <div className="ticket-branding">EasyTicket</div>
          <div className={`ticket-status-badge status-${ticket.status}`}>{ticket.status}</div>
        </div>

        {ticket.event.image && (
          <div className="ticket-hero-img">
            <img src={getImageUrl(ticket.event.image)} alt={ticket.event.title} crossOrigin="anonymous" />
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
            <div className="ticket-footer-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p>Please present this digital ticket at the venue.</p>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', fontWeight: '700', background: '#10b981', borderColor: '#10b981' }}
                onClick={handleDownloadTicket}
                disabled={downloading}
              >
                {downloading ? 'Generating Image...' : '📥 Download Ticket to Phone'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
