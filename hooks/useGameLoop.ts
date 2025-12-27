
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GamePhase, VisualEffect, AIEventResponse, Mission } from '../types';
import { INITIAL_STATE, TICKS_PER_SEC, DAY_DURATION_TICKS, SHELTER_DATA, ACHIEVEMENTS, CRITICAL_CHANCE, ARTIFACT_DEFS } from '../services/constants';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';

export const useGameLoop = (
  phase: GamePhase, 
  setPhase: (p: GamePhase) => void,
  isMuted: boolean,
  activeEvent: AIEventResponse | null
) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [logs, setLogs] = useState<string[]>(["System Online. Awaiting Orders."]);
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  
  // Cold Snap State (Local to loop)
  const [coldSnap, setColdSnap] = useState(false);
  
  // Load save
  useEffect(() => {
    const saved = storageService.load();
    if (saved) {
      setState(prev => ({
        ...prev,
        ...saved,
        workers: { ...prev.workers, scout: 0, ...saved.workers }, 
        stats: { ...prev.stats, ...saved.stats || INITIAL_STATE.stats },
        achievements: saved.achievements || [],
        unlockedAchievements: saved.unlockedAchievements || [],
        upgrades: saved.upgrades || INITIAL_STATE.upgrades,
        comboMultiplier: 1.0,
        comboTimer: 0,
        signalTimer: 0,
        supplyDrop: null,
        fireSpirit: null,
        goldenSnowflake: null,
        hypothermia: saved.hypothermia || 0,
        activeMission: saved.activeMission || null,
        artifacts: saved.artifacts || [],
        shelterHealth: saved.shelterHealth !== undefined ? saved.shelterHealth : 100,
        sick: saved.sick || 0,
        isMeteorShower: false,
        wolvesActive: false
      }));
      setPhase(saved.survivors > 0 ? (saved.beaconProgress >= 100 && phase === GamePhase.VICTORY ? GamePhase.VICTORY : GamePhase.PLAYING) : GamePhase.GAME_OVER);
    }
  }, []);

  // Save loop
  useEffect(() => {
    if (phase !== GamePhase.PLAYING) return;
    const saveInterval = setInterval(() => storageService.save(state), 5000);
    return () => clearInterval(saveInterval);
  }, [state, phase]);

  // Main Ticker
  useEffect(() => {
    if (phase !== GamePhase.PLAYING || !!activeEvent) return;

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.survivors <= 0) {
            setPhase(GamePhase.GAME_OVER);
            return prev;
        }

        let newTime = prev.timeOfDay + (100 / DAY_DURATION_TICKS);
        let newDay = prev.day;
        let dayBreakBonus = false;

        if (newTime >= 100) {
           newTime = 0;
           newDay += 1;
           dayBreakBonus = true;
        }

        const isNight = newTime < 20 || newTime > 80;
        
        // --- Multipliers ---
        const hasFrozenHeart = prev.artifacts.includes('FROZEN_HEART');
        const hasAncientMap = prev.artifacts.includes('ANCIENT_MAP');
        const hasChronoShard = prev.artifacts.includes('CHRONO_SHARD');
        const hasEverEmber = prev.artifacts.includes('EVER_EMBER');

        const isOverheat = prev.fireLevel > 120;
        const overheatMult = isOverheat ? 1.5 : 1.0;
        
        // Blizzard Penalty (New Difficulty)
        const blizzardPenalty = prev.isBlizzard ? 0.5 : 1.0;

        const woodMult = (1 + ((prev.upgrades['AXES'] || 0) * 0.2)) * overheatMult * blizzardPenalty;
        const foodMult = (1 + ((prev.upgrades['TRAPS'] || 0) * 0.2)) * overheatMult * blizzardPenalty;
        const insulationBonus = (prev.upgrades['COATS'] || 0) * 2.0;
        const scoutSpeedMult = (1 + ((prev.upgrades['SHOES'] || 0) * 0.15)) * (hasAncientMap ? 1.3 : 1.0);

        // --- Resource Generation ---
        const woodGain = (prev.workers.wood * 0.8 * woodMult) / TICKS_PER_SEC;
        const foodGain = (prev.workers.food * 0.8 * foodMult) / TICKS_PER_SEC;
        
        const overloadThresh = hasChronoShard ? 4.0 : 4.8;
        const isOverload = prev.comboMultiplier >= overloadThresh;
        const overloadBonus = isOverload ? 1 : 0; 

        if (isOverload && Math.random() < 0.2) {
             addEffect("OVERLOAD!", 50 + (Math.random()*20-10), 40 + (Math.random()*20-10), "text-purple-400 font-bold");
        }

        // Fire & Temperature
        const effectiveFireWorkers = prev.wood > 0 ? prev.workers.fire : 0;
        const fireWorkerWoodCost = (effectiveFireWorkers * 0.5) / TICKS_PER_SEC;
        const fireWorkerHeatGen = (effectiveFireWorkers * (hasEverEmber ? 6.0 : 5.0)) / TICKS_PER_SEC;

        // Visual Popups (Localized - Adjusted Y to 65% to avoid healthbar)
        if (Math.random() < 0.05) {
          if (prev.workers.wood > 0) {
             const val = (woodGain * TICKS_PER_SEC).toFixed(0);
             addEffect(`+${val}`, 20 + (Math.random() * 20 - 10), 65 + (Math.random() * 10 - 5), "text-emerald-400"); // Left side
             if (!isMuted && Math.random() > 0.8) audioService.playGatherWood();
          }
          if (prev.workers.food > 0) {
             const val = (foodGain * TICKS_PER_SEC).toFixed(0);
             addEffect(`+${val}`, 80 + (Math.random() * 20 - 10), 65 + (Math.random() * 10 - 5), "text-blue-400"); // Right side
          }
        }

        let fireDecayBase = coldSnap ? 15 : (prev.isBlizzard ? 8 : (isNight ? 5.0 : 2.5)); 
        if (hasFrozenHeart) fireDecayBase *= 0.85; 

        const fireDecayTick = fireDecayBase / TICKS_PER_SEC;
        const newFire = Math.min(150, Math.max(0, prev.fireLevel - fireDecayTick + fireWorkerHeatGen));
        
        // Shelter Integrity
        let newShelterHealth = prev.shelterHealth;
        const decayChance = prev.isBlizzard ? 0.3 : (isNight ? 0.1 : 0.02); 
        if (Math.random() < decayChance) {
            newShelterHealth = Math.max(0, newShelterHealth - 0.5);
        }
        
        // Meteor Shower Logic
        let meteorActive = prev.isMeteorShower;
        if (!meteorActive && prev.day > 3 && Math.random() < (1 / (90 * TICKS_PER_SEC))) {
            meteorActive = true;
            setLogs(l => ["⚠️ METEOR SHOWER INBOUND!", ...l.slice(0,1)]); 
            addEffect("☄️ METEORS", 50, 30, "text-red-500 font-black text-3xl");
            if (!isMuted) audioService.playEvent();
        }
        if (meteorActive && Math.random() < (1 / (15 * TICKS_PER_SEC))) {
            meteorActive = false;
        }
        if (meteorActive && Math.random() < 0.2 && Math.random() < 0.3) {
            const dmg = 15;
            newShelterHealth = Math.max(0, newShelterHealth - dmg);
            addEffect(`-${dmg} HP`, 50, 60, "text-red-500 font-bold text-xl");
            if (!isMuted) audioService.playClick();
        }

        // Temperature Formula
        const globalCooling = Math.floor(prev.day / 2) * 0.8;
        const baseTemp = (coldSnap ? -80 : (prev.isBlizzard ? -60 : (isNight ? -40 : -15))) - globalCooling;
        const shelterEfficiency = Math.max(0.1, newShelterHealth / 100);
        const shelterHeat = ((prev.shelterLevel - 1) * 5) * shelterEfficiency;
        const fireHeat = newFire / 2.0;
        const targetTemp = baseTemp + shelterHeat + fireHeat + insulationBonus;
        const inertia = coldSnap ? 0.2 : 0.05;
        const newTemp = prev.temperature + (targetTemp - prev.temperature) * inertia;

        // Challenge: Scaling Hunger
        const hungerScaling = 1 + (prev.day * 0.05); // 5% more food per day
        const foodConsumed = ((prev.survivors * 0.25) * hungerScaling) / TICKS_PER_SEC; 
        let finalFood = Math.max(0, prev.food + foodGain + overloadBonus - foodConsumed);
        let finalWood = Math.max(0, prev.wood + woodGain + overloadBonus - fireWorkerWoodCost);

        // Challenge: Wolf Attacks
        let wolvesActive = false;
        let deathOccurred = false;
        let newSick = prev.sick;
        let newSurvivors = prev.survivors;
        let newWorkers = { ...prev.workers };

        if (isNight && newFire < 30 && prev.day > 2) {
             wolvesActive = true;
             // Wood workers act as guards
             const guards = prev.workers.wood;
             const dangerLevel = Math.max(0, 10 - guards); 
             
             if (Math.random() < 0.1) {
                 finalWood = Math.max(0, finalWood - 5);
                 addEffect("-5 Wood", 20, 50, "text-red-400 font-bold");
             }

             if (dangerLevel > 0 && Math.random() < (dangerLevel * 0.005)) {
                 newSurvivors--;
                 deathOccurred = true;
                 setLogs(l => ["🐺 Wolf attack! Guard required!", ...l.slice(0,1)]);
                 addEffect("KILLED BY WOLVES", 50, 50, "text-red-600 font-black");
             }
        }
        
        // Challenge: Frostbite Retreat (Workers abandon posts if too cold)
        if (newTemp < -20 && Math.random() < 0.02) {
            // Pick a random job to fail
            const jobs: ('wood'|'food'|'fire')[] = ['wood', 'food', 'fire'];
            const job = jobs[Math.floor(Math.random() * 3)];
            if (newWorkers[job] > 0) {
                newWorkers[job]--;
                setLogs(l => ["Worker abandoned post due to cold!", ...l.slice(0,1)]);
                addEffect("TOO COLD!", 50, 50, "text-blue-200 font-bold");
            }
        }

        // Sickness
        if (newTemp < 5) {
            const sickChance = (5 - newTemp) * 0.0005; 
            const healthySurvivors = prev.survivors - prev.sick;
            if (healthySurvivors > 0 && Math.random() < sickChance) {
                newSick++;
                addEffect("SICKNESS!", 50, 50, "text-yellow-600 font-bold");
                setLogs(l => ["Crew member ill.", ...l.slice(0,1)]);
            }
        }

        if (newTemp > 15 && newSick > 0) {
            const recoverChance = (newTemp - 15) * 0.001; 
            if (Math.random() < recoverChance) {
                newSick--;
                addEffect("RECOVERED", 50, 50, "text-green-400 font-bold");
            }
        }

        if (newSick > 0 && Math.random() < 0.0005) {
            newSick--; newSurvivors--; deathOccurred = true;
            addEffect("💀 SUCCUMBED", 50, 50, "text-red-700 font-black");
        }

        // Night Raid
        if (isNight && !wolvesActive && newFire < 40 && prev.day > 2 && Math.random() < (0.5 / TICKS_PER_SEC)) {
            const stolenFood = Math.min(finalFood, Math.floor(Math.random() * 40 + 10));
            finalFood -= stolenFood;
            newShelterHealth = Math.max(0, newShelterHealth - 10);
            addEffect("RAID!", 50, 50, "text-red-600 font-black text-2xl");
            addEffect("-10 HP", 50, 60, "text-red-500 font-bold");
            
            if (newSurvivors > 1 && Math.random() < 0.1) {
                newSurvivors--;
                deathOccurred = true;
                setLogs(l => ["Survivor taken by shadows.", ...l.slice(0,1)]);
            }
        }

        if (dayBreakBonus) {
            const bonus = 10 + (newDay * 2);
            finalWood += bonus;
            setLogs(l => [`Day ${newDay}. +${bonus} Wood.`, ...l.slice(0,1)]);
            addEffect(`DAY ${newDay}`, 50, 40, "text-yellow-200 text-3xl font-black");
            if (!isMuted) audioService.playAchievement();
        }

        // Missions
        let newMission = prev.activeMission;
        if (!newMission && Math.random() < (1 / (15 * TICKS_PER_SEC))) {
             const roll = Math.random();
             let type: any = 'GATHER_WOOD';
             let desc = "";
             let target = 0;
             let dur = 30; 
             
             if (roll < 0.33) {
                 type = 'GATHER_WOOD'; target = 100 + (prev.day * 10); desc = `Gather ${target} Wood`;
             } else if (roll < 0.66) {
                 type = 'GATHER_FOOD'; target = 100 + (prev.day * 10); desc = `Gather ${target} Food`;
             } else {
                 type = 'CLICKS'; target = 30; desc = `Manual Actions: ${target}`; dur = 15;
             }
             
             newMission = {
                 id: Date.now().toString(), type, description: desc, target, current: 0, timeLeft: dur * 5, 
                 reward: { text: "SUPPLIES", wood: 150, food: 150 }
             };
             if (!isMuted) audioService.playEvent();
             setLogs(l => [`Order: ${desc}`, ...l.slice(0,1)]);
        }

        if (newMission) {
            newMission.timeLeft -= 1;
            if (newMission.type === 'GATHER_WOOD') newMission.current += woodGain;
            if (newMission.type === 'GATHER_FOOD') newMission.current += foodGain;

            if (newMission.current >= newMission.target) {
                finalWood += (newMission.reward.wood || 0); finalFood += (newMission.reward.food || 0);
                addEffect("MISSION COMPLETE", 50, 40, "text-yellow-300 text-2xl font-black");
                newMission = null;
            } else if (newMission.timeLeft <= 0) {
                setLogs(l => ["Mission Failed.", ...l.slice(0,1)]); newMission = null;
            }
        }

        let newCombo = prev.comboMultiplier;
        let newComboTimer = prev.comboTimer;
        if (newComboTimer > 0) { newComboTimer -= (1000 / TICKS_PER_SEC); } 
        else if (newCombo > 1.0) { newCombo = Math.max(1.0, newCombo - 0.1); }

        // Scout logic
        let newScoutTimer = prev.scoutTimer;
        let scoutReturned = false;
        if (prev.workers.scout > 0) {
          newScoutTimer -= (1000 / TICKS_PER_SEC) * scoutSpeedMult; 
          if (newScoutTimer <= 0) scoutReturned = true;
        }

        // Beacon / Signal
        let newBeaconProgress = prev.beaconProgress;
        if (prev.isBlizzard && newBeaconProgress > 0) newBeaconProgress = Math.max(0, newBeaconProgress - (0.2 / TICKS_PER_SEC));
        let newSignalTimer = prev.signalTimer > 0 ? prev.signalTimer - (1000/TICKS_PER_SEC) : 0;
        let flareResolved = prev.signalTimer > 0 && newSignalTimer <= 0;

        if (flareResolved) {
             const cap = SHELTER_DATA[prev.shelterLevel as keyof typeof SHELTER_DATA].cap;
             if (Math.random() < 0.5 && newSurvivors < cap) {
                 newSurvivors++;
                 setLogs(l => ["Flare success! +1 Survivor", ...l.slice(0,1)]);
                 addEffect("RECRUITED", 50, 30, "text-white text-2xl font-black");
             } else {
                 setLogs(l => ["Flare failed.", ...l.slice(0,1)]);
             }
        }

        let sWood = finalWood;
        let sFood = finalFood;
        let newArtifacts = [...prev.artifacts];

        if (scoutReturned) {
           newScoutTimer = 0;
           const risk = prev.scoutRisk || 'MED';
           const roll = Math.random();
           let deathChance = 0.1; let findChance = 0.7; let rewardMult = 1 + (prev.day * 0.1);
           if (risk === 'LOW') { deathChance = 0.02; findChance = 0.5; rewardMult *= 0.6; }
           if (risk === 'HIGH') { deathChance = 0.25; findChance = 0.85; rewardMult *= 2.0; }

           if (roll < deathChance) {
             setLogs(l => ["Scout died.", ...l.slice(0,1)]);
             newSurvivors--; 
             deathOccurred = true;
             addEffect("SCOUT LOST", 50, 50, "text-red-500 font-bold");
           } else if (roll < findChance) {
             const possibleArtifacts = ARTIFACT_DEFS.filter(a => !newArtifacts.includes(a.id));
             // Scouts find artifacts
             if (possibleArtifacts.length > 0 && Math.random() < (risk === 'HIGH' ? 0.3 : 0.05)) {
                 const art = possibleArtifacts[Math.floor(Math.random() * possibleArtifacts.length)];
                 newArtifacts.push(art.id);
                 setLogs(l => [`Scout found ${art.name}!`, ...l.slice(0,1)]);
                 addEffect(`ARTIFACT!`, 50, 40, "text-purple-400 text-2xl font-black");
                 if (!isMuted) audioService.playAchievement();
             } else {
                 // Standard loot
                 const typeRoll = Math.random();
                 if (typeRoll < 0.5) {
                     const amt = Math.floor((Math.random() * 80 + 30) * rewardMult);
                     sWood += amt;
                     setLogs(l => [`Scout found ${amt} Wood.`, ...l.slice(0,1)]);
                 } else {
                     const amt = Math.floor((Math.random() * 80 + 30) * rewardMult);
                     sFood += amt;
                     setLogs(l => [`Scout found ${amt} Food.`, ...l.slice(0,1)]);
                 }
             }
           } else {
             setLogs(l => ["Scout found nothing.", ...l.slice(0,1)]);
           }
        }

        // Death checks
        let newHypothermia = prev.hypothermia;
        if (newTemp < 6) { newHypothermia = Math.min(100, newHypothermia + 0.3); } 
        else { newHypothermia = Math.max(0, newHypothermia - 4.0); }

        if (newHypothermia >= 100) {
             newSurvivors--; deathOccurred = true; newHypothermia = 0;
             setLogs(l => ["FROZEN TO DEATH", ...l.slice(0,1)]);
             addEffect("💀 FROZEN", 50, 50, "text-red-600 text-3xl font-black");
        }

        // Force workers to match population (Handles deaths or re-assignments)
        if (prev.workers.scout > 0 && scoutReturned) newWorkers.scout = 0;
        const healthySurvivors = newSurvivors - newSick;
        const totalAssigned = newWorkers.wood + newWorkers.food + newWorkers.fire + newWorkers.scout;
        if (totalAssigned > healthySurvivors) {
             let toRemove = totalAssigned - healthySurvivors;
             while (toRemove > 0) {
                 if (!wolvesActive && newWorkers.wood > 0) { newWorkers.wood--; toRemove--; }
                 else if (newWorkers.food > 0) { newWorkers.food--; toRemove--; }
                 else if (newWorkers.fire > 0) { newWorkers.fire--; toRemove--; }
                 else if (wolvesActive && newWorkers.wood > 0) { newWorkers.wood--; toRemove--; } // Remove guards last if wolves active
                 else if (newWorkers.scout > 0) { newWorkers.scout--; toRemove--; }
                 else break;
             }
        }

        if (deathOccurred && !isMuted) audioService.playDeath();

        return {
          ...prev,
          wood: sWood, food: sFood, fireLevel: newFire, temperature: newTemp,
          survivors: Math.max(0, newSurvivors), workers: newWorkers,
          isMeteorShower: meteorActive,
          wolvesActive: wolvesActive,
          shelterHealth: newShelterHealth,
          sick: Math.min(newSick, newSurvivors),
          hypothermia: newHypothermia,
          comboMultiplier: newCombo, comboTimer: newComboTimer,
          scoutTimer: newScoutTimer, signalTimer: newSignalTimer,
          beaconProgress: newBeaconProgress,
          day: newDay, timeOfDay: newTime,
          activeMission: newMission,
          artifacts: newArtifacts,
          isBlizzard: prev.isBlizzard
        };
      });
    }, 200); 

    return () => clearInterval(interval);
  }, [phase, activeEvent, isMuted, coldSnap]); 

  const addEffect = useCallback((text: string, x: number, y: number, color: string) => {
    const id = Date.now() + Math.random();
    setEffects(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== id));
    }, 800);
  }, []);

  return { state, setState, logs, setLogs, effects, addEffect, coldSnap };
};
