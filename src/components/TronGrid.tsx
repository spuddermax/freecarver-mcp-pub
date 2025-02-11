import React, { useEffect, useRef } from 'react';
import { useGrid } from '../lib/grid';
import { useTheme } from '../lib/theme';

interface Point {
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
}

const GRID_CONSTANTS = {
  EXPLOSION_DURATION: 4000, // Duration of explosion animation in ms
  RESPAWN_DELAY: 5000,    // Time before respawning after explosion in ms
  TRAIL_LENGTH: 400,      // Maximum number of points in trail
  SPEED: {
    MIN: 1.5,            // Minimum speed for dots
    MAX: 3.0             // Maximum speed for dots
  },
  NUM_DOTS: 3            // Total number of dots on the grid
};

export function TronGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const pointsRef = useRef<Point[]>([]);
  const isAnimatingRef = useRef(false);
  const animateRef = useRef<() => void>();
  const { animateGrid } = useGrid();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const drawGridRef = useRef<() => void>();
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Force redraw when theme changes
  useEffect(() => {
    if (drawGridRef.current) {
      drawGridRef.current();
    }
    // Instantly update background color
    if (backgroundRef.current) {
      backgroundRef.current.className = `fixed inset-0 -z-10 bg-gradient-to-br ${
        isDark ? 'from-gray-900 to-blue-900' : 'from-gray-50 to-gray-200'
      }`;
    }
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = {
      blue: {
        trail: {
          start: 'rgba(0, 128, 255, 0.4)',
          mid: 'rgba(0, 128, 255, 0.1)',
          end: 'rgba(0, 128, 255, 0)'
        },
        explosion: 'rgba(0, 128, 255, ',
        glow: 'rgba(0, 128, 255, '
      },
      purple: {
        trail: {
          start: 'rgba(147, 51, 234, 0.4)',
          mid: 'rgba(147, 51, 234, 0.1)',
          end: 'rgba(147, 51, 234, 0)'
        },
        explosion: 'rgba(147, 51, 234, ',
        glow: 'rgba(147, 51, 234, '
      },
      red: {
        trail: {
          start: 'rgba(239, 68, 68, 0.4)',
          mid: 'rgba(239, 68, 68, 0.1)',
          end: 'rgba(239, 68, 68, 0)'
        },
        explosion: 'rgba(239, 68, 68, ',
        glow: 'rgba(239, 68, 68, '
      },
      green: {
        trail: {
          start: 'rgba(34, 197, 94, 0.4)',
          mid: 'rgba(34, 197, 94, 0.1)',
          end: 'rgba(34, 197, 94, 0)'
        },
        explosion: 'rgba(34, 197, 94, ',
        glow: 'rgba(34, 197, 94, '
      }
    };

    const getRandomColor = (): Point['color'] => {
      const colors: Point['color'][] = ['blue', 'purple', 'red', 'green'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Assign initial colors to players
    const playerColors = Array.from({ length: GRID_CONSTANTS.NUM_DOTS }, () => getRandomColor());

    // Create initial points
    pointsRef.current = Array.from({ length: GRID_CONSTANTS.NUM_DOTS }, (_, index) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      direction: [0, 90, 180, 270][Math.floor(Math.random() * 4)] as Point['direction'],
      speed: GRID_CONSTANTS.SPEED.MIN + Math.random() * (GRID_CONSTANTS.SPEED.MAX - GRID_CONSTANTS.SPEED.MIN),
      progress: 0,
      trail: [],
      active: true,
      respawnTime: null,
      crashTime: null,
      color: playerColors[index],
      playerIndex: index
    }));

    const checkCollision = (point: Point, otherPoints: Point[]) => {
      if (!point.active) return false;
      
      // Look ahead to detect potential collisions
      const lookAheadDistance = 30; // Distance to check ahead
      const futureX = point.x + Math.cos((point.direction * Math.PI) / 180) * lookAheadDistance;
      const futureY = point.y + Math.sin((point.direction * Math.PI) / 180) * lookAheadDistance;
      
      for (const otherPoint of otherPoints) {
        if (!otherPoint.active || otherPoint === point) continue;
        
        // Check collision with other point's trail
        for (let i = 1; i < otherPoint.trail.length; i++) {
          const trailSegment = {
            x1: otherPoint.trail[i-1].x,
            y1: otherPoint.trail[i-1].y,
            x2: otherPoint.trail[i].x,
            y2: otherPoint.trail[i].y
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
          const futureDistance = Math.sqrt(futureDX * futureDX + futureDY * futureDY);
          
          // If potential future collision detected, change direction
          if (futureDistance < 20) { // Wider threshold for future collisions
            // Determine which direction to turn based on relative positions
            const crossProduct = (trailSegment.x2 - trailSegment.x1) * (point.y - trailSegment.y1) -
                               (trailSegment.y2 - trailSegment.y1) * (point.x - trailSegment.x1);
            
            // Turn right if cross product is positive, left if negative
            const turn = crossProduct > 0 ? 90 : -90;
            point.direction = ((point.direction + turn + 360) % 360) as Point['direction'];
            return false; // Not a collision, just avoiding one
          }
        }
      }
      return false;
    };

    const drawExplosion = (x: number, y: number, progress: number, point: Point) => {
      const radius = progress * 50; // Explosion size
      const opacity = 1 - progress; // Fade out as progress increases
      
      // Draw shockwave
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${colors[point.color].explosion}${opacity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw particles
      const particles = 12;
      for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2;
        const particleRadius = radius * 0.7;
        const px = x + Math.cos(angle) * particleRadius * (1 - progress * 0.5);
        const py = y + Math.sin(angle) * particleRadius * (1 - progress * 0.5);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(px, py);
        ctx.strokeStyle = `${colors[point.color].explosion}${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // Define the draw function
    drawGridRef.current = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw base grid
      ctx.strokeStyle = 'rgba(0, 128, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update and draw points
      const currentTime = performance.now();
      
      pointsRef.current.forEach((point, index) => {
        if (!animateGrid) {
          // When animation is paused, only draw the current state
          if (point.trail.length > 0) {
            // Draw existing trail
            ctx.beginPath();
            ctx.moveTo(point.trail[0].x, point.trail[0].y);
            
            for (let i = 1; i < point.trail.length - 2; i++) {
              const xc = (point.trail[i].x + point.trail[i + 1].x) / 2;
              const yc = (point.trail[i].y + point.trail[i + 1].y) / 2;
              ctx.quadraticCurveTo(point.trail[i].x, point.trail[i].y, xc, yc);
            }
            
            const gradient = ctx.createLinearGradient(
              point.trail[0].x,
              point.trail[0].y,
              point.trail[point.trail.length - 1].x,
              point.trail[point.trail.length - 1].y
            );
            gradient.addColorStop(0, colors[point.color].trail.start);
            gradient.addColorStop(0.95, colors[point.color].trail.mid);
            gradient.addColorStop(1, colors[point.color].trail.end);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          return;
        }

        // Handle respawning
        if (!point.active && point.respawnTime !== null) {
          if (currentTime >= point.respawnTime) {
            point.active = true;
            point.respawnTime = null;
            point.trail = [];
            point.x = Math.random() * canvas.width;
            point.y = Math.random() * canvas.height;
            point.direction = [0, 90, 180, 270][Math.floor(Math.random() * 4)] as Point['direction'];
            // Color remains the same as it's tied to playerIndex
          } else {
            // Draw explosion animation while inactive
            const progress = (currentTime - (point.respawnTime - GRID_CONSTANTS.RESPAWN_DELAY)) / GRID_CONSTANTS.EXPLOSION_DURATION;
            if (progress <= 1) { // Animation now takes 2 seconds to complete
              drawExplosion(point.x, point.y, progress, point);
            }
            return;
          }
        }

        if (!point.active) return;

        // Update position
        const directionRad = (point.direction * Math.PI) / 180;
        point.x += Math.cos(directionRad) * point.speed;
        point.y += Math.sin(directionRad) * point.speed;
        point.progress += 0.02;

        // Check for collisions
        const collision = checkCollision(point, pointsRef.current);
        if (collision) {
          point.active = false;
          point.crashTime = currentTime;
          point.respawnTime = currentTime + GRID_CONSTANTS.RESPAWN_DELAY;
          // Don't return here, let the trail continue to be drawn
        }

        // Handle screen wrapping before updating trail
        if (point.x < 0) {
          point.x = canvas.width;
          point.trail = []; // Clear trail when wrapping
        }
        if (point.x > canvas.width) {
          point.x = 0;
          point.trail = []; // Clear trail when wrapping
        }
        if (point.y < 0) {
          point.y = canvas.height;
          point.trail = []; // Clear trail when wrapping
        }
        if (point.y > canvas.height) {
          point.y = 0;
          point.trail = []; // Clear trail when wrapping
        }

        if (point.active) {
          // Update trail for active points
          point.trail.unshift({ x: point.x, y: point.y });
          if (point.trail.length > GRID_CONSTANTS.TRAIL_LENGTH) {
            point.trail.pop();
          }
        }

        // Draw trail for both active and crashed points
        if (point.trail.length > 0) {
          ctx.beginPath();
          ctx.moveTo(point.trail[0].x, point.trail[0].y);
          
          for (let i = 1; i < point.trail.length - 2; i++) {
            const xc = (point.trail[i].x + point.trail[i + 1].x) / 2;
            const yc = (point.trail[i].y + point.trail[i + 1].y) / 2;
            ctx.quadraticCurveTo(point.trail[i].x, point.trail[i].y, xc, yc);
          }
          
          // Create gradient for the trail
          let trailOpacity = 1;
          if (!point.active && point.crashTime) {
            // Calculate fade out progress for crashed trails
            const timeSinceCrash = (currentTime - point.crashTime) / GRID_CONSTANTS.EXPLOSION_DURATION;
            trailOpacity = Math.max(0, 1 - timeSinceCrash);
          }
          
          const gradient = ctx.createLinearGradient(
            point.trail[0].x,
            point.trail[0].y,
            point.trail[point.trail.length - 1].x,
            point.trail[point.trail.length - 1].y
          );
          gradient.addColorStop(0, colors[point.color].trail.start.replace('0.4', (0.4 * trailOpacity).toString()));
          gradient.addColorStop(0.95, colors[point.color].trail.mid.replace('0.1', (0.1 * trailOpacity).toString()));
          gradient.addColorStop(1, colors[point.color].trail.end);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (point.active) {
          // Draw teardrop head
          const headLength = 12;
          const headWidth = 6;
          const pulseOpacity = 0.5 + Math.sin(point.progress) * 0.3;
          ctx.fillStyle = `${colors[point.color].glow}${pulseOpacity})`;
          
          // Save context for rotation
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(directionRad);
          
          // Draw teardrop shape
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(
            -headLength / 2, headWidth / 2,
            -headLength, 0
          );
          ctx.quadraticCurveTo(
            -headLength / 2, -headWidth / 2,
            0, 0
          );
          ctx.fill();
          
          // Add glow effect to teardrop
          const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, headLength);
          glowGradient.addColorStop(0, `${colors[point.color].glow}${pulseOpacity})`);
          glowGradient.addColorStop(1, `${colors[point.color].glow}0)`);
          ctx.fillStyle = glowGradient;
          ctx.fill();
          
          // Draw player label
          ctx.restore(); // Restore after teardrop rotation
          
          // Set up text style
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = `${colors[point.color].glow}${pulseOpacity})`;
          
          // Draw text slightly above the dot
          ctx.fillText(`Player ${point.playerIndex + 1}`, point.x, point.y - 15);
          
          // Save context for next iteration
          ctx.restore();
        }

        // Randomly change direction occasionally
        if (Math.random() < 0.01) {
          // Choose a new direction that's 90 degrees different from current
          // Store current position for smooth transition
          const lastPos = { x: point.x, y: point.y };
          
          const possibleTurns = [90, -90];
          const turn = possibleTurns[Math.floor(Math.random() * 2)];
          let newDirection = (point.direction + turn + 360) % 360;
          point.direction = newDirection as Point['direction'];
        }
      });
    };

    // Define animate function and store in ref
    animateRef.current = () => {
      if (drawGridRef.current && isAnimatingRef.current) {
        drawGridRef.current();
        animationFrameRef.current = requestAnimationFrame(animateRef.current!);
      }
    };

    // Start initial animation
    isAnimatingRef.current = animateGrid;
    if (animateGrid) {
      animateRef.current();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Effect to handle animation state changes
  useEffect(() => {
    isAnimatingRef.current = animateGrid;
    
    if (animateGrid) {
      // Start animation if it's not running
      if (!animationFrameRef.current) {
        animateRef.current?.();
      }
    } else {
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      // Draw one last frame to show static state
      if (drawGridRef.current) {
        drawGridRef.current();
      }
    }
  }, [animateGrid]);

  // Draw initial frame
  useEffect(() => {
    if (drawGridRef.current) {
      drawGridRef.current();
    }
  }, []);

  return (
    <>
      <div
        ref={backgroundRef}
        className={`fixed inset-0 -z-10 bg-gradient-to-br ${
          isDark ? 'from-gray-900 to-blue-900' : 'from-gray-50 to-gray-200'
        }`}
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10"
      />
    </>
  );
}