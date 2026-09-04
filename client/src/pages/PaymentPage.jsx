import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './PaymentPage.css';

const PaymentPage = () => {
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('guestToken');
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const headers = guestToken ? { 'X-Guest-Token': guestToken } : {};
        const { data } = await api.get(`/api/tickets/${ticketId}`, { headers });
        if (data.paymentStatus === 'paid') {
          // Already paid, redirect to ticket details
          navigate(`/tickets/${data._id}${guestToken ? `?guestToken=${guestToken}` : ''}`, { replace: true });
          return;
        }
        setTicket(data);
      } catch (err) {
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId, guestToken]);

  // Helper to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setError('');
    
    const res = await loadRazorpayScript();
    if (!res) {
      setError('Razorpay SDK failed to load. Are you offline?');
      setProcessing(false);
      return;
    }

    try {
      const headers = guestToken ? { 'X-Guest-Token': guestToken } : {};
      
      // 1. Create order on backend
      const { data: orderData } = await api.post(`/api/tickets/${ticketId}/create-razorpay-order`, {}, { headers });
      
      // 2. Open Razorpay widget
      const options = {
        key: 'rzp_test_YourMockKey', // Usually passed from backend, but Razorpay SDK works with any test key id here if it's mock
        // Ideally we fetch this from environment but for testing UI we can use a string or process.env.VITE_RAZORPAY_KEY_ID
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'EasyTicket',
        description: `Payment for ${ticket.event.title}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            setProcessing(true);
            // 3. Verify payment on backend
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };
            const { data: verifyData } = await api.post(`/api/tickets/${ticketId}/verify-payment`, verifyPayload, { headers });
            
            // Navigate directly to the ticket details
            navigate(`/tickets/${verifyData.ticket._id}${guestToken ? `?guestToken=${guestToken}` : ''}`);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed.');
            setProcessing(false);
          }
        },
        prefill: {
          name: ticket.attendeeName,
          email: ticket.customer?.email || 'guest@example.com',
          contact: ''
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', async (response) => {
        setError(`Payment Failed: ${response.error.description}`);
        try {
          await api.post(`/api/tickets/${ticketId}/fail`, {}, { headers });
          setTicket({ ...ticket, paymentStatus: 'failed' });
        } catch(e) {
          console.error(e);
        }
        setProcessing(false);
      });

      rzp.open();
      // Keep processing true while modal is open to prevent duplicate clicks

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize payment.');
      setProcessing(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading payment...</p></div>;
  if (!ticket) return <div className="page-container"><div className="alert alert-error">{error || 'Ticket not found.'}</div></div>;

  return (
    <div className="page-container payment-container">
      <div className="payment-header">
        <h1>Complete Payment</h1>
        <p>Proceed to securely pay for your ticket using Razorpay.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      
      {ticket.paymentStatus === 'failed' && !error && (
        <div className="alert alert-error">Your last payment attempt failed. Please try again.</div>
      )}

      <div className="payment-layout">
        <div className="payment-form-wrap">
          <div className="payment-sim-actions">
            <button 
              type="button" 
              className="btn btn-primary btn-full" 
              onClick={handleRazorpayPayment}
              disabled={processing || ticket.paymentStatus === 'paid'}
            >
              {processing ? 'Processing...' : `Pay Now (₹${ticket.totalAmount})`}
            </button>
          </div>
        </div>

        <div className="payment-summary">
          <h2>Order Details</h2>
          <div className="summary-event">
            <h3>{ticket.event.title}</h3>
            <p>Ticket: {ticket.ticketTypeName} (x{ticket.quantity})</p>
          </div>
          <div className="summary-total">
            <span>Amount to Pay</span>
            <span>₹{ticket.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
