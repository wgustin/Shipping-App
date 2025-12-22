
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateShipment } from './pages/CreateShipment';
import { AddressBook } from './pages/AddressBook';
import { User, Shipment, Address } from './types';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Card } from './components/ui/Card';
import { getSupabase } from './services/supabaseClient';
import { fetchShipmentHistory, fetchSavedAddresses, saveAddressToBook } from './services/mockApiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [lastShipment, setLastShipment] = useState<Shipment | null>(null);
  const [initialShipmentAddress, setInitialShipmentAddress] = useState<Address | null>(null);

  // Form states for login/signup
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      const supabase = await getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (err) {
        console.error("Session initialization error:", err);
      } finally {
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setCurrentPage('landing');
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    };

    initAuth();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const supabase = await getSupabase();
    if (!supabase) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setUser({
          id: profile.id,
          firstName: profile.first_name || 'User',
          lastName: profile.last_name || '',
          email: profile.email,
          balance: profile.balance || 0
        });
        setCurrentPage('dashboard');
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({
            id: authUser.id,
            firstName: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'New',
            lastName: authUser.user_metadata?.last_name || 'User',
            email: authUser.email || '',
            balance: 0
          });
          setCurrentPage('dashboard');
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const [history, addresses] = await Promise.all([
            fetchShipmentHistory(user.id),
            fetchSavedAddresses(user.id)
          ]);
          setShipments(history);
          setSavedAddresses(addresses);
        } catch (e) {
          console.warn("Could not load user data. Database tables may not be ready.", e);
        }
      };
      loadData();
    }
  }, [user]);

  const navigate = (page: string) => {
    setAuthError(null);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleAuth = async () => {
    const supabase = await getSupabase();
    if (!supabase) return;
    
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (currentPage === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              first_name: authEmail.split('@')[0],
              last_name: ''
            }
          }
        });
        
        if (error) throw error;

        if (data?.session) {
          setAuthError({ message: "Account created! Welcome.", type: 'success' });
          await loadUserProfile(data.session.user.id);
        } else {
          setAuthError({ message: "Account created successfully.", type: 'success' });
        }
      }
    } catch (err: any) {
      console.error("Auth process error:", err);
      setAuthError({ message: err.message || "Authentication failed.", type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = await getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    navigate('landing');
  };

  const handleShipmentComplete = (shipment: Shipment) => {
    setShipments([shipment, ...shipments]);
    setLastShipment(shipment);
    setInitialShipmentAddress(null);
    navigate('success');
  };

  const handleSaveAddress = async (addr: Address) => {
    if (user) {
      try {
        await saveAddressToBook(user.id, addr);
        const addresses = await fetchSavedAddresses(user.id);
        setSavedAddresses(addresses);
      } catch (e) {
        console.error("Failed to save address:", e);
      }
    }
  };

  const handleShipFromBook = (address: Address) => {
    setInitialShipmentAddress(address);
    navigate('create');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <div className="overflow-hidden">
             <div className="relative pt-10 pb-20 lg:pt-24 lg:pb-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 text-center lg:text-left animate-in slide-in-from-left-8 duration-700 fade-in">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-6">
                                <span className="mr-2">⚡</span> Real-time Shipping Platform
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                                Stop waiting in <br className="hidden lg:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">line forever.</span>
                            </h1>
                            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                ShipEasy provides professional shipping tools for everyone. Create labels instantly and manage your history in one cloud-synced dashboard.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Button size="lg" onClick={() => navigate('signup')} className="w-full sm:w-auto px-8 py-4 text-lg h-auto shadow-xl shadow-blue-200">
                                    Get Started
                                </Button>
                                <Button size="lg" variant="ghost" onClick={() => navigate('login')} className="w-full sm:w-auto px-8 py-4 text-lg h-auto">
                                    Sign In
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 w-full max-w-xl lg:max-w-none relative animate-in slide-in-from-right-8 duration-1000 fade-in">
                             <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform lg:rotate-2 hover:rotate-0 transition-all duration-500 group">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10 pointer-events-none"></div>
                                <img src="https://media.gettyimages.com/id/1365310330/photo/customers-waiting-in-line-at-the-ups-store.jpg?s=2048x2048&w=gi&k=20&c=6N9tV_7VzY1wY9yX9Z9X9Z9X9Z9X9Z9X9Z9X9Z9X9Z9X9Z9X9Z9X9Z9X9Z9X9Z9X9Z9" alt="Shipping line" className="w-full h-auto object-cover transform scale-105 group-hover:scale-100 transition-transform duration-700"/>
                             </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        );

      case 'login': 
      case 'signup':
        return (
             <div className="max-w-md mx-auto mt-20 animate-in fade-in zoom-in-95 duration-300">
                <Card title={currentPage === 'login' ? 'Welcome Back' : 'Create Account'}>
                    <div className="space-y-4">
                        {authError && (
                            <div className={`p-3 rounded text-sm ${authError.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {authError.message}
                            </div>
                        )}
                        <Input 
                            label="Email Address" 
                            type="email" 
                            placeholder="you@example.com" 
                            value={authEmail} 
                            onChange={(e) => setAuthEmail(e.target.value)} 
                            disabled={authLoading}
                        />
                        <Input 
                            label="Password" 
                            type="password" 
                            placeholder="Min. 6 characters" 
                            value={authPassword} 
                            onChange={(e) => setAuthPassword(e.target.value)} 
                            disabled={authLoading}
                        />
                        <Button className="w-full" onClick={handleAuth} isLoading={authLoading}>
                            {currentPage === 'login' ? 'Log In' : 'Sign Up'}
                        </Button>
                        <div className="text-center pt-2">
                            <button 
                                onClick={() => navigate(currentPage === 'login' ? 'signup' : 'login')}
                                className="text-sm text-blue-600 hover:underline"
                                disabled={authLoading}
                            >
                                {currentPage === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                            </button>
                        </div>
                    </div>
                </Card>
             </div>
        );

      case 'dashboard':
        return <Dashboard user={user!} onCreateClick={() => navigate('create')} onViewHistoryClick={() => navigate('history')} shipments={shipments} />;
      
      case 'addresses':
        return <AddressBook addresses={savedAddresses} onAddAddress={handleSaveAddress} onCreateShipment={handleShipFromBook} />;

      case 'create':
        return <CreateShipment user={user!} onComplete={handleShipmentComplete} savedAddresses={savedAddresses} onSaveAddress={handleSaveAddress} initialToAddress={initialShipmentAddress} />;
      
      case 'history':
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Shipment History</h2>
                    <Button onClick={() => navigate('create')}>New Shipment</Button>
                </div>
                {shipments.length === 0 ? (
                    <Card><div className="text-center py-12 text-slate-500">No shipments found in your records.</div></Card>
                ) : (
                    <div className="grid gap-4">
                        {shipments.map(s => (
                            <Card key={s.id} className="hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-sm font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">{s.trackingNumber}</span>
                                            <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full capitalize">{s.status}</span>
                                        </div>
                                        <div className="text-slate-900 font-medium">To: {s.toAddress.name}</div>
                                        <div className="text-sm text-slate-500">{s.toAddress.city}, {s.toAddress.state} • {new Date(s.createdDate).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden md:block">
                                            <div className="font-bold text-slate-900">${s.selectedRate.totalAmount.toFixed(2)}</div>
                                            <div className="text-xs text-slate-500">{s.selectedRate.carrier}</div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => window.open(s.labelUrl, '_blank')}>Reprint Label</Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );

      case 'success':
        return (
          <div className="max-w-xl mx-auto text-center space-y-6 pt-10 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 text-4xl">✓</div>
            <h2 className="text-3xl font-bold text-slate-900">Shipment Created!</h2>
            <p className="text-slate-600">Your shipment record has been safely saved to your account.</p>
            {lastShipment && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                        <span className="text-sm text-slate-500">Tracking Number</span>
                        <span className="font-mono font-bold text-slate-900">{lastShipment.trackingNumber}</span>
                    </div>
                </div>
            )}
            <div className="flex flex-col space-y-3 pt-4">
                <a href={lastShipment?.labelUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">Download Label</a>
                <Button variant="outline" onClick={() => navigate('dashboard')}>Return to Dashboard</Button>
            </div>
          </div>
        );

      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} currentPage={currentPage} onNavigate={navigate}>
      {renderContent()}
    </Layout>
  );
};

export default App;
