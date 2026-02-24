
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shipment } from '../types';
import { voidShipment } from '../services/mockApiService';

interface ShipmentDetailsProps {
  shipment: Shipment;
  onBack: () => void;
  onUpdate: () => void;
}

export const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({ shipment, onBack, onUpdate }) => {
  const [isVoiding, setIsVoiding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleVoid = async () => {
    setIsVoiding(true);
    try {
        await voidShipment(shipment.id);
        onUpdate();
        setShowConfirm(false);
    } catch (e: any) {
        alert(e.message || "Failed to cancel label.");
    } finally {
        setIsVoiding(false);
    }
  };

  const getCarrierLogo = (carrier: string) => {
    const c = carrier.toUpperCase();
    if (c.includes('USPS')) return 'https://sitetesting.shiptronix.com/images/USPS%20Logo.png';
    if (c.includes('UPS')) return 'https://upload.wikimedia.org/wikipedia/commons/1/1b/UPS_logo_2014.svg';
    if (c.includes('FEDEX')) return 'https://upload.wikimedia.org/wikipedia/commons/9/9d/FedEx_Express_logo.svg';
    if (c.includes('DHL')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg';
    return null;
  };

  const isCancelled = shipment.status === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm uppercase tracking-widest transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Back to History
        </button>
        <div className="flex items-center gap-3">
            {isCancelled ? (
                <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-red-200">Label Cancelled</span>
            ) : (
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-green-200">Active Shipment</span>
            )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card title="Tracking & Carrier">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl p-2 flex items-center justify-center border border-slate-100">
                            <img src={getCarrierLogo(shipment.selectedRate.carrier) || ''} alt="" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div>
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">{shipment.selectedRate.carrier}</p>
                            <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{shipment.selectedRate.serviceName}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Created on {new Date(shipment.createdDate).toLocaleDateString()} at {new Date(shipment.createdDate).toLocaleTimeString()}</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto text-center sm:text-right bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">Tracking Number</p>
                        <p className="font-mono text-lg font-black text-slate-900 tracking-wider">{shipment.trackingNumber}</p>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card title="From">
                    <div className="text-sm space-y-1">
                        <p className="font-bold text-slate-900">{shipment.fromAddress.name}</p>
                        {shipment.fromAddress.company && <p className="text-xs text-blue-600 font-bold uppercase">{shipment.fromAddress.company}</p>}
                        <p className="text-slate-600">{shipment.fromAddress.street1}</p>
                        {shipment.fromAddress.street2 && <p className="text-slate-600">{shipment.fromAddress.street2}</p>}
                        <p className="text-slate-600">{shipment.fromAddress.city}, {shipment.fromAddress.state} {shipment.fromAddress.zip}</p>
                        <p className="text-xs text-slate-400 mt-2">{shipment.fromAddress.country}</p>
                    </div>
                </Card>
                <Card title="To">
                    <div className="text-sm space-y-1">
                        <p className="font-bold text-slate-900">{shipment.toAddress.name}</p>
                        {shipment.toAddress.company && <p className="text-xs text-blue-600 font-bold uppercase">{shipment.toAddress.company}</p>}
                        <p className="text-slate-600">{shipment.toAddress.street1}</p>
                        {shipment.toAddress.street2 && <p className="text-slate-600">{shipment.toAddress.street2}</p>}
                        <p className="text-slate-600">{shipment.toAddress.city}, {shipment.toAddress.state} {shipment.toAddress.zip}</p>
                        <p className="text-xs text-slate-400 mt-2">{shipment.toAddress.country}</p>
                    </div>
                </Card>
            </div>
        </div>

        <div className="space-y-6">
            <Card title="Cost & Package">
                <div className="space-y-4">
                    <div className="pb-4 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">${shipment.selectedRate.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Weight</span>
                            <span className="text-slate-900 font-bold">{shipment.packageDetails.weight} lb</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Dimensions</span>
                            <span className="text-slate-900 font-bold">{shipment.packageDetails.length}x{shipment.packageDetails.width}x{shipment.packageDetails.height} in</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="space-y-3">
                {!isCancelled && (
                    <Button 
                        className="w-full py-4 rounded-xl font-bold shadow-lg shadow-blue-100"
                        onClick={() => window.open(shipment.labelUrl, '_blank')}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Reprint Label
                    </Button>
                )}
                
                {!isCancelled && (
                    <div className="relative overflow-hidden transition-all duration-300 rounded-xl border border-slate-200">
                        {/* 
                          Stable container height approach: 
                          We use a fixed height and absolute positioning to swap content without shifting the card.
                        */}
                        <div className="h-[52px] w-full flex items-center justify-center">
                            {!showConfirm ? (
                                <button 
                                    className="w-full h-full font-bold text-red-600 hover:bg-red-50 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center animate-in fade-in"
                                    onClick={() => setShowConfirm(true)}
                                >
                                    Cancel Label / Void
                                </button>
                            ) : (
                                <div className="w-full h-full flex items-stretch animate-in slide-in-from-right-4 duration-300">
                                    <Button 
                                        variant="danger" 
                                        className="flex-1 rounded-none font-black uppercase text-[10px] tracking-widest border-r border-red-500/20"
                                        onClick={handleVoid}
                                        isLoading={isVoiding}
                                    >
                                        Void
                                    </Button>
                                    <button 
                                        className="flex-1 bg-white hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest text-slate-500 transition-colors"
                                        onClick={() => setShowConfirm(false)}
                                        disabled={isVoiding}
                                    >
                                        Keep
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
