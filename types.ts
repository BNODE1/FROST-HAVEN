
export enum GamePhase {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface GameState {
  wood: number;
  food: number;
  survivors: number;
  sick: number; 
  temperature: number;
  fireLevel: number;
  day: number;
  timeOfDay: number; // 0 to 100
  isBlizzard: boolean;
  isMeteorShower: boolean;
  wolvesActive: boolean; // New Threat
  score: number;
  
  shelterLevel: number;
  shelterHealth: number; // 0 to 100
  workers: {
    wood: number;
    food: number;
    fire: number;
    scout: number;
  };
  
  scoutTimer: number;
  scoutRisk: 'LOW' | 'MED' | 'HIGH';

  stats: {
    totalWoodGathered: number;
    totalFoodGathered: number;
    maxSurvivors: number;
    daysSurvived: number;
    clicks: number;
  };
  
  achievements: string[]; 
  unlockedAchievements: string[]; 
  upgrades: Record<string, number>; 
  
  beaconProgress: number;
  
  // Active Play features
  comboMultiplier: number;
  comboTimer: number;
  
  // New Features
  signalTimer: number; 
  supplyDrop: { id: number; x: number; y: number; type: 'WOOD' | 'FOOD' } | null;
  fireSpirit: { id: number; x: number; y: number } | null; 
  goldenSnowflake: { id: number; x: number; y: number; vx: number; vy: number } | null; 
  hypothermia: number; 

  // Engagement Features
  activeMission: Mission | null;
  artifacts: string[]; 
}

export interface Mission {
  id: string;
  description: string;
  type: 'GATHER_WOOD' | 'GATHER_FOOD' | 'CLICKS' | 'SURVIVE';
  target: number;
  current: number;
  timeLeft: number; 
  reward: { text: string; wood?: number; food?: number; score?: number };
}

export interface ArtifactDef {
  id: string;
  name: string;
  description: string;
  icon: any;
  effect: (state: GameState) => Partial<GameState>; 
}

export interface VisualEffect {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export interface AIEventResponse {
  title: string;
  scenario: string;
  options: {
    text: string;
    consequence: string;
    rewards: {
      wood?: number;
      food?: number;
      survivors?: number;
      tempBoost?: number;
      fireLevel?: number;
    };
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  condition: (state: GameState) => boolean;
  reward: { text: string; wood?: number; food?: number };
}

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  baseCost: { wood: number; food: number };
  costMult: number; 
  icon: any;
}
