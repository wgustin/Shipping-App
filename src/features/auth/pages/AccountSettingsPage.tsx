
import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, CheckCircle2, AlertCircle, Database, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';

export const AccountSettings: React.FC = () => {
  const { user, updateUserEmail, updateUserPassword, authLoading, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isWiping, setIsWiping] = useState(false);

  const isAdmin = user?.email === 'WGustin@gmail.com';

  const handleWipeDatabase = async () => {
    if (!window.confirm("ARE YOU SURE? This will delete all shipments and user profiles from Firestore. This cannot be undone.")) return;
    
    setIsWiping(true);
    setSuccessMessage(null);
    setAuthError(null);

    try {
      // Clear Shipments
      console.log("Wiping shipments...");
      const shipmentsSnap = await getDocs(collection(db, 'shipments'));
      const shipmentBatch = writeBatch(db);
      shipmentsSnap.docs.forEach(d => shipmentBatch.delete(d.ref));
      await shipmentBatch.commit();

      // Clear Secure Rates
      console.log("Wiping secure rates...");
      const ratesSnap = await getDocs(collection(db, 'secure_rates'));
      const ratesBatch = writeBatch(db);
      ratesSnap.docs.forEach(d => ratesBatch.delete(d.ref));
      await ratesBatch.commit();

      // Clear Users (Firestore docs)
      console.log("Wiping users...");
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersBatch = writeBatch(db);
      // We don't delete the current user's profile to avoid forced logout/state issues immediately, 
      // or we can delete all and just let the app handle the missing profile.
      // Better to delete all if we want a full reset.
      usersSnap.docs.forEach(d => usersBatch.delete(d.ref));
      await usersBatch.commit();

      setSuccessMessage("Database wiped successfully! Note: Firebase Auth accounts still exist, but their profiles were cleared.");
    } catch (err: any) {
      console.error("Wipe error:", err);
      setAuthError({ message: "Failed to wipe database: " + err.message, type: 'error' });
    } finally {
      setIsWiping(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setAuthError(null);
    
    if (email === user?.email) {
      setAuthError({ message: "Email is already set to this address.", type: 'error' });
      return;
    }

    try {
      await updateUserEmail(email);
      setSuccessMessage("Email updated successfully!");
    } catch (err) {
      // Error is handled in context
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setAuthError(null);

    if (newPassword !== confirmPassword) {
      setAuthError({ message: "Passwords do not match.", type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setAuthError({ message: "Password must be at least 6 characters.", type: 'error' });
      return;
    }

    try {
      await updateUserPassword(newPassword);
      setSuccessMessage("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Error is handled in context
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-2">Manage your account security and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-teal-700">
              <Shield className="w-5 h-5" />
              <h2 className="font-bold">Security Tips</h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                Use a strong, unique password.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                Never share your login credentials.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                Update your password periodically.
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Messages */}
          {authError && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {authError.message}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Email Update Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Email Address</h3>
            </div>
            <form onSubmit={handleUpdateEmail} className="p-6 space-y-4">
              <Input
                label="Current Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter new email address"
                disabled={authLoading}
              />
              <div className="flex justify-end">
                <Button type="submit" isLoading={authLoading} disabled={email === user?.email}>
                  Update Email
                </Button>
              </div>
            </form>
          </div>

          {/* Password Update Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Change Password</h3>
            </div>
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={authLoading}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  disabled={authLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" isLoading={authLoading} disabled={!newPassword || !confirmPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* Admin Maintenance Section */}
          {isAdmin && (
            <div className="bg-red-50/50 rounded-2xl border border-red-100 shadow-sm overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-red-100 bg-red-100/50 flex items-center gap-3">
                <Database className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-800">Maintenance (Admin Only)</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900">Reset Application Database</h4>
                    <p className="text-sm text-slate-600 mt-1">This will permanently delete all shipments, saved rates, and user profile data from Firestore. This action is irreversible.</p>
                  </div>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white border-none"
                    onClick={handleWipeDatabase}
                    isLoading={isWiping}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Wipe Database
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
