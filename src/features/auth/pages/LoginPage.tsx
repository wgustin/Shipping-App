
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, authLoading, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleAuth = async () => {
    console.log("[LoginPage] 🔐 Starting login for email:", email);
    try {
      await login(email, password);
      console.log("[LoginPage] 🔐 Login function call completed");
    } catch (err) {
      console.error("[LoginPage] ❌ Login failed:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-8 flex flex-col items-center">
         <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
         <p className="text-slate-500 mt-2">Sign in to access your labels</p>
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
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={authLoading}
              />
              <Input 
                  label="Password" 
                  type="password" 
                  placeholder="Min. 6 characters" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={authLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
              <Button className="w-full h-12 text-lg rounded-xl shadow-lg shadow-blue-100" onClick={handleAuth} isLoading={authLoading}>
                  Log In
              </Button>
              
              <div className="text-center pt-4 border-t border-slate-100">
                  <button 
                      onClick={() => navigate('/signup')}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      disabled={authLoading}
                  >
                      Don't have an account? Sign up
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Login;
