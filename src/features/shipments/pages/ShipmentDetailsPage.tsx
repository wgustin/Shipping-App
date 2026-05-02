
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { AlertTriangle } from 'lucide-react';
import { Shipment } from '../../../shared/types';
import { voidShipment } from '../../../services/apiService';
import { getTrackingUrl } from '../../../shared/utils/tracking';
import { printLabelPdf } from '../../../shared/utils/pdf';

interface ShipmentDetailsProps {
  shipment: Shipment;
  onBack: () => void;
  onUpdate: () => void;
}

export const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({ shipment, onBack, onUpdate }) => {
  const [isVoiding, setIsVoiding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [voidConfirmText, setVoidConfirmText] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = async (e: React.MouseEvent) => {
    e.preventDefault();
    const labelUrl = shipment?.labelUrl;
    if (!labelUrl) return;

    setIsGeneratingPdf(true);
    try {
      await printLabelPdf(labelUrl, shipment?.packageDetails?.labelFormat, shipment?.packageDetails?.paperSize);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleVoid = async () => {
    if (voidConfirmText !== 'VOID') return;
    setIsVoiding(true);
    setVoidError(null);
    try {
        const carrierId = shipment.packageDetails?.carrierId;
        if (!carrierId) {
            throw new Error("Cannot cancel shipment: missing carrier ID.");
        }
        await voidShipment(shipment.id, carrierId);
        onUpdate();
        setShowConfirm(false);
        setVoidConfirmText('');
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setVoidError(message || "Failed to cancel label.");
    } finally {
        setIsVoiding(false);
    }
  };

  const getCarrierLogo = (carrier?: string) => {
    if (!carrier) return null;
    const c = carrier.toUpperCase();
    if (c.includes('USPS')) return '/usps.svg';
    if (c.includes('UPS')) return '/ups.svg';
    return null;
  };

  const isCancelled = shipment.status === 'cancelled';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm uppercase tracking-widest transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Back to History
        </button>
        <div className="flex items-center gap-3">
            {shipment.status === 'cancelled' && (
                <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-red-200">Label Cancelled</span>
            )}
            {shipment.status === 'processing' && (
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-blue-200 animate-pulse">Processing...</span>
            )}
            {shipment.status === 'created' && (
                <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-amber-200">Pending Payment</span>
            )}
            {shipment.status === 'shipped' && (
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-green-200">Active Shipment</span>
            )}
            {shipment.status === 'error' && (
                <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-red-200">Fulfillment Error</span>
            )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card title="Tracking & Carrier">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                            <img 
                                src={getCarrierLogo(shipment.selectedRate?.carrier) || ''} 
                                alt="" 
                                className="h-full w-full object-contain" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                        const span = document.createElement('span');
                                        span.className = 'text-xs font-bold uppercase text-slate-400';
                                        span.innerText = shipment.selectedRate?.carrier || 'SHIP';
                                        parent.appendChild(span);
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">{shipment.selectedRate?.carrier}</p>
                            <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{shipment.selectedRate?.serviceName}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Created on {new Date(shipment.createdDate).toLocaleDateString()} at {new Date(shipment.createdDate).toLocaleTimeString()}</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto text-center sm:text-right bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">Tracking Number</p>
                        <a 
                            href={getTrackingUrl(shipment.selectedRate?.carrier || '', shipment.trackingNumber || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-lg font-black text-slate-900 tracking-wider hover:text-blue-600 hover:underline"
                        >
                            {shipment.trackingNumber}
                        </a>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card title="From">
                    <div className="text-sm space-y-1">
                        <p className="font-bold text-slate-900">{shipment.fromAddress?.name}</p>
                        {shipment.fromAddress?.company && <p className="text-xs text-blue-600 font-bold uppercase">{shipment.fromAddress?.company}</p>}
                        <p className="text-slate-600">{shipment.fromAddress?.street1}</p>
                        {shipment.fromAddress?.street2 && <p className="text-slate-600">{shipment.fromAddress?.street2}</p>}
                        <p className="text-slate-600">{shipment.fromAddress?.city}, {shipment.fromAddress?.state} {shipment.fromAddress?.zip}</p>
                        <p className="text-xs text-slate-400 mt-2">{shipment.fromAddress?.country}</p>
                    </div>
                </Card>
                <Card title="To">
                    <div className="text-sm space-y-1">
                        <p className="font-bold text-slate-900">{shipment.toAddress?.name}</p>
                        {shipment.toAddress?.company && <p className="text-xs text-blue-600 font-bold uppercase">{shipment.toAddress?.company}</p>}
                        <p className="text-slate-600">{shipment.toAddress?.street1}</p>
                        {shipment.toAddress?.street2 && <p className="text-slate-600">{shipment.toAddress?.street2}</p>}
                        <p className="text-slate-600">{shipment.toAddress?.city}, {shipment.toAddress?.state} {shipment.toAddress?.zip}</p>
                        <p className="text-xs text-slate-400 mt-2">{shipment.toAddress?.country}</p>
                    </div>
                </Card>
            </div>
        </div>

        <div className="space-y-6">
            <Card title="Cost & Package">
                <div className="space-y-4">
                    <div className="pb-4 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">${shipment.selectedRate?.totalAmount?.toFixed(2)}</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Weight</span>
                            <span className="text-slate-900 font-bold">{shipment.packageDetails?.weight} lb</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Dimensions</span>
                            <span className="text-slate-900 font-bold">{shipment.packageDetails?.length}x{shipment.packageDetails?.width}x{shipment.packageDetails?.height} in</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="space-y-3">
                {!isCancelled && (
                    <Button 
                        className="w-full py-4 rounded-xl font-bold shadow-lg shadow-blue-100"
                        onClick={handlePrint}
                        disabled={isGeneratingPdf}
                    >
                        {isGeneratingPdf ? (
                            <svg className="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        )}
                        {isGeneratingPdf ? 'Generating...' : shipment?.packageDetails?.labelFormat?.toLowerCase() === 'zpl' ? 'Download .zpl File' : 'Reprint Label'}
                    </Button>
                )}
                
                {!isCancelled && (
                    <Button 
                        variant="outline"
                        className="w-full py-4 rounded-xl font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                        onClick={() => setShowConfirm(true)}
                    >
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Cancel Label / Void
                    </Button>
                )}
            </div>
        </div>
      </div>

      <Modal
          isOpen={showConfirm}
          onClose={() => !isVoiding && setShowConfirm(false)}
          title="Void Shipment Label"
      >
          <div className="space-y-6">
              {voidError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="text-red-500 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <p className="text-sm text-red-800 font-medium">{voidError}</p>
                  </div>
              )}
              <div className="flex items-start gap-4 p-5 bg-red-50/80 text-red-800 rounded-2xl border border-red-100 shadow-inner">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                      <h4 className="font-bold text-red-900 mb-1.5 text-lg">Are you absolutely sure?</h4>
                      <p className="text-sm text-red-700 leading-relaxed">
                          This action cannot be undone. The shipping label will be permanently invalidated and can no longer be used for shipping. You may be eligible for a refund depending on the carrier's policy.
                      </p>
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                      To confirm, type <span className="font-bold text-red-600 select-all">VOID</span> below:
                  </label>
                  <input
                      type="text"
                      value={voidConfirmText}
                      onChange={(e) => setVoidConfirmText(e.target.value)}
                      placeholder="VOID"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-center font-mono text-lg tracking-widest uppercase"
                      disabled={isVoiding}
                  />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button 
                      variant="outline" 
                      onClick={() => setShowConfirm(false)}
                      disabled={isVoiding}
                      className="rounded-xl px-6"
                  >
                      Keep Label
                  </Button>
                  <Button 
                      onClick={handleVoid}
                      disabled={isVoiding || voidConfirmText !== 'VOID'}
                      className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                      {isVoiding ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Voiding...
                          </>
                      ) : (
                          'Yes, Void Label'
                      )}
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default ShipmentDetails;
