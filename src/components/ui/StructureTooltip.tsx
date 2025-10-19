import React from 'react';

import { LEFT_PANEL_WIDTH } from '../../App';

export interface StructureTooltipProps {
  mouseOverText: string;
  mouseOverTextDimensions: {
    width: number;
    height: number;
  };
  mouseUIPosition: {
    x: number;
    y: number;
  };
  parentDivResizeDetector: {
    width?: number;
    height?: number;
  };
  TOPBAR_HEIGHT: number;
  MOUSE_OVER_TEXT_FONT_SIZE: number;
  mouseOverTextSvgTextElementReference: React.RefObject<SVGTextElement>;
}

export const StructureTooltip: React.FC<StructureTooltipProps> = ({
  mouseOverText,
  mouseOverTextDimensions,
  mouseUIPosition,
  parentDivResizeDetector,
  TOPBAR_HEIGHT,
  MOUSE_OVER_TEXT_FONT_SIZE,
  mouseOverTextSvgTextElementReference,
}) => {
  if (mouseOverText.length === 0) {
    return null;
  }

  const tooltipX = Math.max(
    0,
    Math.min(
      mouseUIPosition.x + 12,
      Math.max(
        (parentDivResizeDetector.width ?? 0) - LEFT_PANEL_WIDTH,
        0
      ) -
      (mouseOverTextDimensions.width + 12)
    )
  );

  const tooltipY = Math.max(
    0,
    Math.min(
      mouseUIPosition.y + 12,
      Math.max(
        (parentDivResizeDetector.height ?? 0) - TOPBAR_HEIGHT,
        0
      ) -
      (mouseOverTextDimensions.height + 12)
    )
  );

  return (
    <g
      id="structure-tooltip"
      style={{
        display: "inline",
        filter: "url(#xrTooltipShadow)",
      }}
      transform={`translate(${tooltipX}, ${tooltipY})`}
    >
      {/* Tooltip Background */}
      <rect
        x={0}
        y={0}
        width={mouseOverTextDimensions.width + 16}
        height={mouseOverTextDimensions.height + 16}
        fill="#f8fafc"
        stroke="#cbd5e1"
        rx={8}
        ry={8}
        strokeWidth={1.5}
      />
      
      {/* Tooltip Text */}
      <text
        fill="#1e293b"
        stroke="none"
        x={8}
        y={8 + MOUSE_OVER_TEXT_FONT_SIZE}
        ref={mouseOverTextSvgTextElementReference}
        xmlSpace="preserve"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontSize={MOUSE_OVER_TEXT_FONT_SIZE}
        fontWeight="500"
      >
        {mouseOverText
          .split("\n")
          .map((line, idx) => (
            <tspan
              key={idx}
              x={8}
              dy={
                idx === 0
                  ? 0
                  : MOUSE_OVER_TEXT_FONT_SIZE * 1.4
              }
            >
              {line}
            </tspan>
          ))}
      </text>
    </g>
  );
};
