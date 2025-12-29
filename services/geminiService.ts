
import { GoogleGenAI } from "@google/genai";
import { MechBuild, BattleResult } from "../types";
import BattleEngine from "./BattleEngine";
import { useGameStore } from "../store";

// Helper to get client with the latest key
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

// SVG Placeholder generator for Debug Mode
const getMockImage = (text: string) => {
  const svg = `
  <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg" style="background-color: #1e293b;">
    <rect width="100%" height="100%" fill="#0f172a" />
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#22d3ee" font-family="monospace" font-size="24" font-weight="bold">
      ${text}
    </text>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="14">
      [DEBUG MODE: AI IMAGE GEN DISABLED]
    </text>
    <rect x="20%" y="65%" width="60%" height="2" fill="#334155" />
    <circle cx="50%" cy="65%" r="5" fill="#22d3ee" />
  </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const generateMechVisualization = async (build: MechBuild): Promise<string | null> => {
  const debugEnabled = useGameStore.getState().debugSettings.enabled;

  if (debugEnabled) {
      console.log("DEBUG MODE: Returning mock image visualization");
      return getMockImage(build.name.toUpperCase());
  }

  // Double check strict requirement
  if (!process.env.API_KEY) return null;

  try {
    const prompt = `
      A photorealistic, high-quality concept art of a futuristic mecha robot (Armored Core style).
      The mecha has the following characteristics:
      - Head: ${build.parts.HEAD.name} (${build.parts.HEAD.description})
      - Core/Torso: ${build.parts.CORE.name} (${build.parts.CORE.description})
      - Legs: ${build.parts.LEGS.name} (${build.parts.LEGS.description})
      - Arms: ${build.parts.ARMS.name} (${build.parts.ARMS.description})
      - Back Units: ${build.parts.BACK_L.name} (${build.parts.BACK_L.description}), ${build.parts.BACK_R.name} (${build.parts.BACK_R.description})
      - Color Scheme: ${build.color} metallic finish.
      - Weapons: ${build.parts.WEAPON_R.name} (${build.parts.WEAPON_R.description}) (Right Hand), ${build.parts.WEAPON_L.name} (${build.parts.WEAPON_L.description}) (Left Hand).
      - Setting: High-tech industrial hangar.
      - Aspect Ratio: Square (1:1).
    `;

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating mech image:", error);
    return null;
  }
};

export const generateBattleReport = async (result: BattleResult, playerBuild: MechBuild): Promise<string> => {
    // Guard clause: ensure result exists before accessing properties
    if (!result) return "Error: Missing battle data.";

    const debugEnabled = useGameStore.getState().debugSettings.enabled;

    if (debugEnabled) {
        const damageDealt = result.frames?.reduce((acc, frame) => 
            acc + frame.events.filter(e => e.type === 'HIT' && e.sourceId === 'PLAYER').reduce((d, e) => d + (e.damage || 0), 0), 0) || 0;
        
        return `[DEBUG MODE: MOCK NARRATIVE]\n\nBATTLE REPORT: ${playerBuild.name} vs ${result.enemyName || 'Unknown'}\n\nWINNER: ${result.winner}\nDAMAGE DEALT: ${damageDealt}\n\n(Note: In Production, Gemini 3 Flash Thinking would generate a detailed tactical analysis of this combat encounter here, explaining why ${result.winner} won based on mobility, firepower, and AI behavior patterns.)`;
    }

    // If no key is present, fallback to basic text
    if (!process.env.API_KEY) {
        return `SIMULATION LOG [OFFLINE MODE]\n\nWinner: ${result.winner}\nDuration: ${result.duration} ticks\n\n(Narrative generation disabled - No API Key)`;
    }

    try {
        const damageDealt = result.frames.reduce((acc, frame) => 
            acc + frame.events.filter(e => e.type === 'HIT' && e.sourceId === 'PLAYER').reduce((d, e) => d + (e.damage || 0), 0), 0);
        
        const damageTaken = result.frames.reduce((acc, frame) => 
            acc + frame.events.filter(e => e.type === 'HIT' && e.targetId === 'PLAYER').reduce((d, e) => d + (e.damage || 0), 0), 0);

        const finalStatus = result.winner === 'PLAYER' ? 'Enemy Core Critical/Destroyed' : 'Player Unit Signal Lost';
        
        const systemInstruction = `
            You are a veteran combat analyst for the 'Architect Protocol' mech league.
            Write a gritty, technical After Action Report (AAR) summarizing the battle.
            
            Tone: Military Sci-Fi (Armored Core / Front Mission). Impersonal but insightful.
            Format:
            - SITUATION: 1 sentence summary.
            - TACTICAL ANALYSIS: 2-3 bullet points explaining WHY the winner won (e.g., better heat management, range control, weapon mismatch).
            - CONCLUSION: Final rating of the performance.
            
            Keep it under 150 words. Do not use flowery language. Focus on mechanics (heat, stability, energy, armor).
        `;

        const prompt = `
            Analyze this battle data:

            COMBATANTS:
            1. Player Unit: "${playerBuild.name}"
            2. Enemy Unit: "${result.enemyName || 'Unknown'}"
            
            TELEMETRY:
            - Winner: ${result.winner}
            - Duration: ${(result.duration || 0) / 60} seconds
            - Damage Output: ${damageDealt} (Player) vs ${damageTaken} (Enemy)
            - Outcome: ${finalStatus}
            - Environment: ${result.arenaType || 'Standard Arena'}
            
            Identify the key turning point or tactical advantage.
        `;

        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                thinkingConfig: {
                    thinkingBudget: 1024
                },
                maxOutputTokens: 2048,
            }
        });

        return response.text || "Report generation failed.";
    } catch (e) {
        console.error("Narrative Gen Error:", e);
        return "Battle data corrupted. Narrative unavailable.";
    }
}

export const simulateBattleInCloud = async (playerBuild: MechBuild, enemyBuild: MechBuild, arenaType?: string): Promise<BattleResult | null> => {
    // We utilize the local deterministic engine for the actual result for fairness and speed.
    // The Gemini integration is used for the *Narrative* (generateBattleReport) and *Visualization* steps.
    
    return new Promise(resolve => {
        const engine = new BattleEngine(playerBuild, enemyBuild, { arenaType });
        const result = engine.run();
        
        // Simulating calc time / server handshake
        setTimeout(() => {
            resolve(result);
        }, 500);
    });
}
