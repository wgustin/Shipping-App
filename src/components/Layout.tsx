import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '../features/auth/context/AuthContext';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to={user ? '/dashboard' : '/'} className="flex items-center cursor-pointer">
                <img 
                  src="/poast-logo.png" 
                  alt="Poast" 
                  className="h-6 w-auto object-contain" 
                />
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user && (
                <div className="hidden sm:flex items-center space-x-4">
                  <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Log in</Link>
                  <Link to="/signup" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">Sign up</Link>
                </div>
              )}
              {user && (
                <>
                  <nav className="hidden md:flex space-x-6 mr-6">
                    <Link 
                        to="/dashboard"
                        className={`text-sm font-medium transition-colors ${currentPath === '/dashboard' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                         to="/address-book"
                        className={`text-sm font-medium transition-colors ${currentPath === '/address-book' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Address Book
                    </Link>
                    <Link 
                         to="/history"
                        className={`text-sm font-medium transition-colors ${currentPath === '/history' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      History
                    </Link>
                  </nav>
                  <div className="hidden md:flex items-center border-l pl-6 border-slate-200">
                    <div className="text-right pr-4 border-r border-slate-200">
                        <Link to="/account" className={`text-sm font-medium transition-colors ${currentPath === '/account' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}>Account</Link>
                    </div>
                    <button 
                        type="button"
                        onClick={() => {
                          logout();
                        }}
                        className="text-sm text-slate-500 hover:text-red-600 font-medium ml-4"
                    >
                        Sign out
                    </button>
                  </div>
                </>
              )}

              {/* Mobile menu button - Always visible on mobile */}
              <div className="flex md:hidden items-center">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-slate-500 hover:text-slate-900 focus:outline-none p-2"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden border-t border-slate-200 bg-white overflow-hidden"
            >
              <div className="px-4 pt-2 pb-4 space-y-2 text-left">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className={`block py-2 text-base font-medium transition-colors ${
                        currentPath === '/dashboard' ? 'text-blue-600' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/address-book"
                      className={`block py-2 text-base font-medium transition-colors ${
                        currentPath === '/address-book' ? 'text-blue-600' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      Address Book
                    </Link>
                    <Link
                      to="/history"
                      className={`block py-2 text-base font-medium transition-colors ${
                        currentPath === '/history' ? 'text-blue-600' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      History
                    </Link>
                    <div className="pt-4 pb-2 border-t border-slate-100 mt-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Account</div>
                      <Link
                        to="/account"
                        className={`block py-2 text-base font-medium transition-colors ${
                          currentPath === '/account' ? 'text-blue-600' : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        Account Settings
                      </Link>
                      <button
                        onClick={() => logout()}
                        className="block w-full text-left py-2 text-base font-medium text-slate-700 hover:text-red-600 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block py-2 text-base font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="block py-2 text-base font-bold text-teal-700 hover:text-teal-800 transition-colors"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </header>

      {/* Main Content */}
      <main className={`flex-grow w-full ${currentPath === '/' ? '' : 'max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="py-6 bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <img src="/poast-icon.png" alt="Poast" className="h-9 object-contain" />
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-slate-500 text-sm font-medium">
            <Link to="/terms" className="hover:text-teal-700">Terms</Link>
            <Link to="/privacy" className="hover:text-teal-700">Privacy</Link>
            <Link to="/contact" className="hover:text-teal-700">Contact</Link>
          </div>
          <div className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} Poast Shipping. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
