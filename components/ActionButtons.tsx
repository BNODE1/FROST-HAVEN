
import React from 'react';
import { Axe, Flame, Fish, AlertCircle, Zap } from 'lucide-react';

interface ActionButtonsProps {
  manualGather: (type: 'WOOD' | 'FOOD') => void;
  manualStoke: (e: React.MouseEvent) => void;
  fireLevel: number;
  woodLow: boolean;
  foodLow: boolean;
  fireLow: boolean;
  combo: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ manualGather, manualStoke, fireLevel, woodLow, foodLow, fireLow, combo }) => {
  const isFever = combo > 3.0;
  
  return (
    <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 z-20 pointer-events-none">
       <button onClick={() => manualGather('WOOD')} className="pointer-events-auto flex flex-col items-center gap-1 group active:scale-90 transition-transform">
         <div className={`w-16 h-16 rounded-2xl bg-slate-900/80 backdrop-blur-md border flex items-center justify-center group-active:bg-emerald-900/50 shadow-lg transition-all relative duration-300 ${isFever ? 'border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.6)] animate-pulse' : woodLow ? 'border-red-500 animate-pulse' : 'border-emerald-500/30 group-hover:border-emerald-400/80'}`}>
            <Axe className={`transition-all ${isFever ? 'text-purple-300' : 'text-emerald-400'} group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]`} size={28} />
            {woodLow && <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><AlertCircle size={10} className="text-white"/></div>}
            {isFever && <div className="absolute inset-0 bg-purple-500/20 animate-ping rounded-2xl"></div>}
         </div>
         <span className={`text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur border tracking-wider ${woodLow ? 'bg-red-900/60 text-red-200 border-red-500/50' : 'text-emerald-300 bg-black/60 border-emerald-900/50'}`}>HARVEST</span>
       </button>

       <button onClick={manualStoke} className="pointer-events-auto flex flex-col items-center gap-1 group active:scale-95 transition-transform -mt-8">
          <div className={`w-20 h-20 rounded-full bg-slate-900/80 backdrop-blur-md border-2 flex items-center justify-center group-active:bg-orange-900/50 shadow-[0_0_30px_rgba(234,88,12,0.3)] transition-all relative ${fireLow ? 'border-red-500 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.6)]' : 'border-orange-500/50 group-hover:border-orange-400'}`}>
             <Flame className={`text-orange-500 ${fireLevel < 30 ? 'animate-pulse' : ''}`} size={40} fill="currentColor" />
             {fireLow && <div className="absolute -top-0 -right-0 bg-red-500 rounded-full p-1"><AlertCircle size={14} className="text-white"/></div>}
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur border tracking-wider ${fireLow ? 'bg-red-900/60 text-red-200 border-red-500/50' : 'text-orange-300 bg-black/60 border-orange-900/50'}`}>IGNITE</span>
       </button>

       <button onClick={() => manualGather('FOOD')} className="pointer-events-auto flex flex-col items-center gap-1 group active:scale-90 transition-transform">
         <div className={`w-16 h-16 rounded-2xl bg-slate-900/80 backdrop-blur-md border flex items-center justify-center group-active:bg-blue-900/50 shadow-lg transition-all relative duration-300 ${isFever ? 'border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.6)] animate-pulse' : foodLow ? 'border-red-500 animate-pulse' : 'border-blue-500/30 group-hover:border-blue-400/80'}`}>
            <Fish className={`transition-all ${isFever ? 'text-purple-300' : 'text-blue-400'} group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]`} size={28} />
            {foodLow && <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><AlertCircle size={10} className="text-white"/></div>}
            {isFever && <div className="absolute inset-0 bg-purple-500/20 animate-ping rounded-2xl"></div>}
         </div>
         <span className={`text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur border tracking-wider ${foodLow ? 'bg-red-900/60 text-red-200 border-red-500/50' : 'text-blue-300 bg-black/60 border-blue-900/50'}`}>GATHER</span>
       </button>
    </div>
  );
};
