import { useState } from 'react';
import api from '../services/api';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const TrackTicketPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    
    setLoading(true);
    setError('');
    setTicketData(null);

    try {
      const { data } = await api.get(`/api/tickets/track/${identifier.trim()}`);
      setTicketData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Ticket ❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans py-12 px-4 flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Verify Ticket</h2>
          <p className="mt-2 text-sm text-gray-500">Enter your Booking ID or Track ID to check the validity of a ticket.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="sr-only">Booking ID or Track ID</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              placeholder="e.g. TRK-A1B2C3D4"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify Ticket'}
          </button>
        </form>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <span className="text-red-600 font-bold text-lg">{error}</span>
          </div>
        )}

        {ticketData && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 relative overflow-hidden">
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Ticket Verified ✅
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="block text-xs font-bold text-green-600 uppercase tracking-wide">Event</span>
                <span className="block text-sm font-semibold text-gray-900">{ticketData.event.title}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-green-600 uppercase tracking-wide">Date</span>
                  <span className="block text-sm font-semibold text-gray-900">{fmtDate(ticketData.event.date)}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-green-600 uppercase tracking-wide">Time</span>
                  <span className="block text-sm font-semibold text-gray-900">{ticketData.event.time}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-green-200">
                <span className="block text-xs font-bold text-green-600 uppercase tracking-wide">Visitor</span>
                <span className="block text-sm font-semibold text-gray-900">{ticketData.attendeeName} ({ticketData.quantity} Ticket{ticketData.quantity > 1 ? 's' : ''})</span>
              </div>

              <div>
                <span className="block text-xs font-bold text-green-600 uppercase tracking-wide">Status</span>
                <span className={`inline-block px-2 py-1 mt-1 rounded text-xs font-bold ${ticketData.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {ticketData.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackTicketPage;
