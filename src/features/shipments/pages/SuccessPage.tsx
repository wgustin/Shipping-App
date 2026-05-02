
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Shipment } from '../../../shared/types';
import { printLabelPdf } from '../../../shared/utils/pdf';
import { useShipments } from '../context/ShipmentContext';
import { formatDate, getCarrierLogo } from '../../../shared/utils/formatters';
import { fulfillShipment } from '../../../services/apiService';

export const Success: React.FC = () => {
  const { lastShipment, shipments, refreshShipments } = useShipments();
  const navigate = useNavigate();
  const displayShipment = lastShipment || shipments[0];
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = async (e: React.MouseEvent) => {
    e.preventDefault();
    const labelUrl = displayShipment?.labelUrl;
    if (!labelUrl) return;

    setIsGeneratingPdf(true);
    try {
      await printLabelPdf(labelUrl, displayShipment?.packageDetails?.labelFormat, displayShipment?.packageDetails?.paperSize);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (displayShipment && (displayShipment.status === 'created' || displayShipment.status === 'processing')) {
      intervalId = setInterval(async () => {
        try {
          await fulfillShipment(displayShipment.id);
          await refreshShipments();
        } catch (e) {
          console.error("Error polling fulfillment:", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [displayShipment?.status, displayShipment?.id, refreshShipments]);

  if (!displayShipment) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">No recent shipments found.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-600 font-bold">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-4 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Label Ready!</h2>
            <p className="text-slate-500 text-xl">Your package is ready to ship.</p>
          </div>

          <div className="flex flex-col items-center gap-6">
              {displayShipment.labelUrl ? (
                <>
                  <button 
                    onClick={handlePrint}
                    disabled={isGeneratingPdf}
                    className={`inline-flex items-center px-8 py-4 text-xl font-bold rounded-full text-white shadow-xl transition-all ${isGeneratingPdf ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1 active:scale-[0.98] animate-pulse'}`}
                  >
                    {isGeneratingPdf ? 'Generating...' : displayShipment?.packageDetails?.labelFormat?.toLowerCase() === 'zpl' ? 'Download .zpl File' : 'Print Label Now'}
                  </button>
                </>
              ) : displayShipment.status === 'shipped' && !displayShipment.labelUrl ? (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-100 max-w-lg text-center">
                  <p className="font-bold mb-1">Label URL Missing</p>
                  <p className="text-sm">The label was purchased successfully, but the carrier did not return a printable URL. Please check your carrier dashboard.</p>
                </div>
              ) : displayShipment.status === 'error' || displayShipment.packageDetails?.lastError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 max-w-lg text-center">
                  <p className="font-bold mb-1">Error Generating Label</p>
                  <p className="text-sm">{displayShipment.packageDetails?.lastError || "An unknown error occurred during label generation."}</p>
                </div>
              ) : (
                <div className="inline-flex items-center px-8 py-4 text-xl font-bold rounded-full text-slate-500 bg-slate-100 border border-slate-200">
                  Label Processing...
                </div>
              )}
          </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-slate-50/50 p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <img 
                        src={getCarrierLogo(displayShipment.selectedRate?.carrier) || ''} 
                        alt={displayShipment.selectedRate?.carrier} 
                        className="h-full w-full object-contain" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                                const span = document.createElement('span');
                                span.className = 'text-xs font-bold uppercase text-slate-400';
                                span.innerText = displayShipment.selectedRate?.carrier || 'SHIP';
                                parent.appendChild(span);
                            }
                        }}
                      />
                  </div>
                  <div>
                      <p className="text-xs text-blue-600 uppercase font-black tracking-widest mb-1">Service</p>
                      <h3 className="font-extrabold text-slate-900 text-xl">
                        {(displayShipment.selectedRate?.serviceName || '').toUpperCase().startsWith((displayShipment.selectedRate?.carrier || '').toUpperCase())
                          ? displayShipment.selectedRate?.serviceName
                          : `${displayShipment.selectedRate?.carrier || ''} ${displayShipment.selectedRate?.serviceName || ''}`.trim()}
                      </h3>
                      <div className="mt-1 flex items-center gap-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase">
                              {displayShipment.selectedRate?.deliveryDays} {displayShipment.selectedRate?.deliveryDays === 1 ? 'day' : 'days'}
                          </span>
                          <span className="text-xs text-slate-500 font-bold">Est: {formatDate(displayShipment.selectedRate?.estimatedDeliveryDate || '')}</span>
                      </div>
                  </div>
              </div>
              <div className="text-center md:text-right">
                   <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Tracking Number</p>
                   <div className="font-mono text-lg font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg select-all">
                      {displayShipment.trackingNumber}
                   </div>
              </div>
          </div>

          <div className="p-4 md:p-6 grid md:grid-cols-2 gap-6 md:gap-8 relative">
              <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-slate-100"></div>
              <div className="space-y-4">
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">From</p>
                      <div className="pl-0">
                          <p className="font-bold text-slate-900 text-base">{displayShipment.fromAddress?.name}</p>
                          <p className="text-slate-500 text-sm leading-relaxed">
                              {displayShipment.fromAddress?.street1}<br/>
                              {displayShipment.fromAddress?.street2 && <>{displayShipment.fromAddress?.street2}<br/></>}
                              {displayShipment.fromAddress?.city}, {displayShipment.fromAddress?.state} {displayShipment.fromAddress?.zip}
                          </p>
                      </div>
                  </div>

                  <div>
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-tight mb-1">To Destination</p>
                      <div className="pl-0">
                          <p className="font-bold text-slate-900 text-base">{displayShipment.toAddress?.name}</p>
                          <p className="text-slate-500 text-sm leading-relaxed">
                              {displayShipment.toAddress?.street1}<br/>
                              {displayShipment.toAddress?.street2 && <>{displayShipment.toAddress?.street2}<br/></>}
                              {displayShipment.toAddress?.city}, {displayShipment.toAddress?.state} {displayShipment.toAddress?.zip}
                          </p>
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Package Details</p>
                      <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-3">
                          <div>
                              <p className="text-[10px] text-slate-500 mb-0.5">Dimensions</p>
                              <p className="font-bold text-slate-900 text-sm">{displayShipment.packageDetails?.length} x {displayShipment.packageDetails?.width} x {displayShipment.packageDetails?.height} {displayShipment.packageDetails?.unit}</p>
                          </div>
                          <div>
                              <p className="text-[10px] text-slate-500 mb-0.5">Weight</p>
                              <p className="font-bold text-slate-900 text-sm">{displayShipment.packageDetails?.weight} {displayShipment.packageDetails?.weightUnit}</p>
                          </div>
                      </div>
                  </div>

                  <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Summary</p>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center text-slate-500">
                              <span>Subtotal</span>
                              <span>${((displayShipment.selectedRate?.totalAmount || 0) + (displayShipment.selectedRate?.totalAmount || 0) * 0.15).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-green-600 font-medium">
                              <span>Poast Discount</span>
                              <span>-${((displayShipment.selectedRate?.totalAmount || 0) * 0.15).toFixed(2)}</span>
                          </div>
                          <div className="h-px bg-slate-100 my-2"></div>
                          <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900">Total Paid</span>
                              <span className="text-3xl font-black text-slate-900 tracking-tighter">${(displayShipment.selectedRate?.totalAmount || 0).toFixed(2)}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex justify-center gap-6 pt-4">
          <button onClick={() => navigate('/dashboard')} className="text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Return to Dashboard</button>
          <div className="w-px h-4 bg-slate-300 self-center"></div>
          <button onClick={() => navigate('/create')} className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors">Create Another Label</button>
      </div>
    </div>
  );
};

export default Success;
