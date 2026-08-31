import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './OrganizerDashboard.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

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
                      <button className="btn btn-outline" onClick={() => handlePublish(event._id)}>Publish</button>
                      <button className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#fca5a5' }} onClick={() => handleDelete(event._id)}>Delete</button>
                      <Link to={`/events/${event._id}`} className="btn btn-outline" style={{ flex: '100%', textAlign: 'center', marginTop: '0.5rem' }}>Preview</Link>
                    </>
                  ) : (
                    <>
                      <Link to={`/events/${event._id}`} className="btn btn-outline">View</Link>
                      <button className="btn btn-outline" onClick={() => openQrModal(event._id)}>Event QR</button>
                      <button className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#fca5a5', width: '100%', marginTop: '0.5rem' }} onClick={() => handleDelete(event._id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
