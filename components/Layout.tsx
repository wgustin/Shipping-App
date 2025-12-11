import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate(user ? 'dashboard' : 'landing')}>
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-2">
                S
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">ShipEasy</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <nav className="hidden md:flex space-x-6 mr-6">
                    <button 
                        onClick={() => onNavigate('dashboard')}
                        className={`text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Dashboard
                    </button>
                    <button 
                         onClick={() => onNavigate('addresses')}
                        className={`text-sm font-medium transition-colors ${currentPage === 'addresses' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Address Book
                    </button>
                    <button 
                         onClick={() => onNavigate('history')}
                        className={`text-sm font-medium transition-colors ${currentPage === 'history' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      History
                    </button>
                  </nav>
                  <div className="flex items-center border-l pl-6 border-slate-200">
                    <div className="hidden sm:block text-right pr-4 border-r border-slate-200">
                        <p className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="text-sm text-slate-500 hover:text-red-600 font-medium ml-4"
                    >
                        Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-3">
                  <button onClick={() => onNavigate('login')} className="text-slate-600 hover:text-slate-900 font-medium text-sm">Log in</button>
                  <button onClick={() => onNavigate('signup')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">Sign up</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} ShipEasy Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};