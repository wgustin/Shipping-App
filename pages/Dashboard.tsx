
import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shipment, User } from '../types';
import { getTrackingUrl } from '../utils/tracking';

interface DashboardProps {
  user: User;
  onCreateClick: () => void;
  onViewHistoryClick: () => void;
  onViewShipmentClick: (id: string) => void;
  shipments: Shipment[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onCreateClick, onViewHistoryClick, onViewShipmentClick, shipments }) => {
  const recentShipments = shipments.slice(0, 3);
  const totalSpent = shipments.reduce((acc, curr) => acc + curr.selectedRate.totalAmount, 0);
  // Simulate 15% savings compared to retail rates
  const totalSaved = totalSpent * 0.15;

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
                <Button variant="outline" size="sm" onClick={onViewHistoryClick}>View History</Button>
            }
        >
          {recentShipments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 mb-4">No shipments yet.</p>
            </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Recipient</th>
                      <th className="px-4 py-3 font-medium">Carrier</th>
                      <th className="px-4 py-3 font-medium">Tracking</th>
                      <th className="px-4 py-3 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentShipments.map((s) => (
                      <tr 
                        key={s.id} 
                        onClick={() => onViewShipmentClick(s.id)}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 text-slate-900">{new Date(s.createdDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium group-hover:text-blue-600 transition-colors">{s.toAddress.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {s.selectedRate.carrier}
                             </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                          <a 
                            href={getTrackingUrl(s.selectedRate.carrier, s.trackingNumber)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {s.trackingNumber}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-900 text-right font-medium">${s.selectedRate.totalAmount.toFixed(2)}</td>
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
