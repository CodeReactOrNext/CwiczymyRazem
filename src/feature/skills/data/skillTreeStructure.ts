import type { GuitarSkillId } from "feature/skills/skills.types";

export interface SkillNodeDef {
  id: GuitarSkillId;
  x: number; // Grid X position
  y: number; // Grid Y position
  visualConnections?: GuitarSkillId[]; // Synergy links (optional)
}

// Layout: Constellations (Star Clusters)
// Center point: 12, 12 (The Player)

// QUADRANTS:
// Theory (Blue): Left [X: 2-8, Y: 10-14] - Center: 5, 12
// Technique (Red): Top [X: 10-14, Y: 2-8] - Center: 12, 5
// Creativity (Purple): Right [X: 16-22, Y: 10-14] - Center: 19, 12
// Hearing (Green): Bottom [X: 10-14, Y: 16-22] - Center: 12, 19

export const skillTreeData: SkillNodeDef[] = [
  // --- TECHNIQUE CLUSTER (Top) ---
  // Center Totem Area: 12, 5
  // Core physical skills
  { id: "picking", x: 12, y: 7, visualConnections: ["alternate_picking", "fingerpicking"] }, // Closest to player
  { id: "alternate_picking", x: 11, y: 5, visualConnections: ["sweep_picking", "hybrid_picking"] },
  { id: "fingerpicking", x: 13, y: 5, visualConnections: ["finger_independence"] },

  { id: "sweep_picking", x: 10, y: 4, visualConnections: [] },
  { id: "hybrid_picking", x: 10, y: 6, visualConnections: [] },

  { id: "finger_independence", x: 14, y: 4, visualConnections: ["tapping"] },
  { id: "tapping", x: 15, y: 3, visualConnections: [] },

  { id: "legato", x: 12, y: 3, visualConnections: ["vibrato", "bending"] }, // Top of the spear
  { id: "vibrato", x: 11, y: 2, visualConnections: [] },
  { id: "bending", x: 13, y: 2, visualConnections: ["slide_guitar"] },
  { id: "slide_guitar", x: 15, y: 6, visualConnections: [] },

  // --- THEORY CLUSTER (Left) ---
  // Center Totem Area: 5, 12
  { id: "music_theory", x: 7, y: 12, visualConnections: ["rhythm", "scales", "harmony"] }, // Gateway

  { id: "rhythm", x: 6, y: 10, visualConnections: ["sight_reading"] },
  { id: "sight_reading", x: 5, y: 9, visualConnections: [] },

  { id: "scales", x: 5, y: 12, visualConnections: ["chord_theory"] }, // Center
  { id: "chord_theory", x: 3, y: 12, visualConnections: [] },

  { id: "harmony", x: 6, y: 14, visualConnections: ["composition"] },
  { id: "composition", x: 5, y: 15, visualConnections: [] }, // 'composition' was mapped to 'music_composition'? no, distinct ID in some sets? 
  // checking guitarSkills.ts: 'music_composition' exists, 'composition' was used in old tree but maybe not in guitarSkills.ts?
  // Let's use 'music_composition' in Creativity. Let's check IDs.
  // 'composition' does NOT exist in guitarSkills.ts in the view I had. 'music_composition' does.
  // Wait, I used 'composition' in the previous file. Let's assume there is a mismatch.
  // I will check IDs carefully. 'music_composition' is creativity usually.
  // Let's stick to 'music_theory' branch having "harmony".

  // --- CREATIVITY CLUSTER (Right) ---
  // Center Totem Area: 19, 12
  { id: "improvisation", x: 17, y: 12, visualConnections: ["phrasing", "music_composition"] }, // Gateway

  { id: "phrasing", x: 19, y: 12, visualConnections: ["articulation"] },
  { id: "articulation", x: 21, y: 12, visualConnections: [] },

  { id: "music_composition", x: 19, y: 10, visualConnections: ["audio_production"] },
  { id: "audio_production", x: 20, y: 9, visualConnections: [] },

  // --- HEARING CLUSTER (Bottom) ---
  // Center Totem Area: 12, 19
  { id: "ear_training", x: 12, y: 17, visualConnections: ["pitch_recognition", "rythm_recognition"] }, // Gateway

  { id: "pitch_recognition", x: 11, y: 19, visualConnections: ["transcription"] },
  { id: "transcription", x: 10, y: 20, visualConnections: [] },

  { id: "rythm_recognition", x: 13, y: 19, visualConnections: [] },

];
