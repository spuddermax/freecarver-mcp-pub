export const GRID_CONSTANTS = {
	EXPLOSION_DURATION: 7500, // Duration of explosion animation in ms
	EXPLOSION_PARTICLES: 48, // Number of particles in explosion
	RESPAWN_DELAY: 10000, // Time before respawning after explosion in ms
	TRAIL_LENGTH: 1600, // Maximum number of points in trail
	TURN_DELAY: 250, // Minimum time between turns in ms
	NUM_DOTS: 6, // Total number of dots on the grid
	DRAW_HEAD: false, // Draw the head of the dot
	DOT: {
		LENGTH: 12, // Length of the teardrop dot
		WIDTH: 2, // Width of the teardrop dot
	},
	TRAIL: {
		LENGTH: 1200,
		WIDTH: 1,
	},
	SPEED: {
		MIN: 2, // Minimum speed for dots
		MAX: 2, // Maximum speed for dots
	},
	DIRECTIONS: [0, 90, 180, 270], // Directions dots can move in
	SHOW_PLAYER_NAME: false,
	COLLISIONS: true,
	COLORS_USED: ["blue"] as const, // Color names defined in the colors object
};

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
	color: "blue";
	playerIndex: number;
	lastTurnTime: number;
}

export const colors = {
	red: {
		trail: {
			start: "rgba(239, 68, 68, 0.4)",
			mid: "rgba(239, 68, 68, 0.1)",
			end: "rgba(239, 68, 68, 0)",
		},
		explosion: "rgba(239, 68, 68)",
		glow: "rgba(239, 68, 68, 0.8)",
	},
	green: {
		trail: {
			start: "rgba(34, 197, 94, 0.4)",
			mid: "rgba(34, 197, 94, 0.1)",
			end: "rgba(34, 197, 94, 0)",
		},
		explosion: "rgba(34, 197, 94)",
		glow: "rgba(34, 197, 94, 0.8)",
	},
	blue: {
		trail: {
			start: "rgba(0, 128, 255, 0.4)",
			mid: "rgba(0, 128, 255, 0.1)",
			end: "rgba(0, 128, 255, 0)",
		},
		explosion: "rgba(0, 128, 255)",
		glow: "rgba(0, 128, 255, 0.8)",
	},
	yellow: {
		trail: {
			start: "rgba(250, 204, 21, 0.4)",
			mid: "rgba(250, 204, 21, 0.1)",
			end: "rgba(250, 204, 21, 0)",
		},
		explosion: "rgba(250, 204, 21)",
		glow: "rgba(250, 204, 21, 0.8)",
	},
	purple: {
		trail: {
			start: "rgba(168, 85, 247, 0.4)",
			mid: "rgba(168, 85, 247, 0.1)",
			end: "rgba(168, 85, 247, 0)",
		},
		explosion: "rgba(168, 85, 247)",
		glow: "rgba(168, 85, 247, 0.8)",
	},
	orange: {
		trail: {
			start: "rgba(255, 145, 0, 0.4)",
			mid: "rgba(255, 145, 0, 0.1)",
			end: "rgba(255, 145, 0, 0)",
		},
		explosion: "rgba(255, 145, 0)",
		glow: "rgba(255, 145, 0, 0.8)",
	},
	blueGreen: {
		trail: {
			start: "rgba(0, 100, 155, 0.4)",
			mid: "rgba(0, 100, 155, 0.1)",
			end: "rgba(0, 100, 155, 0)",
		},
		explosion: "rgba(0, 100, 155)",
		glow: "rgba(0, 100, 155, 0.8)",
	},
	white: {
		trail: {
			start: "rgba(255, 255, 255, 0.4)",
			mid: "rgba(255, 255, 255, 0.1)",
			end: "rgba(255, 255, 255, 0)",
		},
		explosion: "rgba(255, 255, 255)",
		glow: "rgba(255, 255, 255, 0.8)",
	},
	black: {
		trail: {
			start: "rgba(0, 0, 0, 0.4)",
			mid: "rgba(0, 0, 0, 0.1)",
			end: "rgba(0, 0, 0, 0)",
		},
		explosion: "rgba(0, 0, 0)",
		glow: "rgba(0, 0, 0, 0.8)",
	},
};
