export interface Point {
  x: number;
  y: number;
  direction: 0 | 90 | 180 | 270;
  speed: number;
  progress: number;
  trail: { x: number; y: number }[];
  active: boolean;
  respawnTime: number | null;
  crashTime: number | null;
  color: 'blue' | 'purple' | 'red' | 'green';
  playerIndex: number;
  lastTurnTime: number;
}

export const colors = {
  red: {
    trail: {
      start: 'rgba(239, 68, 68, 0.4)',
      mid: 'rgba(239, 68, 68, 0.1)',
      end: 'rgba(239, 68, 68, 0)'
    },
    explosion: 'rgba(239, 68, 68, 1)',
    glow: 'rgba(239, 68, 68, 0.8)'
  },
  green: {
    trail: {
      start: 'rgba(34, 197, 94, 0.4)',
      mid: 'rgba(34, 197, 94, 0.1)',
      end: 'rgba(34, 197, 94, 0)'
    },
    explosion: 'rgba(34, 197, 94, 1)',
    glow: 'rgba(34, 197, 94, 0.8)'
  },
  blue: {
    trail: {
      start: 'rgba(0, 128, 255, 0.4)',
      mid: 'rgba(0, 128, 255, 0.1)',
      end: 'rgba(0, 128, 255, 0)'
    },
    explosion: 'rgba(0, 128, 255, 1)',
    glow: 'rgba(0, 128, 255, 0.8)'
  },
  yellow: {
    trail: {
      start: 'rgba(250, 204, 21, 0.4)',
      mid: 'rgba(250, 204, 21, 0.1)',
      end: 'rgba(250, 204, 21, 0)'
    },
    explosion: 'rgba(250, 204, 21, 1)',
    glow: 'rgba(250, 204, 21, 0.8)'
  },
  purple: {
    trail: {
      start: 'rgba(168, 85, 247, 0.4)',
      mid: 'rgba(168, 85, 247, 0.1)',
      end: 'rgba(168, 85, 247, 0)'
    },
    explosion: 'rgba(168, 85, 247, 1)',
    glow: 'rgba(168, 85, 247, 0.8)'
  }
};

export const GRID_CONSTANTS = {
  EXPLOSION_DURATION: 4000, // Duration of explosion animation in ms
  RESPAWN_DELAY: 5000,    // Time before respawning after explosion in ms
  TRAIL_LENGTH: 400,      // Maximum number of points in trail
  TURN_DELAY: 250,       // Minimum time between turns in ms
  DOT: {
    LENGTH: 12,           // Length of the teardrop dot
    WIDTH: 12             // Width of the teardrop dot
  },
  SPEED: {
    MIN: 1.5,            // Minimum speed for dots
    MAX: 2             // Maximum speed for dots
  },
  NUM_DOTS: 5            // Total number of dots on the grid
};