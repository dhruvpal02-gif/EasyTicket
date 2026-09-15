import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import './VerifyTicketPage.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const VerifyTicketPage = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  let html5QrCode = null;

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
      (decodedText) => {
        handleScan(decodedText);
      },
      (errorMessage) => {
        // Just ignore scan failures until a valid code is found
      }
    ).catch(err => {
      console.error("Camera start error:", err);
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
      if (!data.t || !data.v) {
        throw new Error('Invalid QR payload');
      }
      verifyBackend(data.t, data.v);
    } catch (err) {
      setError('Invalid QR format. This is not an EasyTicket QR code.');
    }
  };

  const verifyBackend = async (ticketId, qrToken) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await api.post('/api/tickets/verify', { ticketId, qrToken });
      setResult(data);
    } catch (err) {
      setError(err.response?.data || { message: 'Verification failed due to server error.' });
    } finally {
      setLoading(false);
    }
  };

  const scanAgain = () => {
    setResult(null);
    setError(null);
    setScannerActive(true);
  };

  return (
    <div className="page-container verify-container">
      <div className="verify-header">
        <h1>Verify Tickets</h1>
        <p>Scan a customer&apos;s digital ticket QR code</p>
      </div>

      {!result && !error && loading && (
        <div className="verify-status">Verifying with server...</div>
      )}

      {/* Result UI - Success */}
      {result && (
        <div className={`verify-card ${result.entryPolicy === 'single' ? 'bg-green' : 'bg-blue'}`}>
          <div className="verify-icon">✓</div>
          <h2 className="text-white">
            {result.entryPolicy === 'single' ? 'VALID: SINGLE ENTRY' : 'VALID: MULTIPLE ENTRY (PASS)'}
          </h2>
          <div className="verify-details">
            {result.ticket?.attendeePhoto && (
              <div className="attendee-photo-container">
                <img src={getImageUrl(result.ticket.attendeePhoto)} alt="Attendee" className="attendee-photo" />
              </div>
            )}
            <div className="v-row"><span>Attendee Name:</span> <strong>{result.ticket?.attendeeName}</strong></div>
            <div className="v-row"><span>Ticket Type:</span> <strong>{result.ticket?.ticketTypeName} (Qty: {result.ticket?.quantity})</strong></div>
            {result.entryPolicy === 'multiple' && (
              <div className="v-row"><span>Scan Count:</span> <strong>{result.scanCount}</strong></div>
            )}
            <div className="v-row"><span>Event:</span> <strong>{result.ticket?.event?.title}</strong></div>
            <div className="v-row"><span>Ticket ID:</span> <strong>{result.ticket?.ticketId}</strong></div>
          </div>
          <button className="btn btn-full btn-scan-next" onClick={scanAgain}>Scan Next Ticket</button>
        </div>
      )}

      {/* Result UI - Error */}
      {error && !loading && (
        <div className="verify-card bg-red">
          <div className="verify-icon">✗</div>
          <h2 className="text-white">
            {error.error === 'Ticket Already Used' ? '🚨 TICKET ALREADY USED' : 'INVALID TICKET'}
          </h2>
          <div className="verify-details error-details">
            <p className="verify-error-msg">{error.error || error.message || 'Verification failed.'}</p>
            {error.scannedAt && (
              <div className="v-row">
                <span>First Scanned At:</span>
                <strong>{fmtDate(error.scannedAt)} {new Date(error.scannedAt).toLocaleTimeString('en-IN')}</strong>
              </div>
            )}
          </div>
          <button className="btn btn-full btn-scan-next" onClick={scanAgain}>Scan Next Ticket</button>
        </div>
      )}

      {/* Scanner UI */}
      {scannerActive && !loading && !result && !error && (
        <div className="scanner-section">
          <div id="qr-reader" className="qr-reader-container"></div>
          <p className="help-text text-center mt-1">Please grant camera permissions.</p>
        </div>
      )}
    </div>
  );
};

export default VerifyTicketPage;
