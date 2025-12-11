import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shipment, User } from '../types';

interface DashboardProps {
  user: User;
  onCreateClick: () => void;
  onViewHistoryClick: () => void;
  shipments: Shipment[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onCreateClick, onViewHistoryClick, shipments }) => {
  const recentShipments = shipments.slice(0, 3);
  const totalSpent = shipments.reduce((acc, curr) => acc + curr.selectedRate.totalAmount, 0);
  // Simulate 15% savings compared to retail rates
  const totalSaved = totalSpent * 0.15;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-800 rounded-2xl p-8 md:p-12 text-white shadow-xl">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome back, {user.firstName}!</h1>
          <p className="text-blue-100 text-lg mb-8">Ready to send something somewhere? We've got the best rates waiting for you.</p>
          <Button 
            onClick={onCreateClick} 
            size="lg" 
            className="bg-white text-blue-900 hover:bg-blue-50 border-none font-bold shadow-lg"
          >
            Create New Shipment
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card 
            className="md:col-span-2" 
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
                      <th className="px-4 py-3 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentShipments.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-900">{new Date(s.createdDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{s.toAddress.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {s.selectedRate.carrier}
                             </span>
                        </td>
                        <td className="px-4 py-3 text-slate-900 text-right font-medium">${s.selectedRate.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
        </Card>

        <Card title="Quick Stats">
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 text-sm">Total Spent</span>
                    <span className="font-bold text-slate-900">
                        ${totalSpent.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 text-sm">Total Saved</span>
                    <span className="font-bold text-green-600">
                        ${totalSaved.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 text-sm">Shipments</span>
                    <span className="font-bold text-slate-900">{shipments.length}</span>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};