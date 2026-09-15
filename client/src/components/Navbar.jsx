import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  QrCode, 
  ShieldCheck, 
  Plus, 
  LogOut, 
  Ticket,
  Menu,
  X
} from 'lucide-react';

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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
      isActive 
        ? 'text-indigo-600 bg-indigo-50' 
        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors rounded-lg ${
      isActive 
        ? 'text-indigo-600 bg-indigo-50' 
        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
    }`;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Left side: Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-pink-600" onClick={closeMenu}>
                <span>🎫</span>
                <span>EasyTicket</span>
              </Link>
            </div>

            {/* Middle & Right side (Desktop) */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              
              {user ? (
                <>
                  {/* Common / Shared Links */}
                  <div className="flex items-center space-x-1 mr-4 border-r border-gray-200 pr-4">
                    {user.role === 'customer' && (
                      <NavLink to="/my-tickets" className={navLinkClass}>
                        <Ticket className="w-4 h-4" />
                        <span>My Tickets</span>
                      </NavLink>
                    )}
                    
                    {user.role === 'organizer' && (
                      <>
                        <NavLink to="/dashboard" className={navLinkClass}>
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/verify-ticket" className={navLinkClass}>
                          <QrCode className="w-4 h-4" />
                          <span>Scan & Verify</span>
                        </NavLink>
                      </>
                    )}
                  </div>

                  {/* Primary CTA */}
                  {user.role === 'organizer' && (
                    <Link 
                      to="/events/create" 
                      className="flex items-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Event</span>
                    </Link>
                  )}

                  {/* User Profile & Logout */}
                  <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-900 leading-none">{user.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mt-1">{user.role}</span>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <button 
                      onClick={() => setShowLogoutModal(true)}
                      className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none cursor-pointer"
                      title="Log out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium px-4 py-2 transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="bg-indigo-600 text-white font-medium px-5 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-all">
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button 
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg absolute w-full left-0">
            <div className="px-4 pt-2 pb-6 space-y-1">
              
              {user ? (
                <>
                  {/* Mobile Profile Banner */}
                  <div className="flex items-center gap-3 px-4 py-4 mb-2 border-b border-gray-100">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-gray-900 leading-none">{user.name}</span>
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-1">{user.role}</span>
                    </div>
                  </div>

                  {user.role === 'organizer' && (
                    <Link 
                      to="/events/create" 
                      onClick={closeMenu}
                      className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-medium px-4 py-3 rounded-xl shadow-sm hover:bg-indigo-700 transition-all mb-4 mt-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Event</span>
                    </Link>
                  )}

                  {user.role === 'customer' && (
                    <NavLink to="/my-tickets" className={mobileNavLinkClass} onClick={closeMenu}>
                      <Ticket className="w-5 h-5" />
                      <span>My Tickets</span>
                    </NavLink>
                  )}
                  
                  {user.role === 'organizer' && (
                    <>
                      <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={closeMenu}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                      </NavLink>
                      <NavLink to="/verify-ticket" className={mobileNavLinkClass} onClick={closeMenu}>
                        <QrCode className="w-5 h-5" />
                        <span>Scan & Verify</span>
                      </NavLink>
                    </>
                  )}

                  <button 
                    onClick={() => { setShowLogoutModal(true); closeMenu(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 mt-4 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3 px-2">
                    <Link to="/login" className="flex justify-center text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium px-4 py-3 rounded-lg transition-colors" onClick={closeMenu}>
                      Login
                    </Link>
                    <Link to="/register" className="flex justify-center bg-indigo-600 text-white font-medium px-4 py-3 rounded-lg shadow-sm hover:bg-indigo-700 transition-all" onClick={closeMenu}>
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal (Tailwind styled) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to leave?</h3>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to log out of your account?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
                  onClick={confirmLogout}
                >
                  Yes, Log out
                </button>
                <button 
                  className="w-full bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors focus:outline-none cursor-pointer" 
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
