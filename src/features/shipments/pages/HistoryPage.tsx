
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Shipment } from '../../../shared/types';
import { getTrackingUrl } from '../../../shared/utils/tracking';
import { printLabelPdf } from '../../../shared/utils/pdf';
import { Search, Plus, Copy, Check, ExternalLink, Printer, MoreHorizontal } from 'lucide-react';

import { useShipments } from '../context/ShipmentContext';

export const History: React.FC = () => {
  const { shipments, historySearchTerm, setHistorySearchTerm } = useShipments();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const viewShipmentDetails = (id: string) => {
    navigate(`/shipment/${id}`);
  };

  const handlePrint = async (e: React.MouseEvent, labelUrl: string | undefined | null, id: string, labelFormat?: string, paperSize?: string) => {
    e.stopPropagation();
    if (!labelUrl) return;
    setPrintingId(id);
    try {
      await printLabelPdf(labelUrl, labelFormat, paperSize);
    } finally {
      setPrintingId(null);
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredShipments = shipments.filter(s => {
    const term = historySearchTerm.toLowerCase();
    return (
        (s.trackingNumber || '').toLowerCase().includes(term) ||
        (s.status || '').toLowerCase().includes(term) ||
        (s.toAddress?.name || '').toLowerCase().includes(term) ||
        (s.toAddress?.city || '').toLowerCase().includes(term) ||
        (s.toAddress?.state || '').toLowerCase().includes(term) ||
        (s.selectedRate?.carrier || '').toLowerCase().includes(term) ||
        (s.selectedRate?.serviceName || '').toLowerCase().includes(term)
    );
  });

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
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Shipment History</h1>
              <p className="text-slate-500 text-lg mt-2 font-medium">Track and manage your past labels.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search shipments..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white shadow-sm text-slate-600 font-medium"
                    />
                </div>
                <Button 
                    onClick={() => navigate('/create')} 
                    className="rounded-xl px-6 py-6 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
                >
                    New Shipment
                </Button>
            </div>
        </div>

        {filteredShipments.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                <div className="text-center py-24">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No shipments found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your search or create a new shipment.</p>
                </div>
            </Card>
        ) : (
            <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50 rounded-2xl">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">DATE</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">RECIPIENT</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">CARRIER</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">TRACKING</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">STATUS</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">COST</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredShipments.map(s => (
                                <tr 
                                    key={s.id} 
                                    onClick={() => viewShipmentDetails(s.id)}
                                    className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${s.status === 'cancelled' ? 'opacity-60' : ''}`}
                                >
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">
                                            {new Date(s.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                                            {new Date(s.createdDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {s.toAddress?.name}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                                            {s.toAddress?.city}, {s.toAddress?.state}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                            {s.selectedRate?.carrier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono font-medium text-slate-600 tracking-tight">
                                                {s.trackingNumber}
                                            </span>
                                            <button 
                                                onClick={(e) => handleCopy(e, s.trackingNumber || '', s.id)}
                                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                                                title="Copy tracking number"
                                            >
                                                {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(s.status)}`}>
                                            {(s.status === 'shipped' || s.status === 'delivered') && <Check className="w-3 h-3 stroke-[3]" />}
                                            {s.status === 'processing' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                            {s.status === 'cancelled' ? 'VOIDED' : s.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-extrabold text-slate-900">
                                            ${s.selectedRate?.totalAmount?.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {s.status !== 'cancelled' ? (
                                                <Button 
                                                    variant="primary" 
                                                    size="sm" 
                                                    onClick={(e) => handlePrint(e, s.labelUrl, s.id, s.packageDetails?.labelFormat, s.packageDetails?.paperSize)} 
                                                    disabled={printingId === s.id}
                                                    className="rounded-lg px-5 py-2.5 border-none text-[11px] font-bold transition-all shadow-md shadow-slate-200"
                                                >
                                                    {printingId === s.id ? 'Generating...' : s.packageDetails?.labelFormat?.toLowerCase() === 'zpl' ? 'Download .zpl' : 'Reprint Label'}
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={(e) => { e.stopPropagation(); viewShipmentDetails(s.id); }} 
                                                    className="rounded-lg px-5 text-slate-400 hover:text-slate-600 font-bold"
                                                >
                                                    View Details
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}
    </div>
  );
};

export default History;
