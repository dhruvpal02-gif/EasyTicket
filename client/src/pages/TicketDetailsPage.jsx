import PageLoader from '../components/PageLoader';
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#f9fafb' 
      });

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

  if (loading) return <PageLoader text="Loading ticket..." />;
  if (error || !ticket) return <div className="p-8 text-center text-red-500 font-sans">{error || 'Ticket not found.'}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-28">
      {/* 1. Page Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <p className="text-sm text-gray-500 mb-1">Thank you for choosing EasyTicket!</p>
        <h1 className="text-2xl font-bold text-black">Enjoy your event</h1>
      </div>

      <div className="max-w-md w-full mx-auto px-4" ref={ticketRef}>
        
        {/* 2. Main Ticket Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden relative">
          
          {/* Top Section (Event Info) */}
          <div className="flex p-4 gap-4">
            <div className="flex-shrink-0">
              <img 
                src={ticket.event.image ? getImageUrl(ticket.event.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.event.title)}&background=f3f4f6&color=4f46e5`} 
                alt={ticket.event.title} 
                className="h-32 w-24 rounded-lg object-cover bg-gray-100 shadow-sm"
                crossOrigin="anonymous" 
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="font-bold text-lg text-gray-900 leading-tight">{ticket.event.title}</h2>
              <span className="inline-block mt-1 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded w-max">
                {ticket.ticketTypeName}
              </span>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-snug">
                <span className="block font-medium text-gray-800">{ticket.event.venue}</span>
                {ticket.event.city}
              </p>
            </div>
          </div>

          {/* Left/Right Notches */}
          <div className="absolute w-6 h-6 bg-gray-50 rounded-full -left-3 top-[10.5rem] border-r border-gray-200"></div>
          <div className="absolute w-6 h-6 bg-gray-50 rounded-full -right-3 top-[10.5rem] border-l border-gray-200"></div>
          
          <hr className="border-t border-dashed border-gray-300 mx-4" />

          {/* Middle Section (Visitor ID & Timing) */}
          <div className="flex justify-between items-center p-5">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Date & Time</span>
              <span className="text-gray-900 font-bold mt-1 text-sm">{fmtDate(ticket.event.date)}</span>
              <span className="text-gray-900 font-bold text-sm mb-3">{ticket.event.time}</span>
              
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">PAX</span>
              <span className="text-gray-900 font-bold mt-1 text-sm">{ticket.quantity} Member{ticket.quantity > 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Visitor</span>
              <img 
                src={ticket.attendeePhoto ? getImageUrl(ticket.attendeePhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.attendeeName)}&background=f3f4f6&color=4f46e5`} 
                alt={ticket.attendeeName} 
                className="rounded-lg h-24 w-24 object-cover border border-gray-200 shadow-sm bg-gray-50"
                crossOrigin="anonymous" 
              />
              <span className="text-sm font-semibold text-gray-800 mt-2 text-center w-28 truncate">{ticket.attendeeName}</span>
            </div>
          </div>

          {/* Left/Right Notches */}
          <div className="absolute w-6 h-6 bg-gray-50 rounded-full -left-3 bottom-[5.5rem] border-r border-gray-200"></div>
          <div className="absolute w-6 h-6 bg-gray-50 rounded-full -right-3 bottom-[5.5rem] border-l border-gray-200"></div>

          <hr className="border-t border-dashed border-gray-300 mx-4" />

          {/* Bottom Section (QR & Tracking) */}
          <div className="flex justify-between items-center p-4 bg-gray-50/50">
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">Booking ID</span>
                <span className="font-mono text-gray-900 font-bold text-sm">{ticket.ticketId}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">Track ID</span>
                <span className="font-mono text-gray-900 font-bold text-sm">TRK-{ticket._id.substring(0, 8).toUpperCase()}</span>
              </div>
            </div>
            
            {ticket.status === 'confirmed' && ticket.qrCodeDataUri ? (
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                <img src={ticket.qrCodeDataUri} alt="QR Code" className="h-16 w-16 object-contain mix-blend-multiply" />
              </div>
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-[10px] text-gray-400 text-center uppercase font-bold">No QR<br/>(Pending)</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Billing Details Card */}
        <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-xl font-bold text-gray-900">₹{ticket.totalAmount}</span>
          </div>
          {ticket.status === 'confirmed' ? (
            <p className="text-green-600 text-sm font-semibold mb-4 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Payment Successful
            </p>
          ) : (
            <p className="text-red-500 text-sm font-semibold mb-4 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Payment {ticket.paymentStatus}
            </p>
          )}

          <hr className="border-t border-gray-100 mb-3" />

          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Net Ticket Price</span>
            <span className="font-medium text-gray-800">₹{ticket.totalAmount}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-3">
            <span>Convenience Fee / Taxes</span>
            <span className="font-medium text-gray-800">₹0.00</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
            <span>Total Ticket Price</span>
            <span>₹{ticket.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 mx-auto w-full">
        <Link 
          to={guestToken ? "/" : "/my-tickets"} 
          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl text-center transition-colors flex items-center justify-center text-sm uppercase tracking-wide"
        >
          Back to Home
        </Link>
        
        {ticket.status === 'confirmed' && (
          <>
            <button 
              onClick={() => {
                const ticketUrl = window.location.href;
                window.open(`https://wa.me/91${ticket.attendeePhone}?text=Here%20is%20your%20ticket%20link:%20${encodeURIComponent(ticketUrl)}`, '_blank');
              }}
              className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0"
              title="Share on WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button 
              onClick={handleDownloadTicket}
              disabled={downloading}
              className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0"
              title="Download Ticket"
            >
              {downloading ? (
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketDetailsPage;
