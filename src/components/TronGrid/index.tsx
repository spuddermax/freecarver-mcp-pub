import { useEffect, useRef } from 'react';
import { useGrid } from '../../lib/grid';
import { useTheme } from '../../lib/theme';
import { Point, GRID_CONSTANTS } from './types';
import { checkCollision } from './TronGridLogic';
import { drawGrid, drawPoint } from './TronGridRenderer';

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

    // Initialize points
    const availableColors: Point['color'][] = ['blue', 'purple', 'red', 'green'];
    const playerColors = Array.from({ length: GRID_CONSTANTS.NUM_DOTS }, (_, i) => 
      availableColors[i % availableColors.length]
    );
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
      playerIndex: index,
      lastTurnTime: 0
    }));

    // Define the draw function
    drawGridRef.current = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx, canvas.width, canvas.height);

      const currentTime = performance.now();
      pointsRef.current.forEach(point => {
        if (!animateGrid) {
          drawPoint(ctx, point, currentTime);
          return;
        }

        updatePoint(point, currentTime, canvas.width, canvas.height, pointsRef.current);
        drawPoint(ctx, point, currentTime);
      });
    };

    // Animation loop
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

  // Handle animation state changes
  useEffect(() => {
    isAnimatingRef.current = animateGrid;
    
    if (animateGrid) {
      if (!animationFrameRef.current) {
        animateRef.current?.();
      }
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
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

function updatePoint(point: Point, currentTime: number, width: number, height: number, points: Point[]) {
  if (!point.active && point.respawnTime !== null) {
    if (currentTime >= point.respawnTime) {
      point.active = true;
      point.respawnTime = null;
      point.trail = [];
      point.x = Math.random() * width;
      point.y = Math.random() * height;
      point.direction = [0, 90, 180, 270][Math.floor(Math.random() * 4)] as Point['direction'];
    }
    return;
  }

  if (!point.active) return;

  const directionRad = (point.direction * Math.PI) / 180;
  point.x += Math.cos(directionRad) * point.speed;
  point.y += Math.sin(directionRad) * point.speed;
  point.progress += 0.02;

  const collision = checkCollision(point, points);
  if (collision) {
    point.active = false;
    point.crashTime = currentTime;
    point.respawnTime = currentTime + GRID_CONSTANTS.RESPAWN_DELAY;
  }

  // Handle screen wrapping
  if (point.x < 0) {
    point.x = width;
    point.trail = [];
  }
  if (point.x > width) {
    point.x = 0;
    point.trail = [];
  }
  if (point.y < 0) {
    point.y = height;
    point.trail = [];
  }
  if (point.y > height) {
    point.y = 0;
    point.trail = [];
  }

  if (point.active) {
    point.trail.unshift({ x: point.x, y: point.y });
    if (point.trail.length > GRID_CONSTANTS.TRAIL_LENGTH) {
      point.trail.pop();
    }
  }

  // Random direction changes
  if (Math.random() < 0.01) {
    const possibleTurns = [90, -90];
    const currentTime = performance.now();
    
    // Check if enough time has passed since last turn
    if (currentTime - point.lastTurnTime < GRID_CONSTANTS.TURN_DELAY) {
      return;
    }
    
    // Ensure we only turn to valid orthogonal directions
    const currentDirection = point.direction;
    const turn = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
    const newDirection = ((currentDirection + turn + 360) % 360) as Point['direction'];
    
    // Verify the new direction is one of our valid orthogonal directions
    if ([0, 90, 180, 270].includes(newDirection)) {
      point.direction = newDirection;
      point.lastTurnTime = currentTime;
    }
  }
}