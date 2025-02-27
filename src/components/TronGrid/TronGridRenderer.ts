import { Point, GRID_CONSTANTS, colors } from "./types";

export function drawGrid(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number
) {
	ctx.strokeStyle = "rgba(0, 128, 255, 0.1)";
	ctx.lineWidth = 1;

	// Vertical lines
	for (let x = 0; x < width; x += 50) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	}

	// Horizontal lines
	for (let y = 0; y < height; y += 50) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
	}
}

export function drawExplosion(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	progress: number,
	point: Point
) {
	const radius = progress * 50; // Explosion size
	const opacity = 1 - progress; // Fade out as progress increases

	// Draw shockwave
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.strokeStyle = `${colors[point.color].explosion}${opacity * 0.5})`;
	ctx.lineWidth = 2;
	ctx.stroke();

	// Draw particles
	for (let i = 0; i < GRID_CONSTANTS.EXPLOSION_PARTICLES; i++) {
		const angle = (i / GRID_CONSTANTS.EXPLOSION_PARTICLES) * Math.PI * 2;
		const particleRadius = radius * 0.9;
		const px = x + Math.cos(angle) * particleRadius * (1 - progress * 0.25);
		const py = y + Math.sin(angle) * particleRadius * (1 - progress * 0.25);

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(px, py);
		ctx.strokeStyle = `${colors[point.color].explosion}${opacity})`;
		ctx.lineWidth = GRID_CONSTANTS.TRAIL.WIDTH;
		ctx.stroke();
	}
}

export function drawPoint(
	ctx: CanvasRenderingContext2D,
	point: Point,
	currentTime: number
) {
	// Draw trail
	if (point.trail.length > 0) {
		// Calculate the direction vector of the dot
		const directionRad = (point.direction * Math.PI) / 180;
		const trailOffsetX =
			-Math.cos(directionRad) * (GRID_CONSTANTS.DOT.LENGTH / 2); // Offset by half the dot length in opposite direction
		const trailOffsetY =
			-Math.sin(directionRad) * (GRID_CONSTANTS.DOT.LENGTH / 2);

		// Start the trail from behind the dot
		const trailStartX = point.x + trailOffsetX; // Add offset to move to tail
		const trailStartY = point.y + trailOffsetY;

		ctx.beginPath();
		ctx.moveTo(trailStartX, trailStartY);

		for (let i = 1; i < point.trail.length - 2; i++) {
			const xc = (point.trail[i].x + point.trail[i + 1].x) / 2;
			const yc = (point.trail[i].y + point.trail[i + 1].y) / 2;
			ctx.quadraticCurveTo(point.trail[i].x, point.trail[i].y, xc, yc);
		}

		// Calculate trail opacity
		let trailOpacity = 1;
		if (!point.active && point.crashTime) {
			const timeSinceCrash =
				(currentTime - point.crashTime) /
				GRID_CONSTANTS.EXPLOSION_DURATION;
			trailOpacity = Math.max(0, 1 - timeSinceCrash);
		}

		const gradient = ctx.createLinearGradient(
			trailStartX,
			trailStartY,
			point.trail[point.trail.length - 1].x,
			point.trail[point.trail.length - 1].y
		);
		gradient.addColorStop(
			0,
			colors[point.color].trail.start.replace(
				"0.4",
				(0.4 * trailOpacity).toString()
			)
		);
		gradient.addColorStop(
			0.95,
			colors[point.color].trail.mid.replace(
				"0.1",
				(0.1 * trailOpacity).toString()
			)
		);
		gradient.addColorStop(1, colors[point.color].trail.end);

		ctx.strokeStyle = gradient;
		ctx.lineWidth = GRID_CONSTANTS.TRAIL.WIDTH;
		ctx.stroke();
	}

	if (point.active && GRID_CONSTANTS.DRAW_HEAD) {
		// Draw teardrop head
		const headLength = GRID_CONSTANTS.DOT.LENGTH;
		const headWidth = GRID_CONSTANTS.DOT.WIDTH;
		const pulseOpacity = 0.5 + Math.sin(point.progress) * 0.3;
		const directionRad = (point.direction * Math.PI) / 180;

		ctx.save();
		ctx.translate(point.x, point.y);
		ctx.rotate(directionRad);

		// Draw teardrop shape
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.quadraticCurveTo(-headLength / 2, headWidth / 2, -headLength, 0);
		ctx.quadraticCurveTo(-headLength / 2, -headWidth / 2, 0, 0);

		ctx.fillStyle = `${colors[point.color].glow}${pulseOpacity})`;
		ctx.fill();

		// Add glow effect
		const glowGradient = ctx.createRadialGradient(
			0,
			0,
			0,
			0,
			0,
			headLength
		);
		glowGradient.addColorStop(
			0,
			`${colors[point.color].glow}${pulseOpacity})`
		);
		glowGradient.addColorStop(1, `${colors[point.color].glow}0)`);
		ctx.fillStyle = glowGradient;
		ctx.fill();

		ctx.restore();

		// Draw player label if enabled
		if (GRID_CONSTANTS.SHOW_PLAYER_NAME) {
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = `${colors[point.color].glow}${pulseOpacity})`;
			ctx.fillText(
				`Player ${point.playerIndex + 1}`,
				point.x,
				point.y - 15
			);
		}
	}

	// Draw explosion if point is inactive and has a crash time
	if (!point.active && point.crashTime && point.respawnTime) {
		const progress =
			(currentTime - (point.respawnTime - GRID_CONSTANTS.RESPAWN_DELAY)) /
			GRID_CONSTANTS.EXPLOSION_DURATION;
		if (progress <= 1) {
			drawExplosion(ctx, point.x, point.y, progress, point);
		}
	}
}
