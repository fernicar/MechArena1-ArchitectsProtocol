
import { Rival } from '../types';
import { getRankFromRating } from './glicko';

const PILOT_NAMES = [
    "Nine-Ball", "White Glint", "Leos Klein", "Jack-O", "Stinger", 
    "Zinaida", "Evane", "Berlioz", "Merrygate", "Fiona", 
    "Thermidor", "Otsdarva", "Noblesse", "Joshua", "Anatolia",
    "Sulla", "V.IV Rusty", "G1 Michigan", "G5 Iguazu", "V.II Snail",
    "Raven", "Ayre", "Walter", "Carla", "Chatty",
    "Hustler One", "Human PLUS", "Fantasma", "Vixen", "Phantasma",
    "Ace", "Viper", "Ghost", "Shadow", "Mirage", "Echo",
    "Steel", "Iron", "Cobalt", "Neon", "Flux", "Apex",
    "Zero", "Cipher", "Pixy", "Mobius", "Blaze", "Edge",
    "Wolf", "Hawk", "Bear", "Shark", "Tiger", "Lion"
];

const MECH_SUFFIXES = [
    "Alpha", "Beta", "Gamma", "Delta", "Omega", "Prime", "Custom",
    "Ver.2", "Type-0", "Mark IV", "X", "Z", "Sigma", "Epsilon"
];

const MECH_PREFIXES = [
    "Steel", "Iron", "Dark", "White", "Red", "Blue", "Black", "Gold",
    "Silver", "Crimson", "Azure", "Shadow", "Ghost", "Heavy", "Light",
    "Armored", "Rapid", "Sonic", "Thunder", "Lightning"
];

const RNG = (seed: number) => {
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const generateRivals = (count: number = 50): Rival[] => {
    const rivals: Rival[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
        let name = PILOT_NAMES[Math.floor(Math.random() * PILOT_NAMES.length)];
        let retry = 0;
        while (usedNames.has(name) && retry < 10) {
            name = PILOT_NAMES[Math.floor(Math.random() * PILOT_NAMES.length)];
            retry++;
        }
        if (usedNames.has(name)) name = `${name} ${i}`; // Fallback unique
        usedNames.add(name);

        const prefix = MECH_PREFIXES[Math.floor(Math.random() * MECH_PREFIXES.length)];
        const suffix = MECH_SUFFIXES[Math.floor(Math.random() * MECH_SUFFIXES.length)];
        const mechName = `${prefix} ${suffix}`;

        // Generate rating on a curve
        // Base 1500, spread 400. Min 800, Max 2800.
        // Bias slightly higher for "Top" pilots
        const bias = i < 5 ? 500 : 0; 
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        let rating = Math.floor(1500 + z * 300 + bias);
        
        rating = Math.max(800, Math.min(2800, rating));

        rivals.push({
            id: `rival_${i}_${Date.now()}`,
            name,
            mechName,
            rating,
            trend: Math.random() > 0.5 ? 'SAME' : Math.random() > 0.5 ? 'UP' : 'DOWN'
        });
    }

    return rivals.sort((a, b) => b.rating - a.rating);
};
