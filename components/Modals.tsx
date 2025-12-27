
import React from 'react';
import { X, VolumeX, Volume2, Trash2, AlertTriangle, Loader2, Gift } from 'lucide-react';
import { ACHIEVEMENTS } from '../services/constants';
import { GameState } from '../types';

interface ModalsProps {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showAchievements: boolean;
  setShowAchievements: (v: boolean) => void;
  activeEvent: any | null;
  handleEventChoice: (choice: any) => void;
  loadingEvent: boolean;
  state: GameState;
  isMuted: boolean;
  toggleMute: () => void;
  storageService: any;
  onClaimAchievement?: (id: string) => void;
}

export const Modals: React.FC<ModalsProps> = ({ 
    showSettings, setShowSettings, showAchievements, setShowAchievements, 
    activeEvent, handleEventChoice, loadingEvent, state, isMuted, toggleMute, storageService, onClaimAchievement
}) => {
  return (
    <>
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/95 p-6 flex flex-col backdrop-blur-md animate-in fade-in">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bebas text-white tracking-wide">SYSTEM</h2>
              <button onClick={() => setShowSettings(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-white"><X size={24} /></button>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900 p-5 rounded-xl border border-slate-800">
                 <span className="font-bold text-slate-300">Audio Protocols</span>
                 <button onClick={toggleMute} className="p-3 bg-slate-800 rounded-full text-blue-500">
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                 </button>
              </div>
              <button onClick={() => { if(window.confirm("RESET?")) { storageService.clear(); window.location.reload(); }}} className="w-full flex items-center justify-center gap-3 bg-red-950/30 border border-red-900/50 text-red-500 p-5 rounded-xl font-bold hover:bg-red-900/20 transition-colors uppercase tracking-widest">
                 <Trash2 size={20} /> Purge Save Data
              </button>
           </div>
        </div>
      )}

      {showAchievements && (
        <div className="absolute inset-0 z-50 bg-black/95 p-6 flex flex-col backdrop-blur-md animate-in fade-in">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bebas text-yellow-500 tracking-wide">LOGS</h2>
              <button onClick={() => setShowAchievements(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-white"><X size={24} /></button>
           </div>
           <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {ACHIEVEMENTS.map(ach => {
                  const claimed = state.achievements.includes(ach.id);
                  const unlocked = state.unlockedAchievements.includes(ach.id);
                  const Icon = ach.icon;
                  
                  return (
                      <div key={ach.id} className={`flex items-center gap-4 p-4 rounded-xl border ${claimed ? 'bg-slate-900 border-yellow-500/50' : unlocked ? 'bg-slate-900 border-green-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                          <div className={`p-3 rounded-full ${claimed ? 'bg-yellow-500/20 text-yellow-400' : unlocked ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-slate-800 text-slate-600'}`}>
                              <Icon size={20} />
                          </div>
                          <div className="flex-1">
                              <h3 className={`font-bold ${claimed ? 'text-white' : unlocked ? 'text-green-200' : 'text-slate-400'}`}>{ach.title}</h3>
                              <p className="text-xs text-slate-500">{ach.description}</p>
                              {(unlocked || claimed) && <p className="text-[10px] text-yellow-500 mt-1 font-mono">{ach.reward.text}</p>}
                          </div>
                          
                          {unlocked && !claimed && onClaimAchievement && (
                              <button 
                                onClick={() => onClaimAchievement(ach.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded animate-bounce shadow-lg flex items-center gap-2"
                              >
                                <Gift size={14} /> CLAIM
                              </button>
                          )}
                          
                          {claimed && <div className="text-[10px] bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded font-mono border border-yellow-500/20">UNLOCKED</div>}
                      </div>
                  );
              })}
           </div>
        </div>
      )}

      {activeEvent && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 absolute top-0 left-0 right-0"></div>
              <div className="p-6">
                 <div className="flex items-center gap-3 mb-4 text-slate-400">
                    <AlertTriangle size={20} className="text-yellow-500 animate-pulse" />
                    <span className="text-xs font-mono tracking-widest uppercase">Anomaly Detected</span>
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2 font-bebas tracking-wide">{activeEvent.title}</h2>
                 <p className="text-sm text-slate-300 leading-relaxed mb-6">{activeEvent.scenario}</p>
                 
                 <div className="space-y-3">
                    {activeEvent.options.map((option: any, idx: number) => (
                       <button 
                          key={idx}
                          onClick={() => handleEventChoice(option)}
                          className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition-all active:scale-[0.98] group"
                       >
                          <div className="text-sm font-bold text-slate-200 group-hover:text-white">{option.text}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                             {option.rewards.wood ? <span className={option.rewards.wood > 0 ? "text-emerald-400" : "text-red-400"}>{option.rewards.wood > 0 ? '+' : ''}{option.rewards.wood} Wood</span> : null}
                             {option.rewards.food ? <span className={option.rewards.food > 0 ? "text-blue-400" : "text-red-400"}>{option.rewards.food > 0 ? '+' : ''}{option.rewards.food} Food</span> : null}
                          </div>
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {loadingEvent && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur px-6 py-3 rounded-full flex items-center gap-3 border border-slate-800 text-blue-300 shadow-xl">
               <Loader2 className="animate-spin" size={16} />
               <span className="text-xs font-mono font-bold tracking-widest">DECRYPTING SIGNAL...</span>
            </div>
        </div>
      )}
    </>
  );
};
