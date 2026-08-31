import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Home page is public now to browse events */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        {/* Protected routes (require login) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <OrganizerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/create"
          element={
            <PrivateRoute>
              <CreateEventPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/book/:eventId"
          element={
            <PrivateRoute>
              <BookingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment/:ticketId"
          element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          }
        />
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
        <Route
          path="/tickets/:id"
          element={
            <PrivateRoute>
              <TicketDetailsPage />
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
