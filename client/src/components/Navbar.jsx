import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
    setShowLogoutModal(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
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
                  <NavLink to="/my-tickets" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>My Tickets</NavLink>
                )}
                
                {user.role === 'organizer' && (
                  <>
                    <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Dashboard</NavLink>
                    <NavLink to="/events/create" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Create Event</NavLink>
                    <NavLink to="/verify-ticket" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Scan Tickets</NavLink>
                  </>
                )}
                
                <button className="btn btn-outline" onClick={() => setShowLogoutModal(true)}>
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3>Are you sure you want to log out?</h3>
            <div className="logout-modal-actions">
              <button className="btn btn-primary" onClick={() => setShowLogoutModal(false)}>
                No, Keep me logged in
              </button>
              <button className="logout-btn-secondary" onClick={confirmLogout}>
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
