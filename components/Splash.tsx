
import React from 'react';

interface SplashProps {
  onConnect: () => void;
}

const Splash: React.FC<SplashProps> = ({ onConnect }) => {
  return (
    <div className="h-screen w-screen bg-black text-cyan-500 flex flex-col items-center justify-center relative overflow-hidden font-mono">
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1534363261880-08e48d3db9f9?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0"></div>
      
      <div className="z-10 text-center max-w-2xl px-8">
        <h1 className="text-5xl md:text-6xl font-bold mb-2 tracking-tighter text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
          MECH ARENA MANAGER
        </h1>
        <h2 className="text-xl md:text-2xl text-cyan-500 tracking-[0.3em] uppercase mb-12">
          Architect's Protocol
        </h2>

        <div className="border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
          <p className="text-slate-300 mb-6 text-sm leading-relaxed">
            Welcome, Architect. Access to the simulation network requires a valid Neural Link Key (Gemini API). 
            This allows for real-time visual rendering and combat narrative analysis.
          </p>

          <button 
            onClick={onConnect}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105"
          >
            Establish Link
          </button>
          
          <div className="mt-6 text-xs text-slate-500">
            <p>Access requires a paid GCP project key.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-cyan-600 hover:text-cyan-400 underline">
              View Billing Documentation
            </a>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-[10px] text-slate-700 uppercase tracking-widest">
        System Version 1.0.4 // Gemini-3 Ready
      </div>
    </div>
  );
};

export default Splash;
