import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateShipment } from './pages/CreateShipment';
import { AddressBook } from './pages/AddressBook';
import { User, Shipment, Address } from './types';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

const mockUser: User = {
  id: 'usr_123',
  firstName: 'Alex',
  lastName: 'Consumer',
  email: 'alex@example.com',
  balance: 0
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null); // Start logged out
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [lastShipment, setLastShipment] = useState<Shipment | null>(null);
  
  // State to hold address when "Ship to this" is clicked in Address Book
  const [initialShipmentAddress, setInitialShipmentAddress] = useState<Address | null>(null);

  // Simple routing logic
  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    setUser(mockUser);
    navigate('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    navigate('landing');
  };

  const handleShipmentComplete = (shipment: Shipment) => {
    setShipments([shipment, ...shipments]);
    setLastShipment(shipment);
    setInitialShipmentAddress(null); // Clear any pre-filled data
    navigate('success');
  };

  const handleSaveAddress = (addr: Address) => {
     // Use functional update to ensure we always have the latest state, 
     // preventing race conditions when saving multiple addresses quickly.
     setSavedAddresses(prevAddresses => {
        // Simple de-duplication based on name, street and zip
        const exists = prevAddresses.some(a => 
            a.street1.toLowerCase() === addr.street1.toLowerCase() && 
            a.zip === addr.zip &&
            a.name.toLowerCase() === addr.name.toLowerCase()
        );
        
        if (!exists) {
            return [addr, ...prevAddresses];
        }
        return prevAddresses;
     });
  };
  
  const handleShipFromBook = (address: Address) => {
      setInitialShipmentAddress(address);
      navigate('create');
  };

  // Rendering logic based on page
  const renderContent = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
             <div className="bg-blue-100 p-4 rounded-full mb-6">
                <span className="text-4xl">📦</span>
             </div>
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
              Shipping Simplified.
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mb-10">
              The easiest way to compare rates, buy labels, and ship packages from home. 
              Powered by AI to make address entry a breeze.
            </p>
            <div className="flex space-x-4">
              <Button size="lg" onClick={handleLogin}>Get Started Free</Button>
              <Button size="lg" variant="outline" onClick={handleLogin}>Log In</Button>
            </div>
            
            <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left max-w-7xl px-4">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="text-2xl mb-3">🏷️</div>
                    <h3 className="font-bold text-lg mb-2 text-slate-900">Unbeatable Savings</h3>
                    <p className="text-slate-600">Save up to 80% on standard retail rates from carriers like USPS and UPS.</p>
                </div>
                 <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="text-2xl mb-3">✨</div>
                    <h3 className="font-bold text-lg mb-2 text-slate-900">Zero Hidden Fees</h3>
                    <p className="text-slate-600">No monthly subscriptions or minimums. Pay only for what you ship.</p>
                </div>
                 <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="text-2xl mb-3">🏃</div>
                    <h3 className="font-bold text-lg mb-2 text-slate-900">Skip the Line</h3>
                    <p className="text-slate-600">Print official labels from the comfort of your home and drop them off instantly.</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="text-2xl mb-3">⚡</div>
                    <h3 className="font-bold text-lg mb-2 text-slate-900">Lightning Fast</h3>
                    <p className="text-slate-600">Create your label in minutes using our AI Smart Paste technology.</p>
                </div>
            </div>
          </div>
        );
      
      case 'login': 
      case 'signup':
        return (
             <div className="max-w-md mx-auto mt-10">
                <Card title={currentPage === 'login' ? 'Welcome Back' : 'Create Account'}>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-500 mb-4">
                            For this demo, just click the button below to simulate authentication.
                        </div>
                        <Button className="w-full" onClick={handleLogin}>
                            {currentPage === 'login' ? 'Log In' : 'Sign Up'}
                        </Button>
                    </div>
                </Card>
             </div>
        );

      case 'dashboard':
        return <Dashboard 
            user={user!} 
            onCreateClick={() => navigate('create')} 
            onViewHistoryClick={() => navigate('history')}
            shipments={shipments} 
        />;
      
      case 'addresses':
        return <AddressBook 
            addresses={savedAddresses} 
            onAddAddress={handleSaveAddress} 
            onCreateShipment={handleShipFromBook}
        />;

      case 'create':
        return <CreateShipment 
            onComplete={handleShipmentComplete} 
            savedAddresses={savedAddresses} 
            onSaveAddress={handleSaveAddress}
            initialToAddress={initialShipmentAddress}
        />;
      
      case 'success':
        return (
          <div className="max-w-xl mx-auto text-center space-y-6 pt-10 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 text-4xl">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Shipment Created!</h2>
            <p className="text-slate-600">
              Your label is ready to print. A confirmation email has been sent to {user?.email}.
            </p>
            
            {lastShipment && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                        <span className="text-sm text-slate-500">Tracking Number</span>
                        <span className="font-mono font-bold text-slate-900">{lastShipment.trackingNumber}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Carrier</span>
                        <span className="font-medium text-slate-900">{lastShipment.selectedRate.carrier} {lastShipment.selectedRate.serviceName}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col space-y-3 pt-4">
                <a 
                    href={lastShipment?.labelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                    Download Label (PDF)
                </a>
                <Button variant="outline" onClick={() => navigate('dashboard')}>Return to Dashboard</Button>
            </div>
          </div>
        );
      
      case 'history':
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Shipment History</h2>
                    <Button onClick={() => navigate('create')}>New Shipment</Button>
                </div>
                {shipments.length === 0 ? (
                    <Card>
                        <div className="text-center py-12 text-slate-500">You haven't created any shipments yet.</div>
                    </Card>
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
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" size="sm" onClick={() => window.open(s.labelUrl, '_blank')}>
                                                Reprint Label
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs py-1 h-auto"
                                                onClick={() => alert(`Refund requested for shipment ${s.trackingNumber}`)}
                                            >
                                                Request Refund
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );

      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout 
        user={user} 
        onLogout={handleLogout} 
        currentPage={currentPage}
        onNavigate={navigate}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;