
import { Axe, Fish, Snowflake, Footprints, Shield, Zap, Users, Box, Gem, Compass, Clock, ThermometerSnowflake } from 'lucide-react';
import { GameState, UpgradeDef, Achievement, ArtifactDef } from '../types';
import { Flame, Wind, Map, RadioTower } from 'lucide-react';

export const INITIAL_STATE: GameState = {
  wood: 15,
  food: 15,
  survivors: 3,
  sick: 0,
  temperature: 10,
  fireLevel: 100,
  day: 1,
  timeOfDay: 30, 
  isBlizzard: false,
  isMeteorShower: false,
  wolvesActive: false,
  score: 0,
  shelterLevel: 1,
  shelterHealth: 100,
  workers: { wood: 0, food: 0, fire: 0, scout: 0 },
  scoutTimer: 0,
  scoutRisk: 'MED',
  stats: {
    totalWoodGathered: 0,
    totalFoodGathered: 0,
    maxSurvivors: 3,
    daysSurvived: 0,
    clicks: 0
  },
  achievements: [],
  unlockedAchievements: [],
  upgrades: {
    'AXES': 0,
    'TRAPS': 0,
    'COATS': 0,
    'SHOES': 0
  },
  beaconProgress: 0,
  comboMultiplier: 1.0,
  comboTimer: 0,
  signalTimer: 0,
  supplyDrop: null,
  fireSpirit: null,
  goldenSnowflake: null,
  hypothermia: 0,
  activeMission: null,
  artifacts: []
};

export const SHELTER_DATA = {
  1: { cost: 0, cap: 3, name: "Campfire" },
  2: { cost: 100, cap: 6, name: "Outpost" },
  3: { cost: 350, cap: 12, name: "Colony" },
  4: { cost: 1000, cap: 25, name: "Fortress" },
  5: { cost: 5000, cap: 50, name: "Citadel" }
};

export const UPGRADE_DEFS: UpgradeDef[] = [
  { id: 'AXES', name: 'Nano-Axes', desc: '+20% Wood Gathering per level', baseCost: { wood: 50, food: 25 }, costMult: 1.8, icon: Axe },
  { id: 'TRAPS', name: 'Synth-Snares', desc: '+20% Food Gathering per level', baseCost: { wood: 25, food: 50 }, costMult: 1.8, icon: Fish },
  { id: 'COATS', name: 'Thermal Weave', desc: '+1°C Insulation per level', baseCost: { wood: 100, food: 100 }, costMult: 2.2, icon: Snowflake },
  { id: 'SHOES', name: 'Grav-Boots', desc: 'Scouts return 15% faster per level', baseCost: { wood: 60, food: 40 }, costMult: 1.5, icon: Footprints },
];

export const ARTIFACT_DEFS: ArtifactDef[] = [
  { id: 'FROZEN_HEART', name: 'Frozen Heart', description: 'Fire decays 15% slower.', icon: ThermometerSnowflake, effect: () => ({}) },
  { id: 'ANCIENT_MAP', name: 'Ancient Map', description: 'Scouts are 30% faster.', icon: Compass, effect: () => ({}) },
  { id: 'CHRONO_SHARD', name: 'Chrono Shard', description: 'Overload activates at 4.0x combo.', icon: Clock, effect: () => ({}) },
  { id: 'EVER_EMBER', name: 'Ever Ember', description: 'Stoking fire is 20% more effective.', icon: Flame, effect: () => ({}) },
  { id: 'LUCKY_COIN', name: 'Old Coin', description: 'Critical hit chance doubled.', icon: Gem, effect: () => ({}) }
];

export const BEACON_COST = { wood: 50, food: 30 }; 
export const FLARE_COST = 60; // Wood to launch flare
export const REPAIR_COST = 20; // Wood per repair click
export const CRITICAL_CHANCE = 0.05; // 5% chance for 5x drop

export const ACHIEVEMENTS: Achievement[] = [
  { 
    id: 'FIRST_FLAME', title: 'Ignition', description: 'Stoke the fire above 110%.', 
    icon: Flame, condition: (s) => s.fireLevel > 110, reward: { text: '+25 Wood', wood: 25 }
  },
  { 
    id: 'SURVIVOR_5', title: 'Endurance', description: 'Survive 5 days.', 
    icon: Wind, condition: (s) => s.day >= 5, reward: { text: '+50 Food', food: 50 }
  },
  { 
    id: 'SCOUT', title: 'Recon', description: 'Send a scout out.', 
    icon: Map, condition: (s) => s.workers.scout > 0, reward: { text: '+30 Food', food: 30 }
  },
  { 
    id: 'BEACON_START', title: 'Hope', description: 'Start the Beacon.', 
    icon: RadioTower, condition: (s) => s.beaconProgress > 0, reward: { text: '+100 Wood', wood: 100 }
  },
  {
    id: 'HOARDER', title: 'Stockpile', description: 'Have 500 Wood at once.',
    icon: Box, condition: (s) => s.wood >= 500, reward: { text: '+50 Food', food: 50 }
  },
  {
    id: 'POPULATION', title: 'Community', description: 'Reach 10 Survivors.',
    icon: Users, condition: (s) => s.survivors >= 10, reward: { text: '+200 Wood', wood: 200 }
  },
  {
    id: 'MAX_FIRE', title: 'Inferno', description: 'Reach 150% Fire Level.',
    icon: Zap, condition: (s) => s.fireLevel >= 149, reward: { text: '+100 Wood', wood: 100 }
  }
];

export const TICK_RATE = 200; // ms
export const TICKS_PER_SEC = 1000 / TICK_RATE;
export const DAY_DURATION_TICKS = 300; 
export const SCOUT_DURATION_BASE = 4000;
