import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../../../shared/types';
import { auth, db } from '../../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail, 
  updateEmail, 
  updatePassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authLoading: boolean;
  authError: { message: string; type: 'error' | 'success' } | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setAuthError: (error: { message: string; type: 'error' | 'success' } | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial get/create
        try {
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const newProfile = {
              id: firebaseUser.uid,
              firstName: firebaseUser.email?.split('@')[0] || 'User',
              lastName: '',
              email: firebaseUser.email || '',
              balance: 0,
              role: 'user' as const,
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, newProfile);
          }
        } catch (err) {
          console.error("[AuthContext] Error creating/fetching initial profile:", err);
        }

        // Listen for profile changes
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              firstName: profile.firstName || 'User',
              lastName: profile.lastName || '',
              email: firebaseUser.email || '',
              balance: profile.balance || 0,
              defaultFromAddressId: profile.defaultFromAddressId || null,
              role: profile.role || 'user',
              labelFormat: profile.labelFormat || 'PDF',
              labelSize: profile.labelSize || '8.5x11'
            });
          }
        }, (err) => {
          console.error("[AuthContext] Profile snapshot error:", err);
          // Fallback
          setUser({
            id: firebaseUser.uid,
            firstName: firebaseUser.email?.split('@')[0] || 'User',
            lastName: '',
            email: firebaseUser.email || '',
            balance: 0,
            defaultFromAddressId: null,
            role: 'user',
            labelFormat: 'PDF',
            labelSize: '8.5x11'
          });
        });

      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUser(null);
      }
      
      const params = new URLSearchParams(window.location.search);
      const hasStripeParams = params.has('payment_intent') || params.has('session_id') || params.get('status') === 'cancel';
      if (!hasStripeParams) {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const getAuthErrorMessage = (err: any): string => {
    const code = err?.code;
    switch (code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      default:
        return err?.message || "Authentication failed. Please try again.";
    }
  };

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError({ message: getAuthErrorMessage(err), type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Trigger welcome email via server
      const token = await firebaseUser.getIdToken();
      const firstName = email.split('@')[0];
      
      fetch('/api/auth/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ firstName })
      }).catch(err => console.error("Failed to trigger welcome email:", err));

      setAuthError({ message: "Account created! Welcome.", type: 'success' });
    } catch (err: any) {
      setAuthError({ message: getAuthErrorMessage(err), type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      navigate('/', { replace: true });
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.id);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error("Update profile error", err);
      throw err;
    }
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!auth.currentUser) return;
    try {
      await updateEmail(auth.currentUser, newEmail);
      // Also update Firestore
      await updateProfile({ email: newEmail });
    } catch (err: any) {
      console.error("Update email error", err);
      setAuthError({ message: getAuthErrorMessage(err), type: 'error' });
      throw err;
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) return;
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (err: any) {
      console.error("Update password error", err);
      setAuthError({ message: getAuthErrorMessage(err), type: 'error' });
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error("Reset password error", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      authLoading, 
      authError, 
      login, 
      signup, 
      logout, 
      updateProfile,
      updateUserEmail,
      updateUserPassword,
      resetPassword,
      setAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
