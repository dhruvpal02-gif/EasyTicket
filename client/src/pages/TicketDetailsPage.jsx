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
      
      <div className="premium-ticket-card" ref={ticketRef}>
        {/* TOP SECTION */}
        <div className="ticket-top-section">
          <div className="ticket-header">
            <h1 className="ticket-event-title">{ticket.event.title}</h1>
            <div className={`ticket-status-badge status-${ticket.status}`}>{ticket.status}</div>
          </div>

          <div className="ticket-top-grid">
            <div className="grid-item grid-item-full">
              <span className="ticket-label">VISITOR</span>
              <div className="visitor-box">
                <img 
                  src={ticket.attendeePhoto ? getImageUrl(ticket.attendeePhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.attendeeName)}&background=f3f4f6&color=4f46e5`} 
                  alt={ticket.attendeeName} 
                  className="visitor-avatar" 
                  crossOrigin="anonymous" 
                />
                <span className="visitor-name">{ticket.attendeeName}</span>
              </div>
            </div>

            <div className="grid-item">
              <span className="ticket-label">DATE</span>
              <span className="ticket-value">{fmtDate(ticket.event.date)}</span>
            </div>
            
            <div className="grid-item">
              <span className="ticket-label">TIME SLOT</span>
              <span className="ticket-value">{ticket.event.time}</span>
            </div>

            <div className="grid-item">
              <span className="ticket-label">LOCATION</span>
              <span className="ticket-value">{ticket.event.city}</span>
            </div>
            
            <div className="grid-item">
              <span className="ticket-label">ORGANIZER</span>
              <span className="ticket-value">{ticket.event.organizerName || 'EasyTicket Partner'}</span>
            </div>

            <div className="grid-item">
              <span className="ticket-label">BOOKING ID</span>
              <span className="ticket-value" style={{ fontFamily: 'monospace' }}>{ticket.ticketId}</span>
            </div>

            <div className="grid-item">
              <span className="ticket-label">AMOUNT</span>
              <span className="ticket-value">₹{ticket.totalAmount} ({ticket.paymentStatus})</span>
            </div>
          </div>
        </div>

        {/* PERFORATED DIVIDER */}
        <div className="ticket-divider"></div>

        {/* BOTTOM SECTION */}
        <div className="ticket-bottom-section">
          <div className="bottom-left-grid">
            <div className="grid-item grid-item-full">
              <span className="ticket-label">📍 VENUE</span>
              <span className="ticket-value">{ticket.event.venue}</span>
            </div>
            <div className="grid-item">
              <span className="ticket-label">VALID UNTIL</span>
              <span className="ticket-value">Event End</span>
            </div>
            <div className="grid-item">
              <span className="ticket-label">CATEGORY</span>
              <span className="ticket-value">{ticket.ticketTypeName}</span>
            </div>
            <div className="grid-item">
              <span className="ticket-label">PAX</span>
              <span className="ticket-value">{ticket.quantity} Member{ticket.quantity > 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {ticket.status === 'confirmed' && ticket.qrCodeDataUri && (
            <div className="qr-box">
              <img src={ticket.qrCodeDataUri} alt="Entry QR Code" />
            </div>
          )}
        </div>

        <div className="ticket-footer no-print">
          {ticket.paymentStatus === 'pending' || ticket.paymentStatus === 'failed' ? (
            <div>
              <p style={{ color: '#b91c1c', marginBottom: '0.75rem', fontWeight: '600' }}>Payment is required to confirm this ticket.</p>
              <Link to={`/payment/${ticket._id}`} className="btn btn-primary">Pay Now</Link>
            </div>
          ) : (
            <div className="ticket-footer-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', fontWeight: '700', background: '#10b981', borderColor: '#10b981' }}
                onClick={handleDownloadTicket}
                disabled={downloading}
              >
                {downloading ? 'Generating Image...' : '📥 Download Ticket to Phone'}
              </button>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: '700', background: '#25D366', borderColor: '#25D366' }}
                onClick={() => {
                  const ticketUrl = window.location.href;
                  window.open(`https://wa.me/91${ticket.attendeePhone}?text=Here%20is%20your%20ticket%20link:%20${encodeURIComponent(ticketUrl)}`, '_blank');
                }}
              >
                💬 Send Ticket via WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
