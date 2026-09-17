import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { QRCodeSVG } from 'qrcode.react';
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
  const [qrEvent, setQrEvent] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    ticketPrice: 0,
  });

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

  const openQrModal = (event) => {
    setQrEvent(event);
    setQrModalOpen(true);
  };

  const closeQrModal = () => {
    setQrModalOpen(false);
    setQrEvent(null);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('dashboard-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `event-qr-${qrEvent._id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      ticketPrice: event.ticketTypes?.[0]?.price || 0,
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedTicketTypes = editingEvent.ticketTypes.map((t, idx) => {
         if (idx === 0) return { ...t, price: Number(editForm.ticketPrice) };
         return t;
      });
      
      const payload = {
        title: editForm.title,
        description: editForm.description,
        date: editForm.date,
        time: editForm.time,
        ticketTypes: JSON.stringify(updatedTicketTypes)
      };
      
      const { data } = await api.put(`/api/events/${editingEvent._id}`, payload);
      setEvents(events.map(ev => ev._id === editingEvent._id ? data : ev));
      setEditModalOpen(false);
      alert('Event updated successfully!');
    } catch(err) {
      alert(err.response?.data?.message || 'Failed to update event.');
    }
  };

  if (loading) return <PageLoader text="Loading dashboard..." />;

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
                            <button className="btn btn-outline" onClick={() => openEditModal(event)}>Edit Event</button>
                            <button className="btn btn-outline" onClick={() => openQrModal(event)}>Share QR</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button className="btn btn-outline" onClick={() => handlePublish(event._id)}>Publish Event</button>
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
                            <button className="btn btn-outline" onClick={() => openEditModal(event)}>Edit Event</button>
                            <button className="btn btn-outline" onClick={() => openQrModal(event)}>Share QR</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Link to={`/events/${event._id}`} className="btn btn-outline" style={{ textAlign: 'center' }}>View Public Page</Link>
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

      {/* Edit Event Modal */}
      {editModalOpen && (
        <div className="qr-modal-overlay" onClick={closeEditModal}>
          <div className="qr-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={closeEditModal}>&times;</button>
            <h2>Edit Event</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Event Title</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={editForm.date} 
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input 
                    type="time" 
                    value={editForm.time} 
                    onChange={(e) => setEditForm({...editForm, time: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Ticket Price (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  value={editForm.ticketPrice} 
                  onChange={(e) => setEditForm({...editForm, ticketPrice: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="4"
                  value={editForm.description} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Share QR Modal */}
      {qrModalOpen && qrEvent && (
        <div className="qr-modal-overlay" onClick={closeQrModal}>
          <div className="qr-modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '450px' }}>
            <button className="qr-modal-close" onClick={closeQrModal}>&times;</button>
            <h2>Event QR Code</h2>
            <p>Scan this QR code to view and book tickets.</p>
            
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', margin: '1.5rem 0' }}>
              <QRCodeSVG 
                id="dashboard-qr-code"
                value={`${window.location.origin}/events/${qrEvent._id}`} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="qr-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn btn-primary btn-full" 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/events/${qrEvent._id}`).then(() => alert('Copied!'))}
              >
                Copy Event Link
              </button>
              <button onClick={handleDownloadQR} className="btn btn-outline btn-full">
                ⬇️ Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
