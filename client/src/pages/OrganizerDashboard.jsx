import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import './OrganizerDashboard.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const OrganizerDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'events' | 'payout'

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Export state
  const [exporting, setExporting] = useState(null);

  // Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Payout form state
  const [payoutForm, setPayoutForm] = useState({
    bankAccountName: user?.payoutDetails?.bankAccountName || '',
    bankAccountNumber: user?.payoutDetails?.bankAccountNumber || '',
    ifscCode: user?.payoutDetails?.ifscCode || '',
    upiId: user?.payoutDetails?.upiId || '',
  });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [payoutError, setPayoutError] = useState('');

  useEffect(() => {
    if (activeTab === 'events' || activeTab === 'analytics') {
      fetchEvents();
    }
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/api/events/my-events');
      setEvents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/api/events/${id}`);
      setEvents(events.filter(e => e._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Are you sure you want to publish this event? It will become visible to everyone.')) return;
    try {
      const { data } = await api.patch(`/api/events/${id}/publish`);
      setEvents(events.map(e => e._id === id ? data.event : e));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish event.');
    }
  };

  const handleExportCSV = async (eventId, eventTitle) => {
    setExporting(eventId);
    try {
      const { data: tickets } = await api.get(`/api/tickets/event/${eventId}`);
      
      if (!tickets || tickets.length === 0) {
        alert('No tickets sold yet for this event.');
        return;
      }

      const headers = ['Ticket ID', 'Attendee Name', 'Attendee Email', 'Ticket Type', 'Quantity', 'Payment Status', 'Scanned'];
      
      const rows = tickets.map(t => [
        t.ticketId,
        `"${(t.attendeeName || '').replace(/"/g, '""')}"`, 
        `"${(t.customer?.email || 'Guest').replace(/"/g, '""')}"`,
        `"${(t.ticketTypeName || '').replace(/"/g, '""')}"`,
        t.quantity,
        t.paymentStatus,
        t.isScanned ? 'Yes' : 'No'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_GuestList.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to export guest list.');
    } finally {
      setExporting(null);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError('');
    setPayoutSuccess('');
    
    try {
      const { data } = await api.patch('/api/auth/payout-details', payoutForm);
      updateUser(data.user);
      setPayoutSuccess('Payout details updated successfully.');
    } catch (err) {
      setPayoutError(err.response?.data?.message || 'Failed to update payout details.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const openQrModal = async (id) => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrData(null);
    try {
      const { data } = await api.get(`/api/events/${id}/qr`);
      setQrData(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate Event QR.');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrModal = () => {
    setQrModalOpen(false);
    setQrData(null);
  };

  if (loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  return (
    <div className="page-container dashboard-container">
      <div className="dashboard-header">
        <h1>Organizer Dashboard</h1>
        <Link to="/events/create" className="btn btn-primary">
          + Create Event
        </Link>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          My Events
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payout' ? 'active' : ''}`}
          onClick={() => setActiveTab('payout')}
        >
          Payout Settings
        </button>
      </div>

      {activeTab === 'analytics' && (
        <AnalyticsDashboard events={events} />
      )}

      {activeTab === 'events' && (
        <>
          {error && <div className="alert alert-error">{error}</div>}

          {events.length === 0 && !error ? (
            <div className="empty-state">
              <p>You haven't created any events yet.</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {events.map((event) => {
                const totalTickets = event.ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
                const totalSold = event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);
                
                return (
                  <div key={event._id} className="dashboard-card">
                    <div className="card-top">
                      <h3>{event.title}</h3>
                      <div className={`status-badge ${event.isPublished ? 'status-published' : 'status-draft'}`}>
                        {event.isPublished ? 'Published' : 'Draft'}
                      </div>
                    </div>
                    
                    <p className="event-date">📅 {fmtDate(event.date)} at {event.time}</p>
                    <p className="event-location">📍 {event.city}</p>
                    
                    <div className="stats-row">
                      <div className="stat">
                        <span>Sold</span>
                        <strong>{totalSold} / {totalTickets}</strong>
                      </div>
                    </div>

                    <div className="dashboard-card-actions">
                      {!event.isPublished ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button className="btn btn-outline" onClick={() => handlePublish(event._id)}>Publish</button>
                            <Link to={`/events/${event._id}`} className="btn btn-outline" style={{ textAlign: 'center' }}>Preview</Link>
                          </div>
                          <button 
                            className="btn btn-outline" 
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                            onClick={() => handleExportCSV(event._id, event.title)}
                            disabled={exporting === event._id}
                          >
                            {exporting === event._id ? 'Exporting...' : '📥 Export Guest List'}
                          </button>
                          <button className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#fca5a5', width: '100%' }} onClick={() => handleDelete(event._id)}>Delete</button>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Link to={`/events/${event._id}`} className="btn btn-outline" style={{ textAlign: 'center' }}>View</Link>
                            <button className="btn btn-outline" onClick={() => openQrModal(event._id)}>Event QR</button>
                          </div>
                          <button 
                            className="btn btn-outline" 
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                            onClick={() => handleExportCSV(event._id, event.title)}
                            disabled={exporting === event._id}
                          >
                            {exporting === event._id ? 'Exporting...' : '📥 Export Guest List'}
                          </button>
                          <button className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#fca5a5', width: '100%' }} onClick={() => handleDelete(event._id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'payout' && (
        <div className="payout-settings-container">
          <h2>Bank & UPI Details</h2>
          <p className="help-text" style={{ marginBottom: '1.5rem' }}>
            Provide your payment details to receive payouts for your ticket sales.
          </p>

          {payoutSuccess && <div className="alert alert-success">{payoutSuccess}</div>}
          {payoutError && <div className="alert alert-error">{payoutError}</div>}

          <form onSubmit={handlePayoutSubmit} className="payout-form">
            <div className="form-group">
              <label>Bank Account Name</label>
              <input 
                type="text" 
                value={payoutForm.bankAccountName} 
                onChange={(e) => setPayoutForm({...payoutForm, bankAccountName: e.target.value})} 
                placeholder="e.g. Acme Events Pvt Ltd"
              />
            </div>
            
            <div className="form-group">
              <label>Bank Account Number</label>
              <input 
                type="text" 
                value={payoutForm.bankAccountNumber} 
                onChange={(e) => setPayoutForm({...payoutForm, bankAccountNumber: e.target.value})} 
                placeholder="e.g. 1234567890"
              />
            </div>
            
            <div className="form-group">
              <label>IFSC Code</label>
              <input 
                type="text" 
                value={payoutForm.ifscCode} 
                onChange={(e) => setPayoutForm({...payoutForm, ifscCode: e.target.value})} 
                placeholder="e.g. HDFC0001234"
              />
            </div>
            
            <div className="form-group">
              <label>UPI ID (Optional)</label>
              <input 
                type="text" 
                value={payoutForm.upiId} 
                onChange={(e) => setPayoutForm({...payoutForm, upiId: e.target.value})} 
                placeholder="e.g. acme@upi"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={payoutLoading}>
              {payoutLoading ? 'Saving...' : 'Save Payout Details'}
            </button>
          </form>
        </div>
      )}

      {/* QR Modal */}
      {qrModalOpen && (
        <div className="qr-modal-overlay" onClick={closeQrModal}>
          <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={closeQrModal}>&times;</button>
            <h2>Event QR Code</h2>
            <p>Scan this QR code to open this event</p>
            
            {qrLoading ? (
              <div className="qr-placeholder">Generating...</div>
            ) : qrData ? (
              <div className="qr-result">
                <img src={qrData.qrCodeDataUri} alt="Event QR Code" className="event-qr-img" />
                <input type="text" readOnly value={qrData.url} className="qr-url-input" />
                <div className="qr-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => navigator.clipboard.writeText(qrData.url).then(() => alert('Copied!'))}
                  >
                    Copy Event Link
                  </button>
                  <a href={qrData.qrCodeDataUri} download="event-qr.png" className="btn btn-outline">
                    Download QR
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
