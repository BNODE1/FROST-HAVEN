
import { GoogleGenAI, Type } from "@google/genai";
import { AIEventResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Fallback events if AI fails or no key
const FALLBACK_EVENTS: AIEventResponse[] = [
  {
    title: "Wandering Trader",
    scenario: "A masked figure emerges from the blizzard, pulling a sled laden with crates. They offer a trade.",
    options: [
      { text: "Trade Wood for Food", consequence: "The trader nods and swaps supplies.", rewards: { wood: -30, food: 50 } },
      { text: "Trade Food for Wood", consequence: "The trader grunts in approval.", rewards: { food: -30, wood: 50 } },
      { text: "Drive them away", consequence: "They vanish into the snow.", rewards: {} }
    ]
  },
  {
    title: "Abandoned Cache",
    scenario: "Your scouts spot a half-buried supply crate. It looks unstable.",
    options: [
      { text: "Dig it out carefully", consequence: "It takes time, but you find supplies.", rewards: { wood: 20, food: 20 } },
      { text: "Smash it open", consequence: "Some supplies were damaged.", rewards: { wood: 10 } },
      { text: "Ignore it", consequence: "Not worth the risk.", rewards: {} }
    ]
  },
  {
    title: "Sick Survivor",
    scenario: "A survivor stumbles into camp, coughing violently.",
    options: [
      { text: "Take them in (-20 Food)", consequence: "They recover and join you.", rewards: { food: -20, survivors: 1 } },
      { text: "Turn them away", consequence: "You preserve your supplies.", rewards: {} }
    ]
  },
  {
    title: "Wolf Pack",
    scenario: "Glowing eyes surround the camp perimeter at night.",
    options: [
      { text: "Use Fire to scare them", consequence: "It burns fuel, but they flee.", rewards: { wood: -20, fireLevel: -10 } },
      { text: "Fight them off", consequence: "You lose some food to the raid.", rewards: { food: -30 } }
    ]
  }
];

export const generateSurvivalEvent = async (day: number, survivors: number): Promise<AIEventResponse | null> => {
  try {
    if (!process.env.API_KEY) {
        throw new Error("No API Key");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a survival choice scenario for a "Whiteout Survival" style game. 
      The player is at Day ${day} with ${survivors} survivors. 
      The event should be atmospheric and offer tough choices.
      Format the output as a valid JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scenario: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  consequence: { type: Type.STRING },
                  rewards: {
                    type: Type.OBJECT,
                    properties: {
                      wood: { type: Type.NUMBER },
                      food: { type: Type.NUMBER },
                      survivors: { type: Type.NUMBER },
                      tempBoost: { type: Type.NUMBER },
                      fireLevel: { type: Type.NUMBER }
                    }
                  }
                },
                required: ["text", "consequence", "rewards"]
              }
            }
          },
          required: ["title", "scenario", "options"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.log("Using fallback event due to error/missing key");
    // Return random fallback
    return FALLBACK_EVENTS[Math.floor(Math.random() * FALLBACK_EVENTS.length)];
  }
};
