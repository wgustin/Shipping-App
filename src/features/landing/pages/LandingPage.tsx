import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, ArrowRight, Box, Truck, MapPin, Zap, Shield } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900">
      
      {/* Hero Section - Dense & High Impact */}
      <section className="pt-2 pb-4 sm:pt-4 sm:pb-6 lg:pt-6 lg:pb-10 px-4 sm:px-6 lg:px-8 max-w-[80rem] mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-2 sm:gap-8 lg:gap-12">
          
          {/* Hero Text */}
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs sm:text-sm font-bold mb-4 sm:mb-6 border border-teal-100">
              <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
              Commercial rates for everyone
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] sm:leading-[1.1] tracking-tight mb-4 sm:mb-6">
              Welcome to the <br className="hidden sm:block" />
              <span className="text-teal-700">POAST</span> Office.
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto md:mx-0 font-medium">
              The modern delivery solution that lets you compare rates, print your label and save big from wherever you are.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl shadow-lg shadow-teal-900/10 bg-teal-800 hover:bg-teal-900 text-white font-bold">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <div className="text-xs sm:text-sm text-slate-500 font-bold flex items-center gap-2 px-2 mt-2 sm:mt-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                Pay only when you ship
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 w-full max-w-sm sm:max-w-lg lg:max-w-none mx-auto relative mt-0">
            <img 
              src="/PST_0001_PoastLaunch_01.webp" 
              alt="Poast Launch" 
              className="w-full h-auto max-h-[280px] sm:max-h-[400px] lg:max-h-[500px] object-contain"
            />
          </div>

        </div>
      </section>

      {/* Compact Logos Section */}
      <section className="py-4 sm:py-6 border-y border-slate-100 bg-slate-50">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 lg:gap-24 opacity-60 grayscale">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Supported Carriers</span>
          <div className="flex items-center justify-center gap-6 sm:gap-12 lg:gap-24 flex-wrap">
            <img src="/usps.svg" alt="USPS" className="h-8 sm:h-10 lg:h-12 w-auto object-contain" />
            <img src="/ups.svg" alt="UPS" className="h-8 sm:h-10 lg:h-12 w-auto object-contain" />
            <img src="/fedex.svg" alt="FedEx" className="h-8 sm:h-10 lg:h-12 w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* Features Section - Alternating Rows with Image Background Colors */}
      <section className="w-full flex flex-col">

        {/* Feature 1: Box (Background: #ffffff) */}
        <div className="w-full bg-[#ffffff]">
          <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12 lg:gap-20">
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-700 shadow-sm border border-teal-100 flex-shrink-0">
                  <Box className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Don’t ship it. POAST it.</h3>
              </div>
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed mb-6">Compare carrier rates, pick, print and go! From your couch, car, or cubical.</p>
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-teal-800 text-white hover:bg-teal-900 py-5 sm:py-6 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-md">
                Print Your Label
              </Button>
            </div>
            <div className="flex-1 w-full flex justify-center items-center">
              <img 
                src="/PST_0001_PoastLaunch_02.webp" 
                alt="Poast Box"
                className="w-full max-w-[280px] sm:max-w-[400px] h-auto max-h-[300px] sm:max-h-[400px] object-contain" 
              />
            </div>
          </div>
        </div>

        {/* Feature 2: Bag (Background: #dad5cf) */}
        <div className="w-full bg-[#dad5cf]">
          <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24 flex flex-col md:flex-row-reverse items-center gap-6 sm:gap-8 md:gap-12 lg:gap-20">
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/50 rounded-xl flex items-center justify-center text-orange-700 shadow-sm border border-white/60 flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Shipping sucks. POAST delivers.</h3>
              </div>
              <p className="text-base sm:text-lg text-slate-800 font-medium leading-relaxed mb-6">No more finding a location to wait in line. You can drop it off or schedule a pickup. Whichever you choose, POAST delivers.</p>
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-orange-700 text-white hover:bg-orange-800 py-5 sm:py-6 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-md">
                Compare Carriers
              </Button>
            </div>
            <div className="flex-1 w-full flex justify-center items-center">
              <img 
                src="/PST_0001_PoastLaunch_03.webp" 
                alt="Poast Bag"
                className="w-full max-w-[320px] sm:max-w-[440px] h-auto max-h-[300px] sm:max-h-[400px] object-contain" 
              />
            </div>
          </div>
        </div>

        {/* Feature 3: Truck (Background: #f8f7f2) */}
        <div className="w-full bg-[#f8f7f2]">
          <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24 flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12 lg:gap-20">
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-200 flex-shrink-0">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Tracking you can trust.</h3>
              </div>
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed mb-6">One dashboard with everything you need. No app, no subscription, no nonsense.</p>
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-blue-600 text-white hover:bg-blue-700 py-5 sm:py-6 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-md">
                See Dashboard
              </Button>
            </div>
            <div className="flex-1 w-full flex justify-center md:justify-start items-center">
              <img 
                src="/PST_0001_PoastLaunch_04.webp" 
                alt="Poast Truck"
                className="w-full max-w-[380px] sm:max-w-[560px] h-auto max-h-[340px] sm:max-h-[480px] object-contain md:-ml-12" 
              />
            </div>
          </div>
        </div>

        {/* Feature 4: AI Smart Paste */}
        <div className="w-full bg-white py-8 sm:py-10 lg:py-16">
          <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-teal-900 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-8 sm:gap-10 text-white shadow-2xl shadow-teal-900/20">
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-teal-300 border border-teal-700 shadow-inner flex-shrink-0">
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">AI "Smart Paste" & Memory</h3>
                </div>
                <p className="text-base sm:text-lg text-teal-100 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">Copy a messy address from an email and paste it. Our AI extracts and standardizes it perfectly. Plus, we save every address you ship to for instant one-click labels next time.</p>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 w-full">
                 <div className="bg-teal-800/50 rounded-2xl p-5 sm:p-6 border border-teal-700/50 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5 flex-1">
                   <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400 flex-shrink-0" />
                   <div>
                     <h4 className="font-bold text-base sm:text-lg">Zero Monthly Fees</h4>
                     <p className="text-sm sm:text-base text-teal-200 mt-1">Only pay for the labels you buy.</p>
                   </div>
                 </div>
                 <div className="bg-teal-800/50 rounded-2xl p-5 sm:p-6 border border-teal-700/50 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5 flex-1">
                   <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400 flex-shrink-0" />
                   <div>
                     <h4 className="font-bold text-base sm:text-lg">Instant Access</h4>
                     <p className="text-sm sm:text-base text-teal-200 mt-1">Print your first label in 60 seconds.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Compact CTA Section */}
      <section className="pb-8 sm:pb-10 lg:pb-16 px-4 sm:px-6 lg:px-8 max-w-[80rem] mx-auto w-full">
        <div className="bg-slate-50 rounded-3xl sm:rounded-[2.5rem] border border-slate-200 py-8 sm:py-10 lg:py-12 px-6 sm:px-12 lg:px-16 flex flex-col md:flex-row items-center gap-8 lg:gap-12 overflow-hidden">
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 sm:mb-6 tracking-tight">Join the POAST revolution.</h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8 sm:mb-10 max-w-2xl font-medium">Save time, money and stress. Compare carrier rates, pick, print and go! From your couch, car, or cubicle.</p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Button size="lg" onClick={() => navigate('/signup')} className="w-full sm:w-auto bg-teal-800 text-white hover:bg-teal-900 py-5 sm:py-6 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-md">
                Give It a Try
              </Button>
              <Button size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 py-5 sm:py-6 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-md">
                Log In
              </Button>
            </div>
            <p className="mt-6 sm:mt-8 text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">No commitment • No credit card required</p>
          </div>
          <div className="flex-1 w-full max-w-[300px] sm:max-w-[400px] md:max-w-none">
            <img 
              src="/PST_0001_PoastLaunch_05.webp" 
              alt="Poast Launch" 
              className="w-full h-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
};

export default Landing;
