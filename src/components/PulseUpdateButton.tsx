import React, { useState, useRef } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

// CSS for pulse animation and tooltip
export const pulseAnimationCSS = `
  @keyframes pulse-animation {
    0% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  }
  .pulse-button {
    animation: pulse-animation 2s infinite;
    position: relative;
  }
  
  .changes-tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    right: 0;
    background-color: #1f2937;
    color: white;
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    width: 280px;
    z-index: 50;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
  }
  
  .changes-tooltip:after {
    content: '';
    position: absolute;
    top: 100%;
    right: 20px;
    border-width: 8px;
    border-style: solid;
    border-color: #1f2937 transparent transparent transparent;
  }
  
  .tooltip-container:hover .changes-tooltip {
    opacity: 1;
    visibility: visible;
  }
  
  .revert-button {
    background-color: #2563eb;
    color: white;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 10px;
    transition: background-color 0.2s;
    width: 100%;
  }
  
  .revert-button:hover {
    background-color: #1d4ed8;
  }
`;

// Define the props for the component
interface PulseUpdateButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  showPulse?: boolean;
  label: string;
  icon?: React.ReactNode;
  changes?: string[];
  onRevert?: () => void;
  isLoading?: boolean;
  tooltipTitle?: string;
  revertButtonLabel?: string;
  className?: string;
}

const PulseUpdateButton: React.FC<PulseUpdateButtonProps> = ({
  onClick,
  disabled = false,
  showPulse = false,
  label,
  icon,
  changes = [],
  onRevert,
  isLoading = false,
  tooltipTitle = "Unsaved Changes:",
  revertButtonLabel = "Revert All Changes",
  className = ""
}) => {
  const [showChangesTooltip, setShowChangesTooltip] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle tooltip display
  const handleTooltipMouseEnter = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = null;
    }
    setShowChangesTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    tooltipTimeout.current = setTimeout(() => {
      setShowChangesTooltip(false);
    }, 300);
  };

  // Base button styling
  const baseButtonStyle = `inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium`;
  
  // Determine button color and style based on state
  const buttonStyle = disabled || isLoading
    ? `${baseButtonStyle} bg-green-900 cursor-not-allowed text-gray-500` 
    : `${baseButtonStyle} bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-white ${showPulse ? 'pulse-button' : ''}`;

  const showTooltip = showPulse && showChangesTooltip && changes.length > 0;

  return (
    <div
      className={`relative tooltip-container ${showPulse ? 'group' : ''} ${className}`}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      {/* Changes tooltip */}
      {showTooltip && (
        <div className="changes-tooltip">
          <div className="font-medium text-sm mb-1 text-green-300 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{tooltipTitle}</span>
          </div>
          
          <ul className="text-xs space-y-1 max-h-60 overflow-auto mb-3">
            {changes.map((change, index) => (
              <li key={index} className="flex items-start pb-1 border-b border-gray-700 last:border-0">
                <span>• {change}</span>
              </li>
            ))}
          </ul>
          
          {/* Revert button */}
          {onRevert && (
            <button 
              onClick={onRevert}
              className="revert-button"
              type="button"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{revertButtonLabel}</span>
            </button>
          )}
        </div>
      )}
      
      {/* The actual button */}
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={buttonStyle}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {isLoading ? "Loading..." : label}
      </button>
    </div>
  );
};

export default PulseUpdateButton; 