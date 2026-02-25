
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateShipment } from './pages/CreateShipment';
import { AddressBook } from './pages/AddressBook';
import { ShipmentDetails } from './pages/ShipmentDetails';
import { User, Shipment, Address } from './types';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Card } from './components/ui/Card';
import { getSupabase } from './services/supabaseClient';
import { fetchShipmentHistory, fetchSavedAddresses, saveAddressToBook, setDefaultFromAddress, createShipment } from './services/mockApiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [lastShipment, setLastShipment] = useState<Shipment | null>(null);
  const [initialShipmentAddress, setInitialShipmentAddress] = useState<Address | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Form states for login/signup
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Helper for date formatting
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const y = date.getFullYear();
      return `${m}/${d}/${y}`;
    } catch {
      return dateStr;
    }
  };

  const getCarrierLogo = (carrier: string) => {
    const c = carrier.toUpperCase();
    if (c.includes('USPS')) return '/Images/USPS.svg';
    if (c.includes('UPS')) return '/Images/UPS.svg';
    if (c.includes('FEDEX')) return 'https://upload.wikimedia.org/wikipedia/commons/9/9d/FedEx_Express_logo.svg';
    if (c.includes('DHL')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg';
    return null;
  };

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

  // Handle Stripe Redirect
  useEffect(() => {
    const handleStripeReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const status = params.get('status');

      if (sessionId && status === 'success') {
        setLoading(true);
        try {
          // Verify session with backend
          const response = await fetch(`/api/checkout-session/${sessionId}`);
          const session = await response.json();

          if (session.payment_status === 'paid') {
            // Retrieve pending shipment data
            const pendingData = localStorage.getItem('pending_shipment');
            if (pendingData) {
              const { fromAddress, toAddress, pkg, selectedRate, userId } = JSON.parse(pendingData);
              
              // Create the actual shipment now that payment is confirmed
              const shipment = await createShipment(userId, fromAddress, toAddress, selectedRate, pkg);
              if (shipment) {
                setShipments(prev => [shipment, ...prev]);
                setLastShipment(shipment);
                setCurrentPage('success');
                localStorage.removeItem('pending_shipment');
              }
            }
          }
        } catch (error) {
          console.error("Error processing Stripe return:", error);
        } finally {
          setLoading(false);
          // Clean up URL
          window.history.replaceState({}, document.title, "/");
        }
      } else if (status === 'cancel') {
        // Handle cancellation
        window.history.replaceState({}, document.title, "/");
        setCurrentPage('create');
      }
    };

    handleStripeReturn();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const supabase = await getSupabase();
    if (!supabase) return;

    try {
      // Use a shorter timeout for the profile fetch to avoid hanging the UI
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: profile, error } = await profilePromise;
      
      if (error) {
        throw error;
      }
      
      if (profile) {
        setUser({
          id: profile.id,
          firstName: profile.first_name || 'User',
          lastName: profile.last_name || '',
          email: profile.email,
          balance: profile.balance || 0,
          defaultFromAddressId: profile.default_from_address_id
        });
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup') {
            setCurrentPage('dashboard');
        }
      } else {
        throw new Error("No profile found");
      }
    } catch (err) {
      console.warn("Database profile fetch failed, falling back to auth metadata:", err);
      try {
        // If the lock timeout occurred, getUser() might still fail. 
        // We try to get the session first which is often faster/cached.
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;

        if (authUser) {
          setUser({
            id: authUser.id,
            firstName: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'New',
            lastName: authUser.user_metadata?.last_name || 'User',
            email: authUser.email || '',
            balance: 0,
            defaultFromAddressId: undefined
          });
          if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup') {
              setCurrentPage('dashboard');
          }
        } else {
            // Last ditch effort: try getUser directly
            const { data: { user: directUser } } = await supabase.auth.getUser();
            if (directUser) {
                setUser({
                    id: directUser.id,
                    firstName: directUser.user_metadata?.first_name || directUser.email?.split('@')[0] || 'New',
                    lastName: directUser.user_metadata?.last_name || 'User',
                    email: directUser.email || '',
                    balance: 0,
                    defaultFromAddressId: undefined
                });
                if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup') {
                    setCurrentPage('dashboard');
                }
            }
        }
      } catch (fallbackErr) {
        console.error("Critical: Could not load user even from auth metadata", fallbackErr);
      }
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    try {
        const history = await fetchShipmentHistory(user.id);
        setShipments(history);
    } catch (e) {
        console.warn("Could not reload history.", e);
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
          console.warn("Could not load user data.", e);
        }
      };
      loadData();
    }
  }, [user]);

  const navigate = (page: string) => {
    setAuthError(null);
    setSelectedShipmentId(null);
    if (page !== 'create') {
        setInitialShipmentAddress(null);
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleAuth = async () => {
    const supabase = await getSupabase();
    if (!supabase) return;
    
    setAuthLoading(true);
    setAuthError(null);
    console.group(`Auth Action: ${currentPage}`);
    
    try {
      if (currentPage === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
            console.error("Login Failure:", error);
            if (error.message === 'Invalid login credentials' || error.status === 400) {
                throw new Error("Incorrect email or password. If you haven't created an account yet, please use the Sign Up option or try the Demo Login.");
            }
            if (error.message.includes('schema') || error.message.includes('database')) {
                throw new Error("We're experiencing database connection issues. Please try the 'Demo Login' to explore the app while we fix this.");
            }
            throw error;
        }
        console.info("Login Successful");
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
        
        if (error) {
            console.error("Signup Failure:", error);
            if (error.message.includes('schema') || error.message.includes('database')) {
                throw new Error("Database setup is incomplete. Please use 'Demo Login' to see how the app works!");
            }
            throw error;
        }
        console.info("Signup Success:", data);

        if (data?.session) {
          setAuthError({ message: "Account created! Welcome.", type: 'success' });
          await loadUserProfile(data.session.user.id);
        } else {
          setAuthError({ message: "Success! Please check your email for a confirmation link.", type: 'success' });
        }
      }
    } catch (err: any) {
      setAuthError({ message: err.message || "Authentication failed. Please check your network.", type: 'error' });
    } finally {
      setAuthLoading(false);
      console.groupEnd();
    }
  };

  const handleDemoLogin = () => {
    setAuthLoading(true);
    setTimeout(() => {
        setUser({
          id: 'demo-user-123',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@shipeasy.app',
          balance: 250.00,
          defaultFromAddressId: undefined
        });
        setShipments([]);
        setSavedAddresses([]);
        setCurrentPage('dashboard');
        setAuthLoading(false);
    }, 800);
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

  const handleSetDefaultAddress = async (addressId: string) => {
    if (user) {
        setUser(prev => prev ? { ...prev, defaultFromAddressId: addressId } : null);
        try {
            await setDefaultFromAddress(user.id, addressId);
            loadUserProfile(user.id);
        } catch (e: any) {
            console.warn("Could not save default to database.", e);
        }
    }
  };

  const handleShipFromBook = (address: Address) => {
    setInitialShipmentAddress(address);
    navigate('create');
  };

  const viewShipmentDetails = (id: string) => {
    setSelectedShipmentId(id);
    setCurrentPage('shipment-details');
    window.scrollTo(0, 0);
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
          <div className="space-y-24 pb-20 overflow-hidden">
            <section className="relative pt-12 lg:pt-20">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 text-center lg:text-left animate-in slide-in-from-left-8 duration-700">
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6">
                    <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                    Ship like a pro, pay like a local
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-8">
                    Stop overpaying for <span className="text-blue-600">shipping labels.</span>
                  </h1>
                  <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Get commercial-grade USPS & UPS rates instantly. No monthly fees. No commitments. Just labels, for 80% less than retail.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 mb-8">
                    <Button size="lg" onClick={() => navigate('signup')} className="w-full sm:w-auto px-10 py-5 text-xl rounded-2xl shadow-2xl shadow-blue-200">
                      Get Started Free
                    </Button>
                    <div className="text-sm text-slate-500 font-medium">
                      Pay only when you ship.
                    </div>
                  </div>

                  <div className="bg-slate-100/80 border border-slate-200 p-6 rounded-2xl max-w-md mx-auto lg:mx-0 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <div className="text-center sm:text-left">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Carrier Rate</div>
                      <div className="text-2xl font-medium text-slate-400 line-through decoration-red-400/60">$18.45</div>
                    </div>
                    
                    <div className="hidden sm:block text-slate-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>

                    <div className="text-center sm:text-right">
                      <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">ShipEasy Pro Rate</div>
                      <div className="flex items-center justify-center sm:justify-end gap-2">
                        <span className="text-3xl font-black text-slate-900">$7.24</span>
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase tracking-tighter">Save 61%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full animate-in slide-in-from-right-8 duration-1000">
                  <div className="relative">
                    <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform rotate-1 hover:rotate-0 transition-transform duration-700">
                      <img 
                        src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&q=80&w=2000" 
                        alt="Home shipping" 
                        className="w-full h-[500px] object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">The easiest way to ship. Period.</h2>
                  <p className="text-slate-500 text-lg">Designed for individuals and small shops who ship occasionally.</p>
               </div>
               
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">💰</div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">Up to 80% Off</h3>
                    <p className="text-slate-600 leading-relaxed">Access commercial rates usually reserved for giant corporations. USPS and UPS labels at the absolute lowest prices.</p>
                  </div>

                  <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🚶‍♂️</div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">No More Waiting</h3>
                    <p className="text-slate-600 leading-relaxed">Skip the line at the post office or UPS store. Print your labels at home and just drop them off or schedule a pickup.</p>
                  </div>

                  <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">✨</div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">AI "Smart Paste"</h3>
                    <p className="text-slate-600 leading-relaxed">Copy a messy address from an email or text and paste it. Our AI extracts and standardizes it perfectly in one click.</p>
                  </div>

                  <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🗓️</div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">Zero Monthly Fees</h3>
                    <p className="text-slate-600 leading-relaxed">Most shipping software costs $20+/mo. We charge zero. No subscriptions, no hidden fees. Only pay for the labels you buy.</p>
                  </div>

                  <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🤖</div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">AI Rate Selection</h3>
                    <p className="text-slate-600 leading-relaxed">Our engine automatically suggests the fastest and cheapest carriers for your specific package dimensions and destination.</p>
                  </div>

                  <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📇</div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">Address Memory</h3>
                    <p className="text-slate-600 leading-relaxed">We automatically save every address you ship to. Sending to grandma or a repeat customer? It's a single click away.</p>
                  </div>
               </div>
            </section>

            <section className="bg-slate-900 rounded-[3rem] py-16 px-8 text-center text-white relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,_#3b82f6_0%,_transparent_50%)]"></div>
               <div className="relative z-10 max-w-3xl mx-auto">
                  <h2 className="text-4xl lg:text-5xl font-black mb-6">Ready to stop overpaying?</h2>
                  <p className="text-slate-400 text-lg mb-10 leading-relaxed">Join thousands of occasional shippers who save time and money on every single package. Sign up in 30 seconds.</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" onClick={() => navigate('signup')} className="bg-blue-600 hover:bg-blue-700 h-auto py-5 px-10 text-xl font-bold rounded-2xl">Create My Account</Button>
                    <Button variant="outline" size="lg" onClick={() => navigate('login')} className="border-slate-700 text-white hover:bg-slate-800 h-auto py-5 px-10 text-xl font-bold rounded-2xl">Log In</Button>
                  </div>
                  <p className="mt-8 text-sm text-slate-500">No commitment. No credit card required to browse rates.</p>
               </div>
            </section>
          </div>
        );

      case 'login': 
      case 'signup':
        return (
             <div className="max-w-md mx-auto mt-20 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                   <h2 className="text-3xl font-bold text-slate-900">{currentPage === 'login' ? 'Welcome Back' : 'Get Started'}</h2>
                   <p className="text-slate-500 mt-2">{currentPage === 'login' ? 'Sign in to access your labels' : 'Start saving on shipping today'}</p>
                </div>
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                    <div className="space-y-5">
                        {authError && (
                            <div className={`p-4 rounded-xl text-sm ${authError.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
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
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        />
                        <Button className="w-full py-4 text-lg rounded-xl shadow-lg shadow-blue-100" onClick={handleAuth} isLoading={authLoading}>
                            {currentPage === 'login' ? 'Log In' : 'Create Free Account'}
                        </Button>
                        
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or try it out</span></div>
                        </div>

                        <Button variant="outline" className="w-full py-4 text-lg rounded-xl border-slate-200 hover:bg-slate-50" onClick={handleDemoLogin} disabled={authLoading}>
                            Demo Login (No Account Needed)
                        </Button>
                        <div className="text-center pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => navigate(currentPage === 'login' ? 'signup' : 'login')}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                disabled={authLoading}
                            >
                                {currentPage === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        );

      case 'dashboard':
        return (
          <Dashboard 
            user={user!} 
            onCreateClick={() => navigate('create')} 
            onViewHistoryClick={() => navigate('history')} 
            onViewShipmentClick={viewShipmentDetails}
            shipments={shipments} 
          />
        );
      
      case 'addresses':
        return <AddressBook user={user!} addresses={savedAddresses} onAddAddress={handleSaveAddress} onCreateShipment={handleShipFromBook} onSetDefault={handleSetDefaultAddress} />;

      case 'create':
        return <CreateShipment user={user!} onComplete={handleShipmentComplete} savedAddresses={savedAddresses} onSaveAddress={handleSaveAddress} initialToAddress={initialShipmentAddress} />;
      
      case 'history':
        const filteredShipments = shipments.filter(s => {
            const term = historySearchTerm.toLowerCase();
            return (
                (s.trackingNumber || '').toLowerCase().includes(term) ||
                (s.status || '').toLowerCase().includes(term) ||
                // To Address
                (s.toAddress.name || '').toLowerCase().includes(term) ||
                (s.toAddress.street1 || '').toLowerCase().includes(term) ||
                (s.toAddress.street2 || '').toLowerCase().includes(term) ||
                (s.toAddress.city || '').toLowerCase().includes(term) ||
                (s.toAddress.state || '').toLowerCase().includes(term) ||
                (s.toAddress.zip || '').toLowerCase().includes(term) ||
                // From Address
                (s.fromAddress.name || '').toLowerCase().includes(term) ||
                (s.fromAddress.street1 || '').toLowerCase().includes(term) ||
                (s.fromAddress.city || '').toLowerCase().includes(term) ||
                (s.fromAddress.state || '').toLowerCase().includes(term) ||
                (s.fromAddress.zip || '').toLowerCase().includes(term) ||
                // Rate Details
                (s.selectedRate.carrier || '').toLowerCase().includes(term) ||
                (s.selectedRate.serviceName || '').toLowerCase().includes(term)
            );
        });

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">Shipment History</h2>
                      <p className="text-slate-500">Track and manage your past labels.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search shipments..."
                                value={historySearchTerm}
                                onChange={(e) => setHistorySearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <Button onClick={() => navigate('create')} className="rounded-xl whitespace-nowrap">New Shipment</Button>
                    </div>
                </div>
                {filteredShipments.length === 0 ? (
                    <Card><div className="text-center py-20 text-slate-500">No shipments found.</div></Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredShipments.map(s => (
                            <Card 
                                key={s.id} 
                                className={`transition-all group rounded-2xl cursor-pointer hover:border-blue-200 hover:shadow-md ${s.status === 'cancelled' ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4" onClick={() => viewShipmentDetails(s.id)}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-700">{s.trackingNumber}</span>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${s.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <div className="text-slate-900 font-bold text-lg">To: {s.toAddress.name}</div>
                                        <div className="text-sm text-slate-500">{s.toAddress.city}, {s.toAddress.state} • {new Date(s.createdDate).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden md:block">
                                            <div className="font-black text-2xl text-slate-900">${s.selectedRate.totalAmount.toFixed(2)}</div>
                                            <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">{s.selectedRate.carrier}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); viewShipmentDetails(s.id); }} className="rounded-xl px-4">Details</Button>
                                            {s.status !== 'cancelled' && (
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.open(s.labelUrl, '_blank') }} className="rounded-xl">Print</Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );

      case 'shipment-details':
        const selectedShipment = shipments.find(s => s.id === selectedShipmentId);
        if (!selectedShipment) {
            navigate('history');
            return null;
        }
        return <ShipmentDetails shipment={selectedShipment} onBack={() => navigate('history')} onUpdate={loadHistory} />;

      case 'success':
        const cost = lastShipment?.selectedRate.totalAmount || 0;
        const savingsAmount = cost * 0.15;
        const carrierLogo = lastShipment ? getCarrierLogo(lastShipment.selectedRate.carrier) : null;
        const sRate = lastShipment?.selectedRate;
        const pkg = lastShipment?.packageDetails;
        const displayServiceName = sRate?.serviceName.toUpperCase().startsWith(sRate?.carrier.toUpperCase() || '')
          ? sRate?.serviceName
          : `${sRate?.carrier} ${sRate?.serviceName}`;

        return (
          <div className="max-w-3xl mx-auto space-y-8 pt-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Header Section with Print Button */}
            <div className="text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-5xl shadow-xl border-4 border-white">
                        ✓
                    </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Label Ready!</h2>
                  <p className="text-slate-500 text-xl">Your package is ready to ship.</p>
                </div>

                <div className="flex justify-center">
                    <a 
                      href={lastShipment?.labelUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-3 px-8 py-4 text-xl font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-[0.98]"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Print Label Now
                    </a>
                </div>
            </div>

            {/* Summary Card */}
            {lastShipment && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                    {/* Carrier & Service Header */}
                    <div className="bg-slate-50/50 p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex items-center justify-center">
                                {carrierLogo ? (
                                    <img src={carrierLogo} alt={sRate?.carrier} className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <span className="text-xs font-bold uppercase text-slate-400">{sRate?.carrier}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 uppercase font-black tracking-widest mb-1">Service</p>
                                <h3 className="font-extrabold text-slate-900 text-xl">{displayServiceName}</h3>
                                <div className="mt-1 flex items-center gap-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase">
                                        {sRate?.deliveryDays} {sRate?.deliveryDays === 1 ? 'day' : 'days'}
                                    </span>
                                    <span className="text-xs text-slate-500 font-bold">Est: {formatDate(sRate?.estimatedDeliveryDate || '')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                             <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Tracking Number</p>
                             <div className="font-mono text-lg font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg select-all">
                                {lastShipment.trackingNumber}
                             </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 md:gap-12 relative">
                        {/* Vertical Divider for Desktop */}
                        <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-slate-100"></div>

                        {/* From / To Addresses */}
                        <div className="space-y-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">From</p>
                                </div>
                                <div className="pl-4 border-l-2 border-slate-100">
                                    <p className="font-bold text-slate-900 text-lg">{lastShipment.fromAddress.name}</p>
                                    <p className="text-slate-500 leading-relaxed">
                                        {lastShipment.fromAddress.street1}<br/>
                                        {lastShipment.fromAddress.street2 && <>{lastShipment.fromAddress.street2}<br/></>}
                                        {lastShipment.fromAddress.city}, {lastShipment.fromAddress.state} {lastShipment.fromAddress.zip}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest">To Destination</p>
                                </div>
                                <div className="pl-4 border-l-2 border-blue-100">
                                    <p className="font-bold text-slate-900 text-lg">{lastShipment.toAddress.name}</p>
                                    <p className="text-slate-500 leading-relaxed">
                                        {lastShipment.toAddress.street1}<br/>
                                        {lastShipment.toAddress.street2 && <>{lastShipment.toAddress.street2}<br/></>}
                                        {lastShipment.toAddress.city}, {lastShipment.toAddress.state} {lastShipment.toAddress.zip}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Package & Cost */}
                        <div className="space-y-8">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Package Details</p>
                                <div className="bg-slate-50 rounded-2xl p-5 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Dimensions</p>
                                        <p className="font-bold text-slate-900">{pkg?.length} x {pkg?.width} x {pkg?.height} {pkg?.unit}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Weight</p>
                                        <p className="font-bold text-slate-900">{pkg?.weight} {pkg?.weightUnit}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Summary</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span>Subtotal</span>
                                        <span>${(cost + savingsAmount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-green-600 font-medium">
                                        <span>ShipEasy Discount</span>
                                        <span>-${savingsAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-900">Total Paid</span>
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">${cost.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-center gap-6 pt-4">
                <button onClick={() => navigate('dashboard')} className="text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Return to Dashboard</button>
                <div className="w-px h-4 bg-slate-300 self-center"></div>
                <button onClick={() => navigate('create')} className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors">Create Another Label</button>
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
