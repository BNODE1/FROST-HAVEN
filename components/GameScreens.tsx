
import React from 'react';
import { GamePhase, GameState } from '../types';
import { Flame, Play, Snowflake, RotateCcw, RadioTower } from 'lucide-react';

interface GameScreensProps {
  phase: GamePhase;
  startGame: () => void;
  state: GameState;
}

export const GameScreens: React.FC<GameScreensProps> = ({ phase, startGame, state }) => {
  return (
    <>
      {phase === GamePhase.START && (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#020617_100%)]">
          <div className="w-24 h-24 mb-6 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.6)] animate-pulse border-4 border-blue-400/30">
            <Flame size={60} className="text-white" />
          </div>
          <h2 className="font-bebas text-7xl text-white mb-2 tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">FROST HAVEN</h2>
          <h3 className="font-bebas text-2xl text-blue-500 mb-8 tracking-[0.5em]">COLONY SURVIVAL</h3>
          <button 
             onClick={startGame}
             className="px-8 py-4 bg-white text-slate-950 font-bold tracking-widest rounded shadow-[0_0_20px_white] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
             <Play size={20} fill="currentColor" /> INITIALIZE
          </button>
        </div>
      )}
      
      {phase === GamePhase.GAME_OVER && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
             <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Snowflake size={40} className="text-red-500" />
             </div>
             <h2 className="font-bebas text-6xl text-red-500 mb-4 tracking-tighter">CRITICAL FAILURE</h2>
             <p className="text-red-200/60 mb-8 max-w-xs font-mono text-sm">The thermal core has failed. Colony life signs negative.</p>
             <div className="bg-slate-900 p-4 rounded mb-6 w-full max-w-xs border border-slate-800">
                 <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>DAYS SURVIVED</span>
                    <span className="text-white font-bold">{state.day}</span>
                 </div>
                 <div className="flex justify-between text-xs text-slate-400">
                    <span>TOTAL CLICKS</span>
                    <span className="text-white font-bold">{state.stats.clicks || 0}</span>
                 </div>
             </div>
             <button onClick={startGame} className="w-full max-w-xs py-4 bg-red-600 hover:bg-red-500 text-white font-bebas text-2xl tracking-widest rounded shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                   <RotateCcw size={20} /> REBOOT SYSTEM
             </button>
          </div>
       )}

       {phase === GamePhase.VICTORY && (
           <div className="absolute inset-0 z-50 bg-emerald-950/95 backdrop-blur flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
             <div className="w-24 h-24 bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                <RadioTower size={48} className="text-emerald-400" />
             </div>
             <h2 className="font-bebas text-6xl text-emerald-400 mb-4 tracking-tighter">SIGNAL LOCK</h2>
             <p className="text-emerald-100/70 mb-8 max-w-xs font-mono text-sm">Rescue dropships inbound. Coordinates confirmed. You have survived the whiteout.</p>
             <button onClick={startGame} className="w-full max-w-xs py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bebas text-2xl tracking-widest rounded shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02]">
                   NEW TIMELINE
             </button>
          </div>
       )}
    </>
  );
};
