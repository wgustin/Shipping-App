import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { User, Shipment, Address } from './shared/types';
import { useAuth } from './features/auth/context/AuthContext';
import { useShipments } from './features/shipments/context/ShipmentContext';
import { useAddresses } from './features/address-book/context/AddressContext';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateShipment = lazy(() => import('./pages/CreateShipment'));
const AddressBook = lazy(() => import('./features/address-book/pages/AddressBookPage'));
const ShipmentDetails = lazy(() => import('./features/shipments/pages/ShipmentDetailsPage'));
const Landing = lazy(() => import('./features/landing/pages/LandingPage'));
const Login = lazy(() => import('./features/auth/pages/LoginPage'));
const Signup = lazy(() => import('./features/auth/pages/SignupPage'));
const AccountSettings = lazy(() => import('./features/auth/pages/AccountSettingsPage'));
const History = lazy(() => import('./pages/History'));
const Success = lazy(() => import('./features/shipments/pages/SuccessPage'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
);

const ProtectedRoute: React.FC<{ user: User | null; children: React.ReactNode }> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const ShipmentDetailsWrapper: React.FC<{ 
  shipments: Shipment[]; 
  onUpdate: () => void; 
}> = ({ shipments, onUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedShipment = shipments.find(s => s.id === id);
  
  if (!selectedShipment) {
    return <Navigate to="/history" replace />;
  }
  
  return <ShipmentDetails shipment={selectedShipment} onBack={() => navigate('/history')} onUpdate={onUpdate} />;
};

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    shipments, 
    loading: shipmentsLoading, 
    historySearchTerm, 
    setHistorySearchTerm, 
    refreshShipments, 
    completeShipment, 
    initialShipmentAddress,
    setInitialShipmentAddress 
  } = useShipments();
  const { savedAddresses, saveAddress } = useAddresses();
  
  const navigate = useNavigate();
  const location = useLocation();

  const loading = authLoading;

  useEffect(() => {
    if (user && !loading) {
      const params = new URLSearchParams(window.location.search);
      const hasStripeParams = params.has('payment_intent') || params.has('session_id') || params.get('status') === 'cancel';
      
      if (!hasStripeParams && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup')) {
        console.log("[App] Redirecting authenticated user to dashboard");
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  const viewShipmentDetails = (id: string) => {
    navigate(`/shipments/${id}`);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : <Landing />
          } />

          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : (
              <Login />
            )
          } />

          <Route path="/signup" element={
            user ? <Navigate to="/dashboard" replace /> : (
              <Signup />
            )
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute user={user}>
              <Dashboard 
                user={user!} 
                onCreateClick={() => navigate('/create')} 
                onViewHistoryClick={() => navigate('/history')} 
                onViewShipmentClick={viewShipmentDetails}
                shipments={shipments} 
              />
            </ProtectedRoute>
          } />

          <Route path="/address-book" element={
            <ProtectedRoute user={user}>
              <AddressBook />
            </ProtectedRoute>
          } />

          <Route path="/account" element={
            <ProtectedRoute user={user}>
              <AccountSettings />
            </ProtectedRoute>
          } />

          <Route path="/create" element={
            <ProtectedRoute user={user}>
              <CreateShipment 
                user={user!} 
                onComplete={completeShipment} 
                savedAddresses={savedAddresses} 
                onSaveAddress={saveAddress} 
                initialToAddress={initialShipmentAddress} 
              />
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute user={user}>
              <History 
                shipments={shipments}
                historySearchTerm={historySearchTerm}
                setHistorySearchTerm={setHistorySearchTerm}
                viewShipmentDetails={viewShipmentDetails}
              />
            </ProtectedRoute>
          } />

          <Route path="/shipments/:id" element={
            <ProtectedRoute user={user}>
              <ShipmentDetailsWrapper shipments={shipments} onUpdate={refreshShipments} />
            </ProtectedRoute>
          } />

          <Route path="/success" element={
            <ProtectedRoute user={user}>
              <Success />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
