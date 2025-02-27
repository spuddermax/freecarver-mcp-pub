import { Point, GRID_CONSTANTS } from "./types";

export function checkCollision(point: Point, otherPoints: Point[]) {
	if (!point.active) return false;

	// Look ahead to detect potential collisions
	const lookAheadDistance = 30; // Distance to check ahead
	const futureX =
		point.x +
		Math.cos((point.direction * Math.PI) / 180) * lookAheadDistance;
	const futureY =
		point.y +
		Math.sin((point.direction * Math.PI) / 180) * lookAheadDistance;

	for (const otherPoint of otherPoints) {
		if (!otherPoint.active || otherPoint === point) continue;

		// Check collision with other point's trail
		for (let i = 1; i < otherPoint.trail.length; i++) {
			const trailSegment = {
				x1: otherPoint.trail[i - 1].x,
				y1: otherPoint.trail[i - 1].y,
				x2: otherPoint.trail[i].x,
				y2: otherPoint.trail[i].y,
			};

			// Calculate distance from future position to line segment
			const A = point.x - trailSegment.x1;
			const B = point.y - trailSegment.y1;
			const C = trailSegment.x2 - trailSegment.x1;
			const D = trailSegment.y2 - trailSegment.y1;

			const dot = A * C + B * D;
			const len_sq = C * C + D * D;
			let param = -1;

			if (len_sq !== 0) param = dot / len_sq;

			let xx, yy;

			if (param < 0) {
				xx = trailSegment.x1;
				yy = trailSegment.y1;
			} else if (param > 1) {
				xx = trailSegment.x2;
				yy = trailSegment.y2;
			} else {
				xx = trailSegment.x1 + param * C;
				yy = trailSegment.y1 + param * D;
			}

			const dx = point.x - xx;
			const dy = point.y - yy;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Check for immediate collision
			if (distance < 3) {
				return true; // Actual collision
			}

			// Check future position for potential collision
			const futureA = futureX - trailSegment.x1;
			const futureB = futureY - trailSegment.y1;
			const futureDot = futureA * C + futureB * D;
			let futureParam = -1;

			if (len_sq !== 0) futureParam = futureDot / len_sq;

			let futureXX, futureYY;

			if (futureParam < 0) {
				futureXX = trailSegment.x1;
				futureYY = trailSegment.y1;
			} else if (futureParam > 1) {
				futureXX = trailSegment.x2;
				futureYY = trailSegment.y2;
			} else {
				futureXX = trailSegment.x1 + futureParam * C;
				futureYY = trailSegment.y1 + futureParam * D;
			}

			const futureDX = futureX - futureXX;
			const futureDY = futureY - futureYY;
			const futureDistance = Math.sqrt(
				futureDX * futureDX + futureDY * futureDY
			);

			// If potential future collision detected, change direction
			if (futureDistance < 20) {
				// Wider threshold for future collisions
				// Determine which direction to turn based on relative positions
				// Calculate current movement direction
				const currentTime = performance.now();
				if (
					currentTime - point.lastTurnTime <
					GRID_CONSTANTS.TURN_DELAY
				) {
					return false; // Too soon to turn again
				}

				const currentDirection = point.direction;

				// Determine perpendicular directions
				const clockwise = (currentDirection + 90) % 360;
				const counterClockwise = (currentDirection + 270) % 360;

				// Choose direction based on which turn avoids the obstacle better
				const clockwiseDistance = calculateTurnDistance(
					point,
					clockwise,
					trailSegment
				);
				const counterClockwiseDistance = calculateTurnDistance(
					point,
					counterClockwise,
					trailSegment
				);

				point.direction = (
					clockwiseDistance > counterClockwiseDistance
						? clockwise
						: counterClockwise
				) as Point["direction"];
				point.lastTurnTime = currentTime;
				return false; // Not a collision, just avoiding one
			}
		}
	}
	return false;
}

// Helper function to calculate distance after a potential turn
function calculateTurnDistance(
	point: Point,
	newDirection: number,
	segment: { x1: number; y1: number; x2: number; y2: number }
) {
	const turnRadius = 20; // Distance to check after turn
	const directionRad = (newDirection * Math.PI) / 180;
	const futureX = point.x + Math.cos(directionRad) * turnRadius;
	const futureY = point.y + Math.sin(directionRad) * turnRadius;

	// Calculate distance from future position to line segment
	const dx = segment.x2 - segment.x1;
	const dy = segment.y2 - segment.y1;
	const len = Math.sqrt(dx * dx + dy * dy);
	if (len === 0) return 0;

	const dot =
		((futureX - segment.x1) * dx + (futureY - segment.y1) * dy) /
		(len * len);
	const closestX = segment.x1 + dot * dx;
	const closestY = segment.y1 + dot * dy;

	const distanceX = futureX - closestX;
	const distanceY = futureY - closestY;
	return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}
