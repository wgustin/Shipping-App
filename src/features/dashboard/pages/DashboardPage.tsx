
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../auth/context/AuthContext';
import { useShipments } from '../../shipments/context/ShipmentContext';
import { ArrowUpRight, Package, CheckCircle2, Clock, AlertCircle, Truck, ExternalLink, Copy, Check } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { shipments } = useShipments();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!user) return null;

  const onCreateClick = () => navigate('/create');
  const onViewHistoryClick = () => navigate('/history');
  const onViewShipmentClick = (id: string) => {
    navigate(`/shipments/${id}`);
    window.scrollTo(0, 0);
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 5);
  const totalSpent = shipments.reduce((acc, curr) => acc + (curr.selectedRate?.totalAmount || 0), 0);
  // Simulate 15% savings compared to retail rates
  const totalSaved = totalSpent * 0.15;

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'shipped':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'error':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-800 rounded-2xl p-8 md:p-12 text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome back, {user.firstName}!</h1>
          <p className="text-blue-100 text-lg mb-8">Ready to send something somewhere? We've got the best rates waiting for you.</p>
          <Button 
            onClick={onCreateClick} 
            size="lg" 
            variant="outline"
            className="bg-white text-blue-900 hover:bg-blue-50 border-none font-black shadow-xl px-8 transform transition-transform hover:-translate-y-0.5"
          >
            Create New Shipment
          </Button>
        </div>

        {/* Quick Stats moved to Hero */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 min-w-[140px]">
                <div className="text-blue-200 text-sm font-medium mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 min-w-[140px]">
                <div className="text-blue-200 text-sm font-medium mb-1">Total Saved</div>
                <div className="text-2xl font-bold text-green-400">${totalSaved.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 min-w-[140px]">
                <div className="text-blue-200 text-sm font-medium mb-1">Shipments</div>
                <div className="text-2xl font-bold text-white">{shipments.length}</div>
            </div>
        </div>
      </div>

      <div className="w-full">
        <Card 
            title="Recent Activity" 
            actions={
                <Button variant="outline" size="sm" onClick={onViewHistoryClick} className="font-medium">
                  View History
                </Button>
            }
        >
          {recentShipments.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No shipments yet.</p>
              <p className="text-slate-400 text-sm">Your recent activity will appear here.</p>
            </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">DATE</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">RECIPIENT</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">CARRIER</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">TRACKING</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">STATUS</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">COST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentShipments.map((s) => (
                      <tr 
                        key={s.id} 
                        onClick={() => onViewShipmentClick(s.id)}
                        className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${s.status === 'cancelled' ? 'opacity-60' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">
                            {new Date(s.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {new Date(s.createdDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {s.toAddress?.name}
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {s.toAddress?.city}, {s.toAddress?.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                            {s.selectedRate?.carrier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium text-slate-600 tracking-tight">
                              {s.trackingNumber || 'N/A'}
                            </span>
                            {s.trackingNumber && (
                              <button 
                                onClick={(e) => handleCopy(e, s.trackingNumber || '', s.id)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                                title="Copy tracking number"
                              >
                                {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(s.status)}`}>
                            {(s.status === 'shipped' || s.status === 'delivered') && <Check className="w-3 h-3 stroke-[3]" />}
                            {s.status === 'processing' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                            {s.status === 'cancelled' ? 'VOIDED' : s.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-extrabold text-slate-900">
                            ${s.selectedRate?.totalAmount?.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
