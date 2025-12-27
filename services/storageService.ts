
import { GameState } from "../types";

const STORAGE_KEY = 'frost_haven_save_v1';

export const storageService = {
  save: (state: GameState) => {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.warn("Failed to save game", e);
    }
  },

  load: (): GameState | null => {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      return JSON.parse(serialized) as GameState;
    } catch (e) {
      console.warn("Failed to load game", e);
      return null;
    }
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
