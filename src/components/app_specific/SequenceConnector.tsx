import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import { FullKeys } from "../../App";
import { Context } from "../../context/Context";
import Color, { toCSS, BLACK } from "../../data_structures/Color";
import { Vector2D } from "../../data_structures/Vector2D";
import { Nucleotide } from "./Nucleotide";
import { SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import { getLineBoundingPath } from "../../utils/Utils";

// Gap distance from nucleotide center to connector endpoint
const ENDPOINT_GAP = 5;

export namespace SequenceConnector {
  export type Props = Nucleotide.SequenceConnector.Props & {
    start: Vector2D;
    end: Vector2D;
    fullKeys: FullKeys; // Keys of the START nucleotide
    id: string;
  };

  export function Component(props: Props) {
    const {
      start,
      end,
      breakpoints,
      color,
      strokeWidth,
      opacity,
      dashArray,
      curvature,
      showDirectionArrow,
      showBreakpoints = true,
      arrowColor,
      arrowShape = 'triangle',
      arrowPosition = 0.5,
      arrowSize: arrowSizeProp,
      fullKeys,
      id
    } = props;

    // Context for interaction handlers
    const bodyOnMouseDownHelper = useContext(Context.SequenceConnector.Body.OnMouseDownHelper);
    const breakpointOnMouseDownHelper = useContext(Context.SequenceConnector.Breakpoint.OnMouseDownHelper);
    const setMouseOverText = useContext(Context.App.SetMouseOverText);
    const firstNucleotideIndex = useContext(Context.RnaMolecule.FirstNucleotideIndex);
    const rnaComplexName = useContext(Context.RnaComplex.Name);
    const {
      nucleotideIndex,
      rnaMoleculeName,
      rnaComplexIndex
    } = fullKeys;

    const finalStrokeWidth = strokeWidth ?? 1.5;

    // Calculate offset start and end points (with gap from nucleotide centers)
    const safeBreakpoints = breakpoints ?? [];
    
    // Calculate the adjusted start point (offset away from start nucleotide)
    const adjustedStart = useMemo(() => {
      const nextPoint = safeBreakpoints.length > 0 ? safeBreakpoints[0] : end;
      const dx = nextPoint.x - start.x;
      const dy = nextPoint.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < ENDPOINT_GAP * 2) return start; // Too short, don't adjust
      const offsetX = (dx / len) * ENDPOINT_GAP;
      const offsetY = (dy / len) * ENDPOINT_GAP;
      return { x: start.x + offsetX, y: start.y + offsetY };
    }, [start, end, safeBreakpoints]);

    // Calculate the adjusted end point (offset away from end nucleotide)
    const adjustedEnd = useMemo(() => {
      const prevPoint = safeBreakpoints.length > 0 ? safeBreakpoints[safeBreakpoints.length - 1] : start;
      const dx = prevPoint.x - end.x;
      const dy = prevPoint.y - end.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < ENDPOINT_GAP * 2) return end; // Too short, don't adjust
      const offsetX = (dx / len) * ENDPOINT_GAP;
      const offsetY = (dy / len) * ENDPOINT_GAP;
      return { x: end.x + offsetX, y: end.y + offsetY };
    }, [start, end, safeBreakpoints]);

    const allPoints = [adjustedStart, ...safeBreakpoints, adjustedEnd];

    // State for render data (used for interactive bounding path)
    const [boundingPathD, setBoundingPathD] = useState("");

    // Update bounding path for interaction
    function updateRenderData() {
      const points = [adjustedStart, ...safeBreakpoints, adjustedEnd];
      const paths: string[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        paths.push(getLineBoundingPath(points[i], points[i + 1]));
      }
      setBoundingPathD(paths.join(" "));
    }

    useEffect(() => {
      updateRenderData();
    }, [start, end, breakpoints]);

    // Calculate path data for visual line
    const pathData = useMemo(() => {
      const points = allPoints;
      
      if (points.length < 2) return "";

      const tension = 1 - (curvature ?? 0); // 0 = maximum curve, 1 = straight

      if (points.length === 2 || (curvature ?? 0) === 0) {
        return `M ${points[0].x} ${points[0].y} L ${points.slice(1).map(p => `${p.x} ${p.y}`).join(' L ')}`;
      }

      let d = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const d1x = (p2.x - p0.x) * (1 - tension) / 2;
        const d1y = (p2.y - p0.y) * (1 - tension) / 2;
        const d2x = (p3.x - p1.x) * (1 - tension) / 2;
        const d2y = (p3.y - p1.y) * (1 - tension) / 2;

        const cp1x = p1.x + d1x / 3;
        const cp1y = p1.y + d1y / 3;
        const cp2x = p2.x - d2x / 3;
        const cp2y = p2.y - d2y / 3;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return d;
    }, [adjustedStart, adjustedEnd, breakpoints, curvature]);

    // Arrow logic - position along the path based on arrowPosition (0-1)
    const arrowData = useMemo(() => {
        if (!showDirectionArrow) return null;
        
        const position = Math.max(0, Math.min(1, arrowPosition));
        
        // For simple case with no breakpoints
        if (safeBreakpoints.length === 0) {
            const mx = adjustedStart.x + (adjustedEnd.x - adjustedStart.x) * position;
            const my = adjustedStart.y + (adjustedEnd.y - adjustedStart.y) * position;
            const angle = Math.atan2(adjustedEnd.y - adjustedStart.y, adjustedEnd.x - adjustedStart.x) * 180 / Math.PI;
            return { x: mx, y: my, angle };
        }
        
        // Find total length
        let totalLen = 0;
        const segLens: number[] = [];
        for(let i = 0; i < allPoints.length - 1; i++) {
            const dx = allPoints[i + 1].x - allPoints[i].x;
            const dy = allPoints[i + 1].y - allPoints[i].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            segLens.push(len);
            totalLen += len;
        }
        
        const targetLen = totalLen * position;
        let currentLen = 0;
        let segIndex = 0;
        let t = 0;
        
        for(let i = 0; i < segLens.length; i++) {
            if (currentLen + segLens[i] >= targetLen) {
                segIndex = i;
                t = segLens[i] > 0 ? (targetLen - currentLen) / segLens[i] : 0;
                break;
            }
            currentLen += segLens[i];
        }
        
        const p1 = allPoints[segIndex];
        const p2 = allPoints[segIndex + 1];
        
        const mx = p1.x + (p2.x - p1.x) * t;
        const my = p1.y + (p2.y - p1.y) * t;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        
        return { x: mx, y: my, angle };
    }, [adjustedStart, adjustedEnd, safeBreakpoints, showDirectionArrow, arrowPosition]);


    const finalColor = color ?? BLACK;
    // Handle dash array - empty string or undefined means solid line
    const finalDashArray = dashArray && dashArray.trim() !== '' ? dashArray : undefined;
    
    // Breakpoint size proportional to stroke width
    const bpSize = Math.max(finalStrokeWidth * 0.8, 1);
    // Arrow size - use prop or proportional to stroke width
    const arrowSize = arrowSizeProp ?? Math.max(finalStrokeWidth * 1.5, 2);
    // Arrow color - use prop or line color
    const finalArrowColor = arrowColor ?? finalColor;
    
    // Generate arrow shape based on type - centered at origin
    const getArrowShape = (size: number, shape: Nucleotide.SequenceConnector.ArrowShape) => {
      const h = size * 0.6; // half-height
      switch (shape) {
        case 'triangle':
          // Centered triangle pointing right: tip at +size/2, base at -size/2
          return `${-size * 0.5},${-h} ${size * 0.5},0 ${-size * 0.5},${h}`;
        case 'chevron':
          // Chevron (V shape) pointing right
          return `${-size * 0.4},${-h} ${size * 0.4},0 ${-size * 0.4},${h}`;
        case 'diamond':
          // Diamond centered at origin
          return `${-size * 0.5},0 0,${-h} ${size * 0.5},0 0,${h}`;
        case 'line':
          // Simple line arrow
          return `${-size * 0.3},${-h} ${size * 0.3},0 ${-size * 0.3},${h}`;
        default:
          return `${-size * 0.5},${-h} ${size * 0.5},0 ${-size * 0.5},${h}`;
      }
    };

    const tooltipText = `Sequence Connector\n` +
      `from: ${firstNucleotideIndex + nucleotideIndex}\n` +
      `to:   ${firstNucleotideIndex + nucleotideIndex + 1}\n` +
      `molecule: ${rnaMoleculeName}\n` +
      `tip: Ctrl+click to add breakpoint, Right-click for properties`;

    return (
      <g 
        id={id}
        {...{ [SVG_PROPERTY_XRNA_TYPE]: "sequence_connector" }}
      >
        {/* Visual path (non-interactive) */}
        <path
          d={pathData}
          stroke={toCSS(finalColor)}
          strokeWidth={finalStrokeWidth}
          strokeOpacity={opacity ?? 1}
          strokeDasharray={finalDashArray || 'none'}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
        
        {/* Interactive bounding path for clicks */}
        <path
          d={boundingPathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(finalStrokeWidth * 3, 6)}
          pointerEvents="stroke"
          style={{ cursor: "pointer" }}
          onMouseDown={(e) => {
            bodyOnMouseDownHelper(e, fullKeys, updateRenderData);
            e.preventDefault();
          }}
          onMouseOver={() => setMouseOverText(tooltipText)}
          onMouseLeave={() => setMouseOverText("")}
        />
        
        {/* Draggable breakpoints - small circles matching line width */}
        {showBreakpoints && safeBreakpoints.map((bp, i) => (
          <g key={i}>
            {/* Small circle for breakpoint */}
            <circle
              cx={bp.x}
              cy={bp.y}
              r={bpSize}
              fill={toCSS(finalColor)}
              fillOpacity={0.8}
              stroke={toCSS(finalColor)}
              strokeWidth={finalStrokeWidth * 0.3}
              style={{ cursor: "move" }}
              pointerEvents="all"
              onMouseDown={(e) => {
                breakpointOnMouseDownHelper(e, fullKeys, i, updateRenderData);
                e.preventDefault();
              }}
              onMouseOver={() => setMouseOverText(
                `Breakpoint ${i + 1}\n` +
                `tip: Drag to move, Ctrl+click to delete`
              )}
              onMouseLeave={() => setMouseOverText("")}
            />
            {/* Larger invisible hit area for easier clicking */}
            <circle
              cx={bp.x}
              cy={bp.y}
              r={Math.max(bpSize * 3, 4)}
              fill="transparent"
              stroke="none"
              style={{ cursor: "move" }}
              pointerEvents="all"
              onMouseDown={(e) => {
                breakpointOnMouseDownHelper(e, fullKeys, i, updateRenderData);
                e.preventDefault();
              }}
              onMouseOver={() => setMouseOverText(
                `Breakpoint ${i + 1}\n` +
                `tip: Drag to move, Ctrl+click to delete`
              )}
              onMouseLeave={() => setMouseOverText("")}
            />
          </g>
        ))}
        
        {arrowData && (
          <g transform={`translate(${arrowData.x}, ${arrowData.y}) rotate(${arrowData.angle})`}>
            {arrowShape === 'chevron' || arrowShape === 'line' ? (
              <polyline
                points={getArrowShape(arrowSize, arrowShape)}
                fill="none"
                stroke={toCSS(finalArrowColor)}
                strokeWidth={finalStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />
            ) : (
              <polygon
                points={getArrowShape(arrowSize, arrowShape)}
                fill={toCSS(finalArrowColor)}
                stroke="none"
                fillOpacity={opacity ?? 0.9}
                pointerEvents="none"
              />
            )}
          </g>
        )}
      </g>
    );
  }
  
  export const MemoizedComponent = memo(Component);
}
