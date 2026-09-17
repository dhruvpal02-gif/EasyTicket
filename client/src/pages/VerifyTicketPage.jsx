import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2 } from 'lucide-react';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const VerifyTicketPage = () => {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'manual'
  
  // States
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualId, setManualId] = useState('');
  
  // Lightbox
  const [lightboxImage, setLightboxImage] = useState(null);

  let html5QrCode = null;

  useEffect(() => {
    if (activeTab === 'scan' && !result && !error) {
      setScannerActive(true);
    } else {
      setScannerActive(false);
    }
  }, [activeTab, result, error]);

  useEffect(() => {
    if (scannerActive) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive]);

  const startScanner = () => {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("qr-reader");
    }
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => handleScan(decodedText),
      (errorMessage) => { /* ignore */ }
    ).catch(err => {
      console.error("Camera error:", err);
      setError("Camera permission denied or unavailable. Cannot scan QR.");
    });
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().catch(console.error);
    }
  };

  const handleScan = (text) => {
    stopScanner();
    setScannerActive(false);
    try {
      const data = JSON.parse(text);
      if (!data.t || !data.v) throw new Error('Invalid QR payload');
      verifyBackendScan(data.t, data.v);
    } catch (err) {
      setError('Invalid QR format. This is not an EasyTicket QR code.');
    }
  };

  const verifyBackendScan = async (ticketId, qrToken) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.post('/api/tickets/verify', { ticketId, qrToken });
      setResult(data);
    } catch (err) {
      setError(err.response?.data || { message: 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const verifyBackendManual = async (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.get(`/api/tickets/track/${manualId.trim()}`);
      setResult({
        valid: data.status === 'confirmed',
        entryPolicy: 'manual-check',
        ticket: data
      });
    } catch (err) {
      setError({ message: err.response?.data?.message || 'Invalid Ticket' });
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setResult(null);
    setError(null);
    setManualId('');
    if (activeTab === 'scan') setScannerActive(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Scan & Verify</h2>

        {/* Tab Toggle */}
        {!result && !error && !loading && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all cursor-pointer ${activeTab === 'scan' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Scan QR
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all cursor-pointer ${activeTab === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Manual Entry
            </button>
          </div>
        )}

        {/* Loading */}
        {!result && !error && loading && (
          <div className="text-center py-12 flex flex-col items-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" /><span className="font-bold text-indigo-600 animate-pulse">Verifying ticket...</span></div>
        )}

        {/* Scanner UI */}
        {activeTab === 'scan' && scannerActive && !loading && !result && !error && (
          <div className="flex flex-col items-center">
            <div id="qr-reader" className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-indigo-100 shadow-inner"></div>
            <p className="mt-4 text-xs text-gray-500 text-center">Point your camera at the digital ticket QR code.</p>
          </div>
        )}

        {/* Manual Input UI */}
        {activeTab === 'manual' && !loading && !result && !error && (
          <form onSubmit={verifyBackendManual} className="space-y-4">
            <div>
              <label htmlFor="manualId" className="block text-sm font-medium text-gray-700 mb-1">Booking ID or Track ID</label>
              <input
                id="manualId"
                type="text"
                required
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. TRK-A1B2C3D4"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition cursor-pointer">
              Verify Ticket
            </button>
          </form>
        )}

        {/* Success UI */}
        {result && (
          <div className={`p-6 rounded-2xl relative overflow-hidden ${result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
              {result.valid ? '? Ticket Valid' : '? Invalid / Unpaid'}
            </h3>
            
            <div className="space-y-4">
              {result.ticket?.attendeePhoto && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={getImageUrl(result.ticket.attendeePhoto)} 
                    alt="Attendee" 
                    className="w-24 h-24 object-cover rounded-xl shadow-md border border-gray-200 cursor-pointer hover:opacity-80 transition"
                    onClick={() => setLightboxImage(getImageUrl(result.ticket.attendeePhoto))}
                  />
                </div>
              )}
              
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase">Event</span>
                <span className="block text-sm font-semibold text-gray-900">{result.ticket?.event?.title}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">Visitor Name</span>
                  <span className="block text-sm font-semibold text-gray-900">{result.ticket?.attendeeName}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">Ticket Type</span>
                  <span className="block text-sm font-semibold text-gray-900">{result.ticket?.ticketTypeName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">Quantity</span>
                  <span className="block text-sm font-semibold text-gray-900">{result.ticket?.quantity} PAX</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">Booking ID</span>
                  <span className="block text-sm font-semibold text-gray-900 truncate">{result.ticket?.ticketId}</span>
                </div>
              </div>
              
              {result.entryPolicy === 'multiple' && (
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">Scan Count</span>
                  <span className="block text-sm font-semibold text-gray-900">{result.scanCount}</span>
                </div>
              )}
            </div>

            <button onClick={resetState} className={`mt-6 w-full font-bold py-3 rounded-xl transition cursor-pointer ${result.valid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
              Check Another
            </button>
          </div>
        )}

        {/* Error UI (From Scanner/Manual Failures) */}
        {error && !loading && (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center">
            <h3 className="text-xl font-bold text-red-800 mb-2">? Invalid Ticket</h3>
            <p className="text-red-600 font-medium mb-6">
              {error.error || error.message || 'Verification failed.'}
            </p>
            {error.scannedAt && (
              <p className="text-sm text-red-700 mb-4 font-bold">
                Already Scanned: {fmtDate(error.scannedAt)} {new Date(error.scannedAt).toLocaleTimeString('en-IN')}
              </p>
            )}
            <button onClick={resetState} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer">
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-md w-full animate-in zoom-in duration-200">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none cursor-pointer"
              onClick={() => setLightboxImage(null)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <img 
              src={lightboxImage} 
              alt="Enlarged Attendee" 
              className="w-full h-auto object-cover rounded-2xl shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyTicketPage;
