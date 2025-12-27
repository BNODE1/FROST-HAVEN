
import React from 'react';
import { GameState, UpgradeDef } from '../types';
import { Trees, Utensils, Flame, Search, AlertTriangle, Map, Home, RadioTower, Plus, Minus, ArrowUp, Lock, CheckCircle2, Plane, Rocket, Gem, Hammer, Skull } from 'lucide-react';
import { SHELTER_DATA, UPGRADE_DEFS, BEACON_COST, SCOUT_DURATION_BASE, FLARE_COST, ARTIFACT_DEFS, REPAIR_COST } from '../services/constants';

interface ControlPanelProps {
  state: GameState;
  activeTab: 'MANAGE' | 'BUILD';
  setActiveTab: (t: 'MANAGE' | 'BUILD') => void;
  assignWorker: (role: 'wood' | 'food' | 'fire', change: number) => void;
  sendScout: () => void;
  toggleScoutRisk: () => void;
  upgradeShelter: () => void;
  buildBeacon: () => void;
  buyUpgrade: (id: string) => void;
  idleSurvivors: number; // This prop from App.tsx might be stale, better recalculate or trust parent
  onEvacuate: () => void;
  onLaunchFlare: () => void;
  onRepairShelter: () => void;
}

const WorkerCard = ({ label, count, icon, onAdd, onRemove, canAdd }: { label: string, count: number, icon: any, onAdd: () => void, onRemove: () => void, canAdd: boolean }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 shadow-inner text-slate-300">
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">{label}</div>
        <div className="text-[10px] text-slate-500 font-mono">{count} ASSIGNED</div>
      </div>
    </div>
    <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
      <button 
        onClick={onRemove}
        disabled={count <= 0}
        className="w-8 h-8 flex items-center justify-center rounded bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-30 hover:text-white transition-colors"
      >
        <Minus size={14} />
      </button>
      <div className="w-8 text-center text-sm font-mono font-bold text-white">{count}</div>
      <button 
        onClick={onAdd}
        disabled={!canAdd}
        className="w-8 h-8 flex items-center justify-center rounded bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-30 hover:text-white transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state, activeTab, setActiveTab, assignWorker, sendScout, toggleScoutRisk, upgradeShelter, buildBeacon, buyUpgrade, idleSurvivors, onEvacuate, onLaunchFlare, onRepairShelter
}) => {
  // Recalculate true idle considering sickness
  const totalAssigned = state.workers.wood + state.workers.food + state.workers.fire + state.workers.scout;
  const healthySurvivors = state.survivors - state.sick;
  const trueIdle = Math.max(0, healthySurvivors - totalAssigned);

  return (
    <div className="flex-1 bg-slate-950 flex flex-col border-t border-slate-800/80 relative overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/30">
            <button 
                onClick={() => setActiveTab('MANAGE')}
                className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all relative ${activeTab === 'MANAGE' ? 'text-blue-300 bg-slate-800/50' : 'text-slate-600 hover:text-slate-400'}`}
            >
                Operations
                {activeTab === 'MANAGE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('BUILD')}
                className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all relative ${activeTab === 'BUILD' ? 'text-blue-300 bg-slate-800/50' : 'text-slate-600 hover:text-slate-400'}`}
            >
                Engineering
                {activeTab === 'BUILD' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar">
          {activeTab === 'MANAGE' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Crew Management</h3>
                        <div className="flex gap-2">
                            {state.sick > 0 && (
                                <span className="text-[10px] font-bold font-mono px-2 py-1 rounded bg-red-900/30 text-red-400 border border-red-500/20 flex items-center gap-1">
                                    <Skull size={10} /> {state.sick} SICK
                                </span>
                            )}
                            <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded ${trueIdle > 0 ? "bg-green-900/20 text-green-400 border border-green-500/20" : "bg-slate-900 text-slate-600"}`}>
                                {trueIdle} IDLE
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        <WorkerCard label="Scavengers" count={state.workers.wood} icon={<Trees size={16} className="text-emerald-400"/>} onAdd={() => assignWorker('wood', 1)} onRemove={() => assignWorker('wood', -1)} canAdd={trueIdle > 0} />
                        <WorkerCard label="Hunters" count={state.workers.food} icon={<Utensils size={16} className="text-blue-400"/>} onAdd={() => assignWorker('food', 1)} onRemove={() => assignWorker('food', -1)} canAdd={trueIdle > 0} />
                        <WorkerCard label="Techs" count={state.workers.fire} icon={<Flame size={16} className="text-orange-400"/>} onAdd={() => assignWorker('fire', 1)} onRemove={() => assignWorker('fire', -1)} canAdd={trueIdle > 0} />
                    </div>
                </div>

                <div className="h-px bg-slate-800 my-2"></div>

                {/* Expedition / Flare Section */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 shadow-sm relative overflow-hidden">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Expedition</h3>
                       <div className="flex items-center gap-2 mb-2">
                           <button onClick={toggleScoutRisk} className="flex-1 text-[9px] font-bold bg-slate-800 border border-slate-700 px-2 py-1 rounded hover:bg-slate-700 transition-colors">
                              RISK: <span className={`${state.scoutRisk === 'LOW' ? 'text-green-400' : state.scoutRisk === 'MED' ? 'text-yellow-400' : 'text-red-400'}`}>{state.scoutRisk}</span>
                           </button>
                       </div>
                       <button 
                            onClick={sendScout}
                            disabled={state.workers.scout > 0 || trueIdle <= 0}
                            className="w-full bg-slate-800 border border-purple-500/30 rounded-lg p-2 text-center hover:bg-purple-900/30 disabled:opacity-50 transition-all active:scale-95"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <Search size={18} className="text-purple-300" />
                                <span className="text-[10px] font-bold text-purple-100">{state.workers.scout > 0 ? `${Math.ceil(state.scoutTimer / 1000)}s` : "SEND (1 Crew)"}</span>
                            </div>
                        </button>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 shadow-sm relative overflow-hidden">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recruitment</h3>
                       <div className="text-[9px] text-slate-500 mb-2">Attract survivors</div>
                       <button 
                            onClick={onLaunchFlare}
                            disabled={state.signalTimer > 0 || state.wood < FLARE_COST}
                            className="w-full bg-slate-800 border border-red-500/30 rounded-lg p-2 text-center hover:bg-red-900/30 disabled:opacity-50 transition-all active:scale-95"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <Rocket size={18} className="text-red-300" />
                                <span className="text-[10px] font-bold text-red-100">{state.signalTimer > 0 ? `${Math.ceil(state.signalTimer / 1000)}s` : `FLARE (${FLARE_COST}W)`}</span>
                            </div>
                        </button>
                    </div>
                </div>

                {state.artifacts.length > 0 && (
                   <div className="mt-4">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recovered Artifacts</h3>
                      <div className="grid grid-cols-5 gap-2">
                          {state.artifacts.map(artId => {
                              const def = ARTIFACT_DEFS.find(a => a.id === artId);
                              if (!def) return null;
                              const Icon = def.icon;
                              return (
                                  <div key={artId} className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 shadow-sm group relative">
                                      <Icon size={16} className="text-purple-400" />
                                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 text-slate-200 text-xs p-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
                                          <div className="font-bold text-purple-300">{def.name}</div>
                                          <div className="text-[10px] text-slate-400">{def.description}</div>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                   </div>
                )}
              </div>
          ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 {/* Base Upgrade */}
                 <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-slate-800 opacity-20"><Home size={80} /></div>
                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <div>
                            <h4 className="font-bold text-slate-100 text-sm tracking-wide">Command Center</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Lvl {state.shelterLevel}: {SHELTER_DATA[state.shelterLevel as keyof typeof SHELTER_DATA].name}</p>
                        </div>
                        <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono border border-slate-700">
                            CAP: {SHELTER_DATA[state.shelterLevel as keyof typeof SHELTER_DATA].cap}
                        </div>
                    </div>
                    {state.shelterLevel < 5 ? (
                        <button 
                           onClick={upgradeShelter}
                           disabled={state.wood < (SHELTER_DATA[(state.shelterLevel + 1) as keyof typeof SHELTER_DATA]?.cost || 9999)}
                           className="w-full relative z-10 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-xs font-bold text-white transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:shadow-none active:scale-[0.98]"
                        >
                            <ArrowUp size={14} /> Upgrade Base ({SHELTER_DATA[(state.shelterLevel + 1) as keyof typeof SHELTER_DATA]?.cost} Mats)
                        </button>
                    ) : (
                        <div className="text-center text-xs font-bold text-blue-400 py-3 border border-blue-500/30 rounded bg-blue-500/10 uppercase tracking-widest">Max Level</div>
                    )}
                 </div>
                 
                 {/* Shelter Integrity & Repair */}
                 {state.shelterLevel > 1 && (
                     <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Structural Integrity</h4>
                             <span className={`${state.shelterHealth < 30 ? 'text-red-500 animate-pulse' : 'text-slate-400'} text-xs font-mono`}>{Math.floor(state.shelterHealth)}%</span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-800 rounded-full mb-2 overflow-hidden">
                             <div className={`h-full transition-all duration-300 ${state.shelterHealth > 50 ? 'bg-green-500' : state.shelterHealth > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${state.shelterHealth}%` }}></div>
                         </div>
                         <button 
                            onClick={onRepairShelter}
                            disabled={state.wood < REPAIR_COST || state.shelterHealth >= 100}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-slate-300 rounded border border-slate-700 flex items-center justify-center gap-2"
                         >
                             <Hammer size={12} /> REPAIR ({REPAIR_COST} Wood)
                         </button>
                     </div>
                 )}
                 
                 {/* Beacon (Endgame) */}
                 {state.shelterLevel >= 2 && (
                    <div className={`bg-gradient-to-br border rounded-xl p-4 relative overflow-hidden ${state.beaconProgress >= 100 ? 'from-green-950 to-slate-900 border-green-500/50' : 'from-slate-900 to-slate-900/50 border-green-900/30'}`}>
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <h4 className="font-bold text-green-400 text-sm flex items-center gap-2">Signal Beacon <RadioTower size={14} /></h4>
                                <p className="text-[10px] text-green-600/70">
                                    {state.beaconProgress >= 100 
                                      ? "RESCUE AVAILABLE. INITIATE EVAC?" 
                                      : "Establish communication. Warning: Storm damage."}
                                </p>
                            </div>
                            <div className="text-xs font-mono text-green-400 font-bold">{state.beaconProgress.toFixed(1)}%</div>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3 relative z-10">
                             <div className="bg-green-500 h-full transition-all duration-300 shadow-[0_0_10px_#22c55e]" style={{ width: `${Math.min(100, state.beaconProgress)}%` }}></div>
                        </div>
                        
                        {state.beaconProgress >= 100 ? (
                           <button 
                                onClick={onEvacuate}
                                className="w-full relative z-10 py-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse"
                           >
                               <Plane size={16} /> INITIATE EVACUATION
                           </button>
                        ) : (
                           <button 
                                onClick={buildBeacon}
                                disabled={state.beaconProgress >= 100 || state.wood < BEACON_COST.wood || state.food < BEACON_COST.food}
                                className="w-full relative z-10 py-2.5 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider flex items-center justify-center gap-2 bg-green-900/20 hover:bg-green-900/40 border border-green-600/30 text-green-300 disabled:opacity-50 disabled:border-slate-800 disabled:bg-slate-800"
                           >
                               Connect ({BEACON_COST.wood}M / {BEACON_COST.food}F)
                           </button>
                        )}
                    </div>
                 )}

                 <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 px-1">Tech Fabrication</h3>
                 <div className="grid grid-cols-1 gap-3">
                    {UPGRADE_DEFS.map(upgrade => {
                        const level = state.upgrades[upgrade.id] || 0;
                        const costWood = Math.floor(upgrade.baseCost.wood * Math.pow(upgrade.costMult, level));
                        const costFood = Math.floor(upgrade.baseCost.food * Math.pow(upgrade.costMult, level));
                        
                        const canAfford = state.wood >= costWood && state.food >= costFood;
                        const Icon = upgrade.icon;
                        
                        return (
                            <button 
                                key={upgrade.id}
                                disabled={!canAfford}
                                onClick={() => buyUpgrade(upgrade.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group active:scale-[0.98] ${
                                    canAfford
                                      ? 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800' 
                                      : 'bg-slate-900/50 border-slate-800/50 opacity-70'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${level > 0 ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-bold text-slate-200 uppercase tracking-wide group-hover:text-white transition-colors">{upgrade.name}</div>
                                            {level > 0 && <span className="text-[9px] font-bold bg-blue-900 text-blue-300 px-1.5 rounded border border-blue-700">LVL {level}</span>}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{upgrade.desc}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-right text-slate-400 font-mono leading-tight">
                                    <div className={state.wood >= costWood ? 'text-emerald-400' : 'text-red-400'}>{costWood} M</div>
                                    <div className={state.food >= costFood ? 'text-blue-400' : 'text-red-400'}>{costFood} R</div>
                                </div>
                            </button>
                        );
                    })}
                 </div>
              </div>
          )}
        </div>
    </div>
  );
};
