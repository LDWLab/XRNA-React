import React, { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Setting, SettingsRecord } from "../../ui/Setting";

export interface GridProps {
  settings: SettingsRecord;
  viewportWidth: number;
  viewportHeight: number;
  viewportScale: number;
  viewportTranslateX: number;
  viewportTranslateY: number;
  sceneBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const Grid: React.FC<GridProps> = ({
  settings,
  viewportWidth,
  viewportHeight,
  viewportScale,
  viewportTranslateX,
  viewportTranslateY,
  sceneBounds,
}) => {
  const { isDarkMode } = useTheme();

  // Get grid settings
  const gridEnabled = settings[Setting.GRID_ENABLED] as boolean;
  const horizontalLines = settings[Setting.GRID_HORIZONTAL_LINES] as boolean;
  const verticalLines = settings[Setting.GRID_VERTICAL_LINES] as boolean;
  const leftRightDiagonal = settings[
    Setting.GRID_LEFT_RIGHT_DIAGONAL
  ] as boolean;
  const rightLeftDiagonal = settings[
    Setting.GRID_RIGHT_LEFT_DIAGONAL
  ] as boolean;
  const concentricCircles = settings[
    Setting.GRID_CONCENTRIC_CIRCLES
  ] as boolean;
  const dotted = settings[Setting.GRID_DOTTED] as boolean;
  const gridSpacing = settings[Setting.GRID_SPACING] as number;
  const customGridColor = settings[Setting.GRID_COLOR] as string;

  // Calculate grid color based on theme and canvas color
  const gridColor = useMemo(() => {
    if (customGridColor) return customGridColor;

    // Default colors based on theme and canvas
    if (isDarkMode) {
      // Dark theme with light canvas
      return "#E0E0E0"; // Light gray
    } else {
      // Light theme with dark canvas
      return "#404040"; // Dark gray
    }
  }, [customGridColor, isDarkMode]);
  
  // Calculate grid parameters - use smaller base spacing and scale with zoom
  const baseSpacing = Math.max(10, gridSpacing * 0.5); // Reduce base spacing
  const scaledSpacing = Math.max(1, baseSpacing * viewportScale); // Ensure minimum spacing
  const strokeWidth = Math.max(0.3, Math.max(0.1, viewportScale)); // Thinner lines that scale better

  // Calculate grid bounds based on viewport, not scene bounds
  // This ensures grid is always visible and scales properly with zoom
  const gridBounds = useMemo(() => {
    // Safety check: prevent division by zero or very small values
    if (scaledSpacing <= 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }
    
    const margin = Math.max(viewportWidth, viewportHeight) * 0.2; // Add margin around viewport
    const left = -margin;
    const right = viewportWidth + margin;
    const top = -margin;
    const bottom = viewportHeight + margin;

    return {
      left: Math.floor(left / scaledSpacing) * scaledSpacing,
      right: Math.ceil(right / scaledSpacing) * scaledSpacing,
      top: Math.floor(top / scaledSpacing) * scaledSpacing,
      bottom: Math.ceil(bottom / scaledSpacing) * scaledSpacing,
    };
  }, [viewportWidth, viewportHeight, scaledSpacing]);

  // Generate horizontal lines
  const horizontalLinesElements = useMemo(() => {
    if (!horizontalLines) return [];

    const lines = [];
    for (let y = gridBounds.top; y <= gridBounds.bottom; y += scaledSpacing) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={gridBounds.left}
          y1={y}
          x2={gridBounds.right}
          y2={y}
          stroke={gridColor}
          strokeWidth={strokeWidth}
          opacity={0.25}
        />
      );
    }
    return lines;
  }, [horizontalLines, gridBounds, scaledSpacing, gridColor, strokeWidth]);

  // Generate vertical lines
  const verticalLinesElements = useMemo(() => {
    if (!verticalLines) return [];

    const lines = [];
    for (let x = gridBounds.left; x <= gridBounds.right; x += scaledSpacing) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={gridBounds.top}
          x2={x}
          y2={gridBounds.bottom}
          stroke={gridColor}
          strokeWidth={strokeWidth}
          opacity={0.25}
        />
      );
    }
    return lines;
  }, [verticalLines, gridBounds, scaledSpacing, gridColor, strokeWidth]);

  // Generate left-to-right diagonal lines
  const leftRightDiagonalElements = useMemo(() => {
    if (!leftRightDiagonal) return [];

    const diagonalSpacing = scaledSpacing * Math.sqrt(2);
    const maxDimension = Math.max(viewportWidth, viewportHeight);
    const startX = gridBounds.left - maxDimension;
    const endX = gridBounds.right + maxDimension;

    const lines = [];
    for (let offset = 0; offset <= endX - startX; offset += diagonalSpacing) {
      const x1 = startX + offset;
      const y1 = gridBounds.top;
      const x2 = x1 + maxDimension;
      const y2 = gridBounds.bottom;

      lines.push(
        <line
          key={`lr-${offset}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={gridColor}
          strokeWidth={strokeWidth}
          opacity={0.15}
        />
      );
    }
    return lines;
  }, [
    leftRightDiagonal,
    gridBounds,
    scaledSpacing,
    gridColor,
    strokeWidth,
    viewportWidth,
    viewportHeight,
  ]);

  // Generate right-to-left diagonal lines
  const rightLeftDiagonalElements = useMemo(() => {
    if (!rightLeftDiagonal) return [];

    const diagonalSpacing = scaledSpacing * Math.sqrt(2);
    const maxDimension = Math.max(viewportWidth, viewportHeight);
    const startX = gridBounds.left - maxDimension;
    const endX = gridBounds.right + maxDimension;

    const lines = [];
    for (let offset = 0; offset <= endX - startX; offset += diagonalSpacing) {
      const x1 = startX + offset;
      const y1 = gridBounds.bottom;
      const x2 = x1 + maxDimension;
      const y2 = gridBounds.top;

      lines.push(
        <line
          key={`rl-${offset}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={gridColor}
          strokeWidth={strokeWidth}
          opacity={0.15}
        />
      );
    }
    return lines;
  }, [
    rightLeftDiagonal,
    gridBounds,
    scaledSpacing,
    gridColor,
    strokeWidth,
    viewportWidth,
    viewportHeight,
  ]);

  // Generate concentric circles
  const concentricCirclesElements = useMemo(() => {
    if (!concentricCircles) return [];

    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const maxRadius = Math.max(viewportWidth, viewportHeight) * 0.6;

    const circles = [];
    for (
      let radius = scaledSpacing;
      radius <= maxRadius;
      radius += scaledSpacing
    ) {
      circles.push(
        <circle
          key={`c-${radius}`}
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke={gridColor}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.15}
        />
      );
    }
    return circles;
  }, [
    concentricCircles,
    scaledSpacing,
    gridColor,
    strokeWidth,
    viewportWidth,
    viewportHeight,
  ]);

  // Generate crosshatch grid pattern (performance-friendly alternative to dots)
  const crosshatchElements = useMemo(() => {
    if (!dotted) return [];

    const lines = [];
    const crosshatchSpacing = scaledSpacing * 2; // Wider spacing for crosshatch
    
    // Generate diagonal lines in both directions for crosshatch effect
    const maxDimension = Math.max(viewportWidth, viewportHeight) * 1.5;
    
    // Left-to-right diagonal lines (45 degrees)
    for (let offset = -maxDimension; offset <= maxDimension; offset += crosshatchSpacing) {
      const x1 = offset;
      const y1 = 0;
      const x2 = offset + maxDimension;
      const y2 = maxDimension;
      
      lines.push(
        <line
          key={`cross-lr-${offset}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={gridColor}
          strokeWidth={strokeWidth * 0.5}
          opacity={0.1}
        />
      );
    }
    
    // Right-to-left diagonal lines (-45 degrees)
    for (let offset = -maxDimension; offset <= maxDimension; offset += crosshatchSpacing) {
      const x1 = offset;
      const y1 = maxDimension;
      const x2 = offset + maxDimension;
      const y2 = 0;
      
      lines.push(
        <line
          key={`cross-rl-${offset}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={gridColor}
          strokeWidth={strokeWidth * 0.5}
          opacity={0.1}
        />
      );
    }
    
    return lines;
  }, [
    dotted,
    scaledSpacing,
    gridColor,
    strokeWidth,
    viewportWidth,
    viewportHeight,
  ]);

  // Check if any grid type is enabled
  const hasAnyGridEnabled = horizontalLines || verticalLines || leftRightDiagonal || rightLeftDiagonal || concentricCircles || dotted;
  
  // Don't render if no grid types are enabled
  if (!hasAnyGridEnabled) return null;

  return (
    <g id="canvas-grid" data-theme-ignore>
      {horizontalLinesElements}
      {verticalLinesElements}
      {leftRightDiagonalElements}
      {rightLeftDiagonalElements}
      {concentricCirclesElements}
      {crosshatchElements}
    </g>
  );
};
