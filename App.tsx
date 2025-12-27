
import React, { useState, useEffect, useRef } from 'react';
import { Trees, Utensils, Users, Flame, Wind, Package, Sparkles, Star, Gem } from 'lucide-react';
import { GamePhase } from './types';
import GameCanvas from './components/GameCanvas';
import { generateSurvivalEvent } from './services/geminiService';
import { audioService } from './services/audioService';
import { storageService } from './services/storageService';
import { useGameLoop } from './hooks/useGameLoop';
import { ControlPanel } from './components/ControlPanel';
import { UPGRADE_DEFS, SHELTER_DATA, BEACON_COST, INITIAL_STATE, CRITICAL_CHANCE, FLARE_COST, ACHIEVEMENTS, ARTIFACT_DEFS, REPAIR_COST } from './services/constants';
import { HUD } from './components/HUD';
import { ActionButtons } from './components/ActionButtons';
import { Modals } from './components/Modals';
import { GameScreens } from './components/GameScreens';
import { Overlays } from './components/Overlays';

const StatDisplay = ({ icon, value, label, color, subValue, warning, rate }: { icon: any, value: string | number, label: string, color: string, subValue?: string, warning?: boolean, rate?: number }) => (
  <div className={`flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 border backdrop-blur-sm shadow-sm min-w-[70px] transition-colors ${warning ? 'border-red-500 bg-red-900/20' : 'border-slate-800'}`}>
    <div className={`mb-1 ${color}`}>{icon}</div>
    <div className={`text-sm font-bold ${color} leading-none`}>{value}</div>
    
    {rate !== undefined && (
        <div className={`text-[9px] font-mono mt-0.5 ${rate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {rate > 0 ? '+' : ''}{rate.toFixed(1)}/s
        </div>
    )}
    
    {subValue && !rate && <div className="text-[9px] text-slate-400 mt-0.5">{subValue}</div>}
    <div className="text-[8px] text-slate-600 font-bold tracking-widest mt-1 uppercase">{label}</div>
  </div>
);

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START);
  const [activeEvent, setActiveEvent] = useState<any | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeTab, setActiveTab] = useState<'MANAGE' | 'BUILD'>('MANAGE');

  const { state, setState, logs, setLogs, effects, addEffect, coldSnap } = useGameLoop(phase, setPhase, isMuted, activeEvent);
  
  const lastEventDayRef = useRef(0);

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };
  
  const showError = (e: React.MouseEvent | null, text: string) => {
      const x = e ? (e.clientX / window.innerWidth) * 100 : 50;
      const y = e ? (e.clientY / window.innerHeight) * 100 : 50;
      addEffect(text, x, y, "text-red-500 font-bold");
      vibrate();
  };

  const triggerAIEvent = async () => {
    setLoadingEvent(true);
    if (!isMuted) audioService.playEvent();
    await new Promise(r => setTimeout(r, 1000));
    try {
        const event = await generateSurvivalEvent(state.day, state.survivors);
        if (event) setActiveEvent(event);
        else throw new Error("No AI Response");
    } catch (e) {
        setActiveEvent({ title: "Signal Lost", scenario: "Atmospheric interference prevents data.", options: [{ text: "Wait", consequence: "Nothing happened.", rewards: {} }]});
    }
    setLoadingEvent(false);
  };

  useEffect(() => {
    if (phase === GamePhase.PLAYING && state.day > 1 && state.day % 4 === 0 && state.day !== lastEventDayRef.current) {
      triggerAIEvent();
      lastEventDayRef.current = state.day;
    }
  }, [state.day, phase]);

  useEffect(() => {
     if (phase === GamePhase.GAME_OVER || phase === GamePhase.VICTORY) {
         storageService.clear();
     }
  }, [phase]);

  const handleEventChoice = (choice: any) => {
    if (!isMuted) audioService.playClick();
    setState(prev => ({
      ...prev,
      wood: prev.wood + (choice.rewards.wood || 0),
      food: prev.food + (choice.rewards.food || 0),
      survivors: prev.survivors + (choice.rewards.survivors || 0),
      temperature: prev.temperature + (choice.rewards.tempBoost || 0),
      fireLevel: Math.min(150, Math.max(0, prev.fireLevel + (choice.rewards.fireLevel || 0)))
    }));
    setLogs(l => [`${choice.consequence}`, ...l.slice(0, 1)]);
    setActiveEvent(null);
  };

  const handleClaimAchievement = (id: string) => {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (!ach) return;
      if (!isMuted) audioService.playAchievement();
      setState(prev => ({
          ...prev,
          achievements: [...prev.achievements, id],
          wood: prev.wood + (ach.reward.wood || 0),
          food: prev.food + (ach.reward.food || 0)
      }));
      addEffect(ach.reward.text, 50, 50, "text-yellow-300 text-2xl font-black");
  };

  const assignWorker = (role: 'wood' | 'food' | 'fire', change: number) => {
    if (!isMuted) audioService.playClick();
    setState(prev => {
      const currentInRole = prev.workers[role];
      const idle = prev.survivors - (prev.workers.wood + prev.workers.food + prev.workers.fire + prev.workers.scout);
      if (change > 0 && idle <= 0) return prev;
      if (change < 0 && currentInRole <= 0) return prev;
      return { ...prev, workers: { ...prev.workers, [role]: currentInRole + change } };
    });
  };

  const sendScout = () => {
    if (state.workers.scout > 0) return; 
    const idle = state.survivors - (state.workers.wood + state.workers.food + state.workers.fire + state.workers.scout);
    if (idle > 0) {
      if (!isMuted) audioService.playClick();
      setLogs(l => [`Scout deployed (${state.scoutRisk} risk).`, ...l.slice(0,1)]);
      setState(prev => ({ ...prev, workers: { ...prev.workers, scout: 1 }, scoutTimer: 4000 }));
    }
  };

  const toggleScoutRisk = () => {
      setState(prev => {
          const risks: ('LOW' | 'MED' | 'HIGH')[] = ['LOW', 'MED', 'HIGH'];
          const idx = risks.indexOf(prev.scoutRisk);
          return { ...prev, scoutRisk: risks[(idx + 1) % risks.length] };
      })
  };
  
  const handleLaunchFlare = () => {
      if (state.wood >= FLARE_COST && state.signalTimer <= 0) {
          if (!isMuted) audioService.playCraft(); 
          addEffect("FLARE LAUNCHED", 50, 20, "text-red-400 font-bold");
          setState(prev => ({
              ...prev,
              wood: prev.wood - FLARE_COST,
              signalTimer: 8000
          }));
      } else {
          addEffect("NO WOOD", 50, 50, "text-red-500 font-black");
      }
  };

  const manualGather = (type: 'WOOD' | 'FOOD') => {
    vibrate();
    
    const isOverheat = state.fireLevel > 120;
    const overheatMult = isOverheat ? 1.5 : 1.0;
    const comboBoost = state.comboMultiplier;
    const hasLuckyCoin = state.artifacts.includes('LUCKY_COIN');
    const baseCritChance = (state.comboMultiplier > 4.0 ? CRITICAL_CHANCE * 2 : CRITICAL_CHANCE) * (hasLuckyCoin ? 2 : 1);
    
    let isCrit = Math.random() < baseCritChance;
    let critMult = isCrit ? 5 : 1;
    
    const isJackpot = Math.random() < 0.01;
    if (isJackpot) { critMult = 10; isCrit = true; }
    
    const pitch = 1 + ((state.comboMultiplier - 1) * 0.2);
    
    let missionUpdate: Partial<typeof state.activeMission> = {};
    if (state.activeMission && state.activeMission.type === 'CLICKS') {
        missionUpdate.current = state.activeMission.current + 1;
    }

    if (type === 'WOOD') {
      if (!isMuted) {
          if (isJackpot) audioService.playJackpot();
          else isCrit ? audioService.playUpgrade() : audioService.playGatherWood(pitch);
      }
      
      const level = state.upgrades['AXES'] || 0;
      const amount = (1 + (level * 0.5)) * comboBoost * critMult * overheatMult;
      
      let effectText = `+${amount.toFixed(1)}`;
      let effectColor = "text-emerald-400";
      
      if (isJackpot) { effectText = `JACKPOT! +${amount.toFixed(0)}`; effectColor = "text-yellow-400 text-3xl font-black"; } 
      else if (isCrit) { effectText = `CRIT! +${amount.toFixed(0)}`; effectColor = "text-yellow-300 text-2xl font-black"; }
      
      // Position Wood text LOWER (60-70%)
      addEffect(effectText, 20 + (Math.random() * 20 - 10), 65 + (Math.random() * 10 - 5), effectColor);
      
      setState(prev => ({ 
          ...prev, wood: prev.wood + amount, comboMultiplier: Math.min(5.0, prev.comboMultiplier + 0.1), comboTimer: 3000,
          stats: { ...prev.stats, clicks: (prev.stats.clicks || 0) + 1 },
          activeMission: prev.activeMission ? { ...prev.activeMission, ...missionUpdate } : null
      }));
    } else {
      if (!isMuted) {
          if (isJackpot) audioService.playJackpot();
          else isCrit ? audioService.playUpgrade() : audioService.playGatherFood(pitch);
      }
      
      const level = state.upgrades['TRAPS'] || 0;
      const amount = (1 + (level * 0.5)) * comboBoost * critMult * overheatMult;

      let effectText = `+${amount.toFixed(1)}`;
      let effectColor = "text-blue-400";

      if (isJackpot) { effectText = `JACKPOT! +${amount.toFixed(0)}`; effectColor = "text-yellow-400 text-3xl font-black"; } 
      else if (isCrit) { effectText = `CRIT! +${amount.toFixed(0)}`; effectColor = "text-yellow-300 text-2xl font-black"; }

      // Position Food text LOWER (60-70%)
      addEffect(effectText, 80 + (Math.random() * 20 - 10), 65 + (Math.random() * 10 - 5), effectColor);
      
      setState(prev => ({ 
          ...prev, food: prev.food + amount, comboMultiplier: Math.min(5.0, prev.comboMultiplier + 0.1), comboTimer: 3000,
          stats: { ...prev.stats, clicks: (prev.stats.clicks || 0) + 1 },
          activeMission: prev.activeMission ? { ...prev.activeMission, ...missionUpdate } : null
      }));
    }
  };

  const manualStoke = (e: React.MouseEvent) => {
    setState(prev => {
      let missionUpdate: Partial<typeof prev.activeMission> = {};
      if (prev.activeMission && prev.activeMission.type === 'CLICKS') {
          missionUpdate.current = prev.activeMission.current + 1;
      }
      
      if (prev.wood >= 5) {
        vibrate();
        if (!isMuted) audioService.playStoke();
        addEffect("FUEL ADDED", 50, 60 + (Math.random() * 10 - 5), "text-orange-500");
        const hasEverEmber = prev.artifacts.includes('EVER_EMBER');
        const stokeAmount = hasEverEmber ? 40 : 30;
        return { 
            ...prev, wood: prev.wood - 5, fireLevel: Math.min(150, prev.fireLevel + stokeAmount),
            activeMission: prev.activeMission ? { ...prev.activeMission, ...missionUpdate } : null
        };
      }
      showError(e, "NO FUEL");
      return prev;
    });
  };
  
  const repairShelter = () => {
      setState(prev => {
          if (prev.wood >= REPAIR_COST && prev.shelterHealth < 100) {
              if (!isMuted) audioService.playCraft();
              addEffect("+20 HP", 50, 60, "text-green-400 font-bold text-xl");
              return {
                  ...prev, wood: prev.wood - REPAIR_COST, shelterHealth: Math.min(100, prev.shelterHealth + 20)
              };
          }
          return prev;
      });
  };
  
  const collectSupplyDrop = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!state.supplyDrop) return;
      if (!isMuted) audioService.playCraft();
      const amt = 50 + Math.floor(Math.random() * 50);
      const isWood = state.supplyDrop.type === 'WOOD';
      addEffect(`+${amt} ${isWood ? 'Wood' : 'Food'}`, state.supplyDrop.x, state.supplyDrop.y, isWood ? "text-emerald-400" : "text-blue-400");
      setState(prev => ({
          ...prev, supplyDrop: null, wood: prev.wood + (isWood ? amt : 0), food: prev.food + (!isWood ? amt : 0)
      }));
  };

  const collectFireSpirit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!state.fireSpirit) return;
      if (!isMuted) audioService.playAchievement();
      addEffect("WARMTH RESTORED!", 50, 50, "text-yellow-400 text-3xl font-black");
      setState(prev => ({
          ...prev, fireSpirit: null, hypothermia: 0, temperature: Math.max(prev.temperature, 20), wood: prev.wood + 50
      }));
  };

  const collectGoldenSnowflake = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!state.goldenSnowflake) return;
      if (!isMuted) audioService.playJackpot();
      addEffect("GOLD RUSH!", 50, 40, "text-yellow-300 text-4xl font-black");
      setState(prev => ({
          ...prev, goldenSnowflake: null, wood: prev.wood + 200, food: prev.food + 200, score: prev.score + 1000
      }));
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADE_DEFS.find(u => u.id === upgradeId);
    if (!upgrade) return;
    const currentLevel = state.upgrades[upgradeId] || 0;
    const costWood = Math.floor(upgrade.baseCost.wood * Math.pow(upgrade.costMult, currentLevel));
    const costFood = Math.floor(upgrade.baseCost.food * Math.pow(upgrade.costMult, currentLevel));
    
    if (state.wood >= costWood && state.food >= costFood) {
        if (!isMuted) audioService.playCraft();
        addEffect("UPGRADE COMPLETE", 50, 50, "text-yellow-400");
        setState(prev => ({
            ...prev, wood: prev.wood - costWood, food: prev.food - costFood, upgrades: { ...prev.upgrades, [upgradeId]: currentLevel + 1 }
        }));
        setLogs(l => [`Upgraded ${upgrade.name} to Lv ${currentLevel + 1}`, ...l.slice(0,1)]);
    } else {
        addEffect("MISSING MATS", 50, 50, "text-red-500 font-bold");
    }
  };

  const upgradeShelter = () => {
    const cost = SHELTER_DATA[(state.shelterLevel + 1) as keyof typeof SHELTER_DATA]?.cost;
    if (state.shelterLevel < 5 && state.wood >= cost) {
      if (!isMuted) audioService.playUpgrade();
      addEffect("BASE EXPANDED", 50, 50, "text-indigo-400");
      setState(prev => ({
        ...prev, wood: prev.wood - cost, shelterLevel: prev.shelterLevel + 1
      }));
      setLogs(l => ["Base Expanded.", ...l.slice(0,1)]);
    } else {
      addEffect("MISSING MATS", 50, 50, "text-red-500 font-bold");
    }
  };

  const buildBeacon = () => {
      if (state.wood >= BEACON_COST.wood && state.food >= BEACON_COST.food) {
          if (!isMuted) audioService.playCraft();
          addEffect("+5% SIGNAL", 50, 50, "text-green-400");
          setState(prev => ({
              ...prev, wood: prev.wood - BEACON_COST.wood, food: prev.food - BEACON_COST.food, beaconProgress: prev.beaconProgress + 5 
          }));
      } else {
          addEffect("MISSING MATS", 50, 50, "text-red-500 font-bold");
      }
  };
  
  const handleEvacuate = () => {
      if (!isMuted) audioService.playAchievement();
      setPhase(GamePhase.VICTORY);
  };

  const startGame = () => {
    audioService.init();
    storageService.clear();
    setState(INITIAL_STATE);
    setPhase(GamePhase.PLAYING);
  };

  const toggleMute = () => setIsMuted(audioService.toggleMute());
  
  const idleSurvivors = state.survivors - (state.workers.wood + state.workers.food + state.workers.fire + state.workers.scout);
  const shelterCap = SHELTER_DATA[state.shelterLevel as keyof typeof SHELTER_DATA].cap;
  const freezeOpacity = Math.min(1, Math.max(0, -state.temperature / 40));

  // Rate calculations
  const isOverheat = state.fireLevel > 120;
  const isOverload = state.comboMultiplier >= (state.artifacts.includes('CHRONO_SHARD') ? 4.0 : 4.8);
  const overheatMult = isOverheat ? 1.5 : 1.0;
  
  // Blizzard penalty for gathering
  const blizzardPenalty = state.isBlizzard ? 0.5 : 1.0;
  
  const woodMult = (1 + ((state.upgrades['AXES'] || 0) * 0.2)) * overheatMult * blizzardPenalty;
  const foodMult = (1 + ((state.upgrades['TRAPS'] || 0) * 0.2)) * overheatMult * blizzardPenalty;
  
  const overloadBonus = isOverload ? 5.0 : 0;
  const woodGain = (state.workers.wood * 0.8 * woodMult) + overloadBonus;
  const fireConsumption = (state.workers.fire * 0.5); 
  const netWoodRate = woodGain - fireConsumption;
  const foodGain = (state.workers.food * 0.8 * foodMult) + overloadBonus;
  const foodConsumption = (state.survivors * 0.25);
  const netFoodRate = foodGain - foodConsumption;
  const time = state.timeOfDay;
  const isNight = time < 20 || time > 80;
  let fireDecayBase = coldSnap ? 15 : (state.isBlizzard ? 7 : (isNight ? 4.5 : 2.5));
  if (state.artifacts.includes('FROZEN_HEART')) fireDecayBase *= 0.85;
  const effectiveFireWorkers = state.wood > 0 ? state.workers.fire : 0;
  const fireGain = effectiveFireWorkers * (state.artifacts.includes('EVER_EMBER') ? 6.0 : 5.0);
  const netFireRate = fireGain - fireDecayBase;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 text-slate-100 overflow-hidden shadow-2xl font-sans relative select-none border-x border-slate-800">
      
      <Overlays freezeOpacity={freezeOpacity} coldSnap={coldSnap} />

      <HUD 
        state={state} 
        coldSnap={coldSnap} 
        showAchievements={showAchievements} 
        setShowAchievements={setShowAchievements} 
        showSettings={showSettings} 
        setShowSettings={setShowSettings} 
      />
      
      <div className="absolute top-28 left-0 right-0 z-20 pointer-events-none flex flex-col items-center gap-1">
         {logs.slice(0, 2).map((log, i) => (
             <div key={i} className={`text-[10px] bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-blue-500/30 text-blue-100/90 font-mono shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 opacity-${100 - (i*30)}`}>
                 {log}
             </div>
         ))}
      </div>

      <div className="relative flex-shrink-0 z-0">
        <GameCanvas state={state} effects={effects} onRepair={repairShelter} />
        
        {state.supplyDrop && (
            <div 
               className="absolute z-40 animate-bounce cursor-pointer"
               style={{ left: `${state.supplyDrop.x}%`, top: `${state.supplyDrop.y}%` }}
               onClick={collectSupplyDrop}
            >
                <div className="relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white/50"><Wind size={16} /></div>
                    <div className="bg-orange-500 p-2 rounded shadow-[0_0_15px_rgba(249,115,22,0.6)] border border-white/20 hover:scale-110 transition-transform">
                        <Package size={24} className="text-white" />
                    </div>
                </div>
            </div>
        )}

        {state.fireSpirit && (
             <div 
               className="absolute z-50 cursor-pointer animate-pulse"
               style={{ left: `${state.fireSpirit.x}%`, top: `${state.fireSpirit.y}%` }}
               onClick={collectFireSpirit}
             >
                <div className="relative group">
                    <div className="absolute inset-0 bg-yellow-500 blur-md rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-yellow-400 p-2 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.8)] border-2 border-white hover:scale-125 transition-transform duration-100">
                        <Sparkles size={24} className="text-yellow-900 animate-spin-slow" />
                    </div>
                </div>
             </div>
        )}
        
        {state.goldenSnowflake && (
             <div 
               className="absolute z-50 cursor-pointer animate-bounce"
               style={{ left: `${state.goldenSnowflake.x}%`, top: `${state.goldenSnowflake.y}%` }}
               onClick={collectGoldenSnowflake}
             >
                <div className="relative group hover:scale-125 transition-transform">
                    <div className="absolute inset-0 bg-yellow-300 blur-lg rounded-full animate-pulse opacity-90"></div>
                    <div className="relative">
                        <Gem size={32} className="text-yellow-200 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)] fill-yellow-500" />
                    </div>
                </div>
             </div>
        )}

        <ActionButtons 
            manualGather={manualGather} 
            manualStoke={manualStoke} 
            fireLevel={state.fireLevel} 
            woodLow={state.wood < 10}
            foodLow={state.food < 10}
            fireLow={state.fireLevel < 20}
            combo={state.comboMultiplier}
        />
      </div>

      <div className="flex-none bg-slate-950 border-t border-slate-800">
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900/50 backdrop-blur-md">
          <StatDisplay icon={<Trees size={14}/>} value={Math.floor(state.wood)} label="MATS" color="text-emerald-400" rate={netWoodRate} />
          <StatDisplay icon={<Utensils size={14}/>} value={Math.floor(state.food)} label="RATIONS" color="text-blue-400" rate={netFoodRate} />
          <StatDisplay icon={<Users size={14}/>} value={`${state.survivors}/${shelterCap}`} label="CREW" color={state.survivors >= shelterCap ? "text-red-400" : "text-white"} warning={state.hypothermia > 50} />
          <StatDisplay icon={<Flame size={14}/>} value={`${Math.floor(state.fireLevel)}%`} label={isOverheat ? "OVERHEAT" : "CORE"} color={isOverheat ? "text-red-400 animate-pulse font-black" : "text-orange-500"} warning={state.fireLevel < 20} rate={netFireRate} />
        </div>
      </div>

      <ControlPanel 
        state={state}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        assignWorker={assignWorker}
        sendScout={sendScout}
        toggleScoutRisk={toggleScoutRisk}
        upgradeShelter={upgradeShelter}
        buildBeacon={buildBeacon}
        buyUpgrade={buyUpgrade}
        idleSurvivors={idleSurvivors}
        onEvacuate={handleEvacuate}
        onLaunchFlare={handleLaunchFlare}
        onRepairShelter={repairShelter}
      />

      <Modals 
        showSettings={showSettings} 
        setShowSettings={setShowSettings} 
        showAchievements={showAchievements} 
        setShowAchievements={setShowAchievements} 
        activeEvent={activeEvent} 
        handleEventChoice={handleEventChoice} 
        loadingEvent={loadingEvent} 
        state={state} 
        isMuted={isMuted} 
        toggleMute={toggleMute} 
        storageService={storageService} 
        onClaimAchievement={handleClaimAchievement}
      />

      <GameScreens phase={phase} startGame={startGame} state={state} />
    </div>
  );
};

export default App;
