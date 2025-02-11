import { createContext, useContext, useState } from 'react';

type GridContextType = {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  animateGrid: boolean;
  setAnimateGrid: (animate: boolean) => void;
};

export const GridContext = createContext<GridContextType | undefined>(undefined);

export function useGrid() {
  const context = useContext(GridContext);
  if (context === undefined) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
}

export function useGridProvider() {
  const [showGrid, setShowGrid] = useState(() => {
    const saved = localStorage.getItem('showGrid');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [animateGrid, setAnimateGrid] = useState(() => {
    const saved = localStorage.getItem('animateGrid');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const updateGrid = (show: boolean) => {
    setShowGrid(show);
    localStorage.setItem('showGrid', JSON.stringify(show));
  };

  const updateAnimation = (animate: boolean) => {
    setAnimateGrid(animate);
    localStorage.setItem('animateGrid', JSON.stringify(animate));
  };

  return { 
    showGrid, 
    setShowGrid: updateGrid,
    animateGrid,
    setAnimateGrid: updateAnimation
  };
}