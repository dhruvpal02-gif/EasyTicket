import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './PaymentPage.css';

const PaymentPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data } = await api.get(`/api/tickets/${ticketId}`);
        if (data.paymentStatus === 'paid') {
          // Already paid
          setSuccess(true);
          setPaymentResult(data);
        }
        setTicket(data);
      } catch (err) {
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const handlePayment = async (action) => {
    setProcessing(true);
    setError('');

    try {
      if (action === 'pay') {
        const { data } = await api.post(`/api/tickets/${ticketId}/pay`, { paymentMethod });
        setSuccess(true);
        setPaymentResult(data.ticket);
      } else if (action === 'fail') {
        const { data } = await api.post(`/api/tickets/${ticketId}/fail`);
        setTicket(data.ticket);
        setError('Payment simulation failed successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment simulation error.');
    } finally {
      setProcessing(false);
      window.scrollTo(0, 0);
    }
  };

  if (loading) return <div className="page-container"><p>Loading payment...</p></div>;
  if (!ticket && !success) return <div className="page-container"><div className="alert alert-error">{error || 'Ticket not found.'}</div></div>;

  if (success && paymentResult) {
    return (
      <div className="page-container payment-success-container">
        <div className="payment-success-card">
          <div className="success-icon">✓</div>
          <h1>Payment Successful</h1>
          <p>Your booking for <strong>{paymentResult.event.title}</strong> is confirmed!</p>
          
          <div className="receipt-details">
            <div className="receipt-row">
              <span>Payment ID</span>
              <span className="receipt-val">{paymentResult.paymentId}</span>
            </div>
            <div className="receipt-row">
              <span>Ticket ID</span>
              <span className="receipt-val">{paymentResult.ticketId}</span>
            </div>
            <div className="receipt-row">
              <span>Amount Paid</span>
              <span className="receipt-val receipt-total">₹{paymentResult.totalAmount}</span>
            </div>
          </div>

          <div className="success-actions">
            <Link to={`/tickets/${paymentResult._id}`} className="btn btn-primary">View Ticket</Link>
            <Link to="/my-tickets" className="btn btn-outline">My Tickets</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container payment-container">
      <div className="payment-header">
        <h1>Complete Payment</h1>
        <p>Demo Payment — No real money will be charged.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      
      {ticket.paymentStatus === 'failed' && !error && (
        <div className="alert alert-error">Your last payment attempt failed. Please try again.</div>
      )}

      <div className="payment-layout">
        <div className="payment-form-wrap">
          <div className="payment-methods">
            <button 
              type="button" 
              className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              Credit / Debit Card
            </button>
            <button 
              type="button" 
              className={`method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('upi')}
            >
              UPI
            </button>
            <button 
              type="button" 
              className={`method-btn ${paymentMethod === 'netbanking' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('netbanking')}
            >
              Net Banking
            </button>
          </div>

          <div className="payment-mock-ui">
            {paymentMethod === 'card' && (
              <div className="mock-card-form">
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input type="text" placeholder="John Doe" defaultValue="Demo User" />
                </div>
                <div className="form-group">
                  <label>Card Number</label>
                  <input type="text" placeholder="0000 0000 0000 0000" defaultValue="4111 1111 1111 1111" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM/YY" defaultValue="12/28" />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input type="text" placeholder="123" defaultValue="123" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div className="mock-upi-form">
                <div className="form-group">
                  <label>UPI ID</label>
                  <input type="text" placeholder="example@upi" defaultValue="demo@ybl" />
                </div>
                <p className="help-text">A payment request will be simulated.</p>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div className="mock-bank-form">
                <div className="form-group">
                  <label>Select Bank</label>
                  <select defaultValue="sbi">
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="payment-sim-actions">
            <button 
              type="button" 
              className="btn btn-primary btn-full" 
              onClick={() => handlePayment('pay')}
              disabled={processing || ticket.paymentStatus === 'paid'}
            >
              {processing ? 'Processing...' : `Simulate Successful Payment (₹${ticket.totalAmount})`}
            </button>
            <button 
              type="button" 
              className="btn btn-outline btn-full" 
              onClick={() => handlePayment('fail')}
              disabled={processing || ticket.paymentStatus === 'paid'}
              style={{ marginTop: '1rem', borderColor: '#fecaca', color: '#b91c1c' }}
            >
              Simulate Failed Payment
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
