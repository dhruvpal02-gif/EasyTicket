import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="b2b-hero">
        <div className="b2b-hero-content">
          <h1>Create and Manage Local Events with Ease</h1>
          <p>
            The all-in-one ticketing and gate management platform for local fairs, concerts, zoos, and more. 
            Stop worrying about tech and start selling tickets today.
          </p>
          <div className="b2b-hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">Start for Free</Link>
            <Link to="/login" className="btn btn-outline btn-large">Organizer Login</Link>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="b2b-event-types">
        <h2>Supported Event Types</h2>
        <p className="section-subtitle">Tailored ticketing policies for every kind of local gathering.</p>
        
        <div className="event-type-grid">
          <div className="event-type-card">
            <div className="event-icon">🎪</div>
            <h3>Local Mela / Fair</h3>
            <p>Multiple entry policies, progressive check-ins, and bulk ticketing designed for large crowds.</p>
          </div>
          <div className="event-type-card">
            <div className="event-icon">🦁</div>
            <h3>Zoo & Museum</h3>
            <p>Timed entries and family passes. Track visitors in real-time across multiple gates.</p>
          </div>
          <div className="event-type-card">
            <div className="event-icon">🎤</div>
            <h3>Concerts</h3>
            <p>Strict single-entry policies, VIP tiers, and high-security QR validation to prevent fraud.</p>
          </div>
          <div className="event-type-card">
            <div className="event-icon">⚙️</div>
            <h3>Custom Events</h3>
            <p>Mix and match entry rules, create custom pricing tiers, and manage your own check-in flow.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
