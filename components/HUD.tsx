
import React from 'react';
import { Trophy, Settings, Thermometer, Zap, RadioTower, CheckCircle2 } from 'lucide-react';
import { GameState } from '../types';

interface HUDProps {
  state: GameState;
  coldSnap: boolean;
  showAchievements: boolean;
  setShowAchievements: (v: boolean) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({ state, coldSnap, showAchievements, setShowAchievements, showSettings, setShowSettings }) => {
  const hasUnclaimed = state.unlockedAchievements.filter(id => !state.achievements.includes(id)).length > 0;
  const comboProgress = Math.min(100, (state.comboTimer / 3000) * 100);
  const isOverload = state.comboMultiplier > 4.8;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-slate-950/90 to-transparent flex justify-between items-start pointer-events-none">
         <div className="flex flex-col pointer-events-auto">
            <h1 className="font-bebas text-4xl tracking-tight text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] leading-none">FROST HAVEN</h1>
            <div className="flex flex-col gap-2 mt-1">
               <div className="flex items-center gap-2">
                   <div className="bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-blue-300 border border-blue-900/50 font-mono tracking-widest">
                     SOL {state.day}
                   </div>
                   {state.comboMultiplier > 1.2 && (
                      <div className={`relative overflow-hidden px-2 py-0.5 rounded border flex items-center gap-1 transition-colors duration-300 ${isOverload ? 'bg-purple-600 border-purple-400 shadow-[0_0_10px_#a855f7]' : state.comboMultiplier > 3.0 ? 'bg-purple-900/40 border-purple-500/50' : 'bg-orange-500/20 border-orange-500/50'}`}>
                          <div className={`relative z-10 flex items-center gap-1 text-[10px] font-mono font-bold animate-pulse ${isOverload ? 'text-white' : state.comboMultiplier > 3.0 ? 'text-purple-300' : 'text-orange-400'}`}>
                             <Zap size={10} className={isOverload ? 'fill-white' : ''} /> {state.comboMultiplier.toFixed(1)}x {isOverload ? 'OVERLOAD!' : state.comboMultiplier > 3.0 ? 'FEVER' : 'HEAT'}
                          </div>
                          <div className={`absolute bottom-0 left-0 h-0.5 transition-all duration-100 ease-linear ${state.comboMultiplier > 3.0 ? 'bg-purple-400' : 'bg-orange-400'}`} style={{ width: `${comboProgress}%` }}></div>
                      </div>
                   )}
                   {state.beaconProgress >= 100 && (
                       <div className="bg-green-500/20 px-2 py-0.5 rounded text-[10px] text-green-400 border border-green-500/50 font-mono font-bold animate-pulse flex items-center gap-1">
                          <RadioTower size={10} /> RESCUE READY
                       </div>
                   )}
               </div>

               {/* Active Mission Display */}
               {state.activeMission && (
                   <div className="bg-slate-900/90 border border-yellow-500/30 rounded-lg p-2 max-w-[200px] animate-in slide-in-from-left-4 fade-in duration-300">
                       <div className="flex items-center justify-between text-[9px] text-yellow-500 uppercase font-bold mb-1 tracking-widest">
                           <span>Emergency Order</span>
                           <span>{Math.ceil(state.activeMission.timeLeft / 5)}s</span>
                       </div>
                       <div className="text-[10px] text-white font-bold leading-tight mb-1">{state.activeMission.description}</div>
                       <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-yellow-400 transition-all duration-200" style={{ width: `${Math.min(100, (state.activeMission.current / state.activeMission.target) * 100)}%` }}></div>
                       </div>
                   </div>
               )}
            </div>
            
            {/* Hypothermia Warning in Header */}
            {state.hypothermia > 0 && (
               <div className="mt-2 w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 relative">
                  <div 
                    className={`h-full transition-all duration-300 ${state.hypothermia > 50 ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} 
                    style={{ width: `${state.hypothermia}%` }}
                  ></div>
               </div>
            )}
            {state.hypothermia > 0 && <div className="text-[9px] text-blue-300 font-mono mt-0.5 tracking-wider">HYPOTHERMIA RISK: {Math.floor(state.hypothermia)}%</div>}
         </div>
         <div className="flex flex-col items-end gap-2 pointer-events-auto">
             <div className="flex gap-2">
                <button 
                  onClick={() => setShowAchievements(!showAchievements)} 
                  className={`relative p-2 rounded-lg backdrop-blur transition-all duration-300 ${
                     hasUnclaimed 
                        ? 'bg-yellow-900/80 border border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse' 
                        : 'bg-slate-900/80 border border-slate-800 hover:border-slate-600 text-slate-500 hover:text-white'
                  }`}
                >
                   <Trophy size={18} />
                   {hasUnclaimed && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce shadow-sm"></span>}
                </button>
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-800 hover:border-slate-600 text-slate-500 hover:text-white transition-colors">
                   <Settings size={18} />
                </button>
             </div>
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur border shadow-lg font-mono ${state.temperature < 0 ? 'bg-blue-950/80 border-blue-500/50 text-blue-300' : 'bg-orange-950/80 border-orange-500/50 text-orange-300'} ${coldSnap ? 'animate-bounce border-cyan-400 text-cyan-200 bg-cyan-900/80' : ''}`}>
                  <Thermometer size={16} />
                  <span className="font-bold">{state.temperature.toFixed(1)}°C</span>
             </div>
         </div>
      </div>
  );
};
