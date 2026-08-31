import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          🎟️ EasyTicket
        </Link>

        {/* Hamburger Icon for Mobile */}
        <button className="mobile-menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          {user ? (
            <>
              <div className="navbar-user-info">
                <span className="navbar-greeting">Hi, {user.name.split(' ')[0]}</span>
                <span className="navbar-role">{user.role}</span>
              </div>
              
              {user.role === 'customer' && (
                <Link to="/my-tickets" className="nav-link" onClick={closeMenu}>My Tickets</Link>
              )}
              
              {user.role === 'organizer' && (
                <>
                  <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>
                  <Link to="/events/create" className="nav-link" onClick={closeMenu}>Create Event</Link>
                  <Link to="/verify-ticket" className="nav-link" onClick={closeMenu}>Scan Tickets</Link>
                </>
              )}
              
              <button className="btn btn-outline" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="btn btn-primary" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
