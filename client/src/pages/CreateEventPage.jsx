import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import './CreateEventPage.css';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ accountName: '', accountNumber: '', ifscCode: '' });
  
  const [successEvent, setSuccessEvent] = useState(null);

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('draftEvent');
      return draft ? JSON.parse(draft) : null;
    } catch { return null; }
  };
  const draft = loadDraft();

  const [step, setStep] = useState(draft?.step ?? 1); // 1 = Template Selection, 2 = Form Details

  const [form, setForm] = useState(draft?.form ?? {
    title: '',
    description: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    category: 'General',
    venue: '',
    city: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');

  const [ticketTypes, setTicketTypes] = useState(draft?.ticketTypes ?? [
    { name: 'Regular', price: 0, quantity: 100, description: 'Standard admission' }
  ]);

  const [eventTemplate, setEventTemplate] = useState(draft?.eventTemplate ?? 'mela');
  const [entryPolicy, setEntryPolicy] = useState(draft?.entryPolicy ?? 'multiple');
  const [requireAttendeePhoto, setRequireAttendeePhoto] = useState(draft?.requireAttendeePhoto ?? false);

  // Auto-save draft on change
  useEffect(() => {
    const draftData = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step };
    localStorage.setItem('draftEvent', JSON.stringify(draftData));
  }, [form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setUploadStatus('uploading');
      
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      
      setTimeout(() => {
        setUploadStatus('success');
      }, 1200);
    }
  };

  const handleResetImage = () => {
    setImage(null);
    setImagePreview(null);
    setUploadStatus('idle');
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  const handleTemplateSelect = (template) => {
    // 1. No authentication checks here. Any user can click a template.
    // 2. Strictly set the template type and step 2 without preconditions.
    setEventTemplate(template);
    
    if (template === 'mela' || template === 'zoo') {
      setEntryPolicy('multiple');
    } else if (template === 'concert') {
      setEntryPolicy('single');
    } else {
      setEntryPolicy('single'); // fallback for custom
    }
    
    setStep(2); // Instantly transition to Form Details (Step 2)
    window.scrollTo(0, 0);
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
    if (!form.title || !form.description || !form.date || !form.time || !form.endDate || !form.endTime || !form.venue || !form.city || !form.category) {
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

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/api/auth/bank-details', bankForm);
      setShowBankModal(false);
      // Wait a moment for context/state updates, though api call succeeded
      await publishEvent();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bank details.');
      setLoading(false);
    }
  };

  const publishEvent = async () => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      formData.append('ticketTypes', JSON.stringify(ticketTypes));
      formData.append('eventTemplate', eventTemplate);
      formData.append('entryPolicy', entryPolicy);
      formData.append('requireAttendeePhoto', requireAttendeePhoto);
      if (image) {
        formData.append('image', image);
      }

      const res = await api.post('/api/events', formData);
      localStorage.removeItem('draftEvent'); // Clear draft on success
      
      // Instead of navigate, show the success modal with QR Code
      setSuccessEvent(res.data.event || res.data);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Failed to connect to the server. Please check your network and try again.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('event-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `event-qr-${successEvent._id}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      window.scrollTo(0, 0);
      return;
    }

    // Require Auth to Publish
    if (!user) {
      const draft = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step };
      localStorage.setItem('draftEvent', JSON.stringify(draft));
      setShowAuthModal(true);
      return;
    }

    const hasBankDetails = user.bankDetails && (user.bankDetails.accountName || user.bankDetails.accountNumber);
    if (!hasBankDetails) {
      setShowBankModal(true);
      return;
    }

    await publishEvent();
  };

  return (
    <div className="page-container">
      <div className="create-event-header">
        <h1>Create New Event</h1>
        <p>{step === 1 ? 'Choose an event template to get started.' : 'Fill out the details to publish your event.'}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {step === 1 && (
        <section className="form-section template-step">
          <h2>Select Event Type</h2>
          <p className="help-text" style={{ marginBottom: '1.5rem' }}>Different event types have built-in smart defaults for ticketing and gate scanning.</p>
          
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
              <div className="template-desc">Manually configure your own custom entry rules.</div>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="create-event-form" noValidate>
          <div className="step-2-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setStep(1)} 
              style={{ marginRight: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            >
              ← Back to Templates
            </button>
            <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{eventTemplate} Details</h2>
          </div>

          {eventTemplate === 'custom' && (
            <div className="form-group" style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label htmlFor="entryPolicy" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', display: 'block' }}>Custom Entry Policy</label>
              <select 
                id="entryPolicy" 
                value={entryPolicy} 
                onChange={(e) => setEntryPolicy(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
              >
                <option value="single">Strict Single Entry (One-time scan only)</option>
                <option value="multiple">Multiple Entry (In-and-out allowed all day)</option>
              </select>
            </div>
          )}

          <section className="form-section">
            <h2>Event Details</h2>
            <div className="form-group">
              <label htmlFor="title">Event Title</label>
              <input type="text" id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Summer Music Festival" required />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="4" value={form.description} onChange={handleChange} placeholder="What is this event about?" required />
            </div>
            <div className="form-group">
              <label htmlFor="category">Event Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} required className="w-full form-control">
                <option value="General">General</option>
                <option value="Tech">Tech</option>
                <option value="Sports">Sports</option>
                <option value="Music">Music</option>
                <option value="Food">Food</option>
              </select>
            </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Start Date</label>
                  <div style={{ position: 'relative' }}>
                    <input type="date" id="date" name="date" value={form.date} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required style={{ width: '100%', paddingRight: '2.5rem' }} />
                    <span className="pointer-events-none" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        style={{ width: '20px', height: '20px', color: '#9ca3af' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="time">Start Time</label>
                  <div style={{ position: 'relative' }}>
                    <input type="time" id="time" name="time" value={form.time} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required style={{ width: '100%', paddingRight: '2.5rem' }} />
                    <span className="pointer-events-none" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        style={{ width: '20px', height: '20px', color: '#9ca3af' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <div style={{ position: 'relative' }}>
                    <input type="date" id="endDate" name="endDate" value={form.endDate} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required style={{ width: '100%', paddingRight: '2.5rem' }} />
                    <span className="pointer-events-none" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        style={{ width: '20px', height: '20px', color: '#9ca3af' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <div style={{ position: 'relative' }}>
                    <input type="time" id="endTime" name="endTime" value={form.endTime} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required style={{ width: '100%', paddingRight: '2.5rem' }} />
                    <span className="pointer-events-none" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        style={{ width: '20px', height: '20px', color: '#9ca3af' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </span>
                  </div>
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
              <div className={`upload-dropzone ${uploadStatus}`}>
                <input type="file" id="image" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="visually-hidden" />
                
                {uploadStatus === 'idle' && (
                  <label htmlFor="image" className="upload-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="upload-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.75 3.75 0 0118 19.5H6.75z" />
                    </svg>
                    <span><strong>Click to upload</strong> or drag and drop</span>
                    <span className="upload-hint">Max size: 5MB. Formats: JPG, PNG, WEBP.</span>
                  </label>
                )}

                {uploadStatus === 'uploading' && (
                  <div className="upload-processing">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="spinner-icon animate-spin">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Uploading image...</span>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="upload-success">
                    <div className="success-header">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="check-icon">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Image uploaded successfully!</span>
                    </div>
                    <div className="image-preview-container">
                      {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview-thumb" />}
                      <button type="button" onClick={handleResetImage} className="btn btn-outline btn-sm">Change Image</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Ticket Types</h2>
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
                      <input list={`ticketNames-${index}`} value={ticket.name} onChange={(e) => handleTicketChange(index, 'name', e.target.value)} placeholder="e.g. VIP, General Admission" required />
                      <datalist id={`ticketNames-${index}`}>
                        <option value="Regular" />
                        <option value="VIP" />
                        <option value="VVIP" />
                        <option value="Early Bird" />
                        <option value="Student Pass" />
                        <option value="Backstage Pass" />
                      </datalist>
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

            <div className="form-group" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="requireAttendeePhoto"
                checked={requireAttendeePhoto} 
                onChange={(e) => setRequireAttendeePhoto(e.target.checked)} 
                style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
              />
              <label htmlFor="requireAttendeePhoto" style={{ fontSize: '0.9rem', color: '#475569', cursor: 'pointer', fontWeight: 500, margin: 0 }}>
                Require attendee photo upload for this event
              </label>
            </div>
          </section>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Publishing Event...' : 'Publish Event'}
            </button>
          </div>
        </form>
      )}

      {/* Auth Modal for Unauthenticated Users */}
      {showAuthModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <h3>You are almost there!</h3>
            <p>Please log in or sign up to publish your event. Your progress has been automatically saved.</p>
            <div className="auth-modal-actions">
              <button 
                className="btn btn-outline" 
                onClick={() => navigate('/login', { state: { from: { pathname: '/events/create' } } })}
              >
                Log In
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/register', { state: { from: { pathname: '/events/create' } } })}
              >
                Sign Up
              </button>
            </div>
            <button className="btn-close-modal" onClick={() => setShowAuthModal(false)}>
              Keep editing
            </button>
          </div>
        </div>
      )}

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal" style={{ maxWidth: '500px' }}>
            <h3>Payout Details Required</h3>
            <p>You need to provide bank details so we can process your ticket sales payouts.</p>
            <form onSubmit={handleSaveBankDetails}>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input type="text" value={bankForm.accountName} onChange={(e) => setBankForm({...bankForm, accountName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input type="text" value={bankForm.accountNumber} onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" value={bankForm.ifscCode} onChange={(e) => setBankForm({...bankForm, ifscCode: e.target.value})} required />
              </div>
              <div className="auth-modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBankModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save & Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success QR Modal */}
      {successEvent && (
        <div className="auth-modal-overlay">
          <div className="auth-modal" style={{ textAlign: 'center', maxWidth: '450px' }}>
            <h2 style={{ color: '#047857', marginBottom: '0.5rem' }}>🎉 Event Created!</h2>
            <p>Your event has been published successfully.</p>
            
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', margin: '1.5rem 0' }}>
              <QRCodeSVG 
                id="event-qr-code"
                value={`${window.location.origin}/events/${successEvent._id}`} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Scan this QR code to view and book tickets. Share it on WhatsApp, Instagram, or print it!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-full" onClick={handleDownloadQR}>
                ⬇️ Download QR Code
              </button>
              <button className="btn btn-outline btn-full" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEventPage;
