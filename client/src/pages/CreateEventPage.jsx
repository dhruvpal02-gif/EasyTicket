import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CreateEventPage.css';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    city: '',
  });

  const [image, setImage] = useState(null);

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'Regular', price: 0, quantity: 100, description: 'Standard admission' }
  ]);

  const [eventTemplate, setEventTemplate] = useState('mela');
  const [entryPolicy, setEntryPolicy] = useState('multiple');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleTemplateSelect = (template) => {
    setEventTemplate(template);
    if (template === 'mela' || template === 'zoo') {
      setEntryPolicy('multiple');
    } else if (template === 'concert') {
      setEntryPolicy('single');
    }
  };

  const handleTicketChange = (index, field, value) => {
    const newTickets = [...ticketTypes];
    newTickets[index][field] = value;
    setTicketTypes(newTickets);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, quantity: 50, description: '' }]);
  };

  const removeTicketType = (index) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!form.title || !form.description || !form.date || !form.time || !form.venue || !form.city) {
      return 'All event details are required.';
    }
    if (ticketTypes.length === 0) return 'At least one ticket type is required.';
    for (let t of ticketTypes) {
      if (!t.name) return 'Ticket name is required.';
      if (t.price < 0) return 'Ticket price cannot be negative.';
      if (t.quantity < 1) return 'Ticket quantity must be at least 1.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      formData.append('ticketTypes', JSON.stringify(ticketTypes));
      formData.append('eventTemplate', eventTemplate);
      formData.append('entryPolicy', entryPolicy);
      if (image) {
        formData.append('image', image);
      }

      const { data } = await api.post('/api/events', formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="create-event-header">
        <h1>Create New Event</h1>
        <p>Fill out the details to publish your event.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="create-event-form" noValidate>
        
        <section className="form-section">
          <h2>1. Event Template</h2>
          <p className="help-text" style={{ marginBottom: '1rem' }}>Choose an event type to configure default entry rules.</p>
          
          <div className="template-grid">
            <div className={`template-card ${eventTemplate === 'mela' ? 'active' : ''}`} onClick={() => handleTemplateSelect('mela')}>
              <div className="template-icon">🎪</div>
              <div className="template-title">Local Mela / Fair</div>
              <div className="template-desc">Allows attendees to enter and exit multiple times.</div>
            </div>
            <div className={`template-card ${eventTemplate === 'zoo' ? 'active' : ''}`} onClick={() => handleTemplateSelect('zoo')}>
              <div className="template-icon">🦁</div>
              <div className="template-title">Zoo / Museum / Parks</div>
              <div className="template-desc">Allows attendees to enter and exit multiple times.</div>
            </div>
            <div className={`template-card ${eventTemplate === 'concert' ? 'active' : ''}`} onClick={() => handleTemplateSelect('concert')}>
              <div className="template-icon">🎤</div>
              <div className="template-title">Concert / Stage Show</div>
              <div className="template-desc">Strict single entry. Cannot re-enter once scanned.</div>
            </div>
            <div className={`template-card ${eventTemplate === 'custom' ? 'active' : ''}`} onClick={() => handleTemplateSelect('custom')}>
              <div className="template-icon">⚙️</div>
              <div className="template-title">Custom / Advanced</div>
              <div className="template-desc">Manually configure entry rules.</div>
            </div>
          </div>

          {eventTemplate === 'custom' && (
            <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label htmlFor="entryPolicy" style={{ fontWeight: 600, color: '#111827', marginBottom: '0.5rem', display: 'block' }}>Custom Entry Policy</label>
              <select 
                id="entryPolicy" 
                value={entryPolicy} 
                onChange={(e) => setEntryPolicy(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
              >
                <option value="single">Strict Single Entry (One-time scan)</option>
                <option value="multiple">Multiple Entry (In-and-out allowed)</option>
              </select>
            </div>
          )}
        </section>

        <section className="form-section">
          <h2>2. Event Details</h2>
          <div className="form-group">
            <label htmlFor="title">Event Title</label>
            <input type="text" id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Summer Music Festival" required />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows="4" value={form.description} onChange={handleChange} placeholder="What is this event about?" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input type="date" id="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input type="time" id="time" name="time" value={form.time} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="venue">Venue Name</label>
              <input type="text" id="venue" name="venue" value={form.venue} onChange={handleChange} placeholder="e.g. Central Park" required />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input type="text" id="city" name="city" value={form.city} onChange={handleChange} placeholder="e.g. New York" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="image">Event Image</label>
            <input type="file" id="image" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="file-input" />
            <small className="help-text">Max size: 5MB. Formats: JPG, PNG, WEBP.</small>
          </div>
        </section>

        <section className="form-section">
          <h2>3. Ticket Types</h2>
          <p className="help-text" style={{ marginBottom: '1rem' }}>Add the different types of tickets available for your event.</p>
          
          <div className="ticket-types-list">
            {ticketTypes.map((ticket, index) => (
              <div key={index} className="ticket-type-card form-ticket-card">
                <div className="ticket-card-header">
                  <h3>Ticket #{index + 1}</h3>
                  {ticketTypes.length > 1 && (
                    <button type="button" className="btn-icon btn-danger-text" onClick={() => removeTicketType(index)}>
                      ✕ Remove
                    </button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ticket Name</label>
                    <input type="text" value={ticket.name} onChange={(e) => handleTicketChange(index, 'name', e.target.value)} placeholder="e.g. VIP, General Admission" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input type="number" min="0" value={ticket.price} onChange={(e) => handleTicketChange(index, 'price', Number(e.target.value))} required />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" min="1" value={ticket.quantity} onChange={(e) => handleTicketChange(index, 'quantity', Number(e.target.value))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input type="text" value={ticket.description} onChange={(e) => handleTicketChange(index, 'description', e.target.value)} placeholder="e.g. Includes front row access" />
                </div>
              </div>
            ))}
          </div>
          
          <button type="button" className="btn btn-outline" onClick={addTicketType} style={{ marginTop: '0.5rem' }}>
            + Add Another Ticket Type
          </button>
        </section>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Publishing Event...' : 'Publish Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
