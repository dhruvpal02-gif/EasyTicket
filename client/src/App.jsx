import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetailPage from './pages/EventDetailPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEventPage from './pages/CreateEventPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import MyTicketsPage from './pages/MyTicketsPage';
import TicketDetailsPage from './pages/TicketDetailsPage';
import VerifyTicketPage from './pages/VerifyTicketPage';
import TrackTicketPage from './pages/TrackTicketPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<TrackTicketPage />} />
        
        {/* Home page is public now to browse events */}
        <Route path="/" element={user ? <Navigate to="/events/create" replace /> : <HomePage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        {/* Guest OR Customer routes (handled within component) */}
        <Route path="/book/:eventId" element={<BookingPage />} />
        <Route path="/payment/:ticketId" element={<PaymentPage />} />
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />

        {/* Protected routes (require login) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <OrganizerDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/events/create" element={<CreateEventPage />} />
        <Route
          path="/my-tickets"
          element={
            <PrivateRoute>
              <MyTicketsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/verify-ticket"
          element={
            <PrivateRoute>
              <VerifyTicketPage />
            </PrivateRoute>
          }
        />
        {/* Placeholder for EditEventPage, routing back to dashboard for now */}
        <Route
          path="/events/edit/:id"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
