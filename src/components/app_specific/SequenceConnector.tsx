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
      arrowPositionRight = 0.5,
      arrowSize: arrowSizeProp,
      isORF,
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

    // Helper: sample point and tangent along curved path
    const getPointOnCurvedPath = useMemo(() => {
        return (position: number) => {
            const points = allPoints;
            if (points.length < 2) return null;
            
            const tension = 1 - (curvature ?? 0);
            const pos = Math.max(0, Math.min(1, position));
            
            // For straight lines (no curvature), use simple interpolation
            if ((curvature ?? 0) === 0) {
                let totalLen = 0;
                const segLens: number[] = [];
                for(let i = 0; i < points.length - 1; i++) {
                    const dx = points[i + 1].x - points[i].x;
                    const dy = points[i + 1].y - points[i].y;
                    segLens.push(Math.sqrt(dx * dx + dy * dy));
                    totalLen += segLens[segLens.length - 1];
                }
                const targetLen = totalLen * pos;
                let currentLen = 0;
                for(let i = 0; i < segLens.length; i++) {
                    if (currentLen + segLens[i] >= targetLen) {
                        const t = segLens[i] > 0 ? (targetLen - currentLen) / segLens[i] : 0;
                        const p1 = points[i], p2 = points[i + 1];
                        return {
                            x: p1.x + (p2.x - p1.x) * t,
                            y: p1.y + (p2.y - p1.y) * t,
                            angle: Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
                        };
                    }
                    currentLen += segLens[i];
                }
                return { x: points[points.length-1].x, y: points[points.length-1].y, angle: 0 };
            }
            
            // For curved paths, sample the bezier curves
            // Build array of bezier segments with their control points
            const beziers: {p0: Vector2D, cp1: Vector2D, cp2: Vector2D, p1: Vector2D}[] = [];
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i === 0 ? i : i - 1];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[i + 2] || p2;
                
                const d1x = (p2.x - p0.x) * (1 - tension) / 2;
                const d1y = (p2.y - p0.y) * (1 - tension) / 2;
                const d2x = (p3.x - p1.x) * (1 - tension) / 2;
                const d2y = (p3.y - p1.y) * (1 - tension) / 2;
                
                beziers.push({
                    p0: p1,
                    cp1: { x: p1.x + d1x / 3, y: p1.y + d1y / 3 },
                    cp2: { x: p2.x - d2x / 3, y: p2.y - d2y / 3 },
                    p1: p2
                });
            }
            
            // Estimate lengths by sampling each bezier
            const samples = 20;
            const segLens: number[] = [];
            let totalLen = 0;
            for (const bez of beziers) {
                let len = 0;
                let prevX = bez.p0.x, prevY = bez.p0.y;
                for (let j = 1; j <= samples; j++) {
                    const t = j / samples;
                    const t2 = t * t, t3 = t2 * t;
                    const mt = 1 - t, mt2 = mt * mt, mt3 = mt2 * mt;
                    const x = mt3 * bez.p0.x + 3 * mt2 * t * bez.cp1.x + 3 * mt * t2 * bez.cp2.x + t3 * bez.p1.x;
                    const y = mt3 * bez.p0.y + 3 * mt2 * t * bez.cp1.y + 3 * mt * t2 * bez.cp2.y + t3 * bez.p1.y;
                    len += Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
                    prevX = x; prevY = y;
                }
                segLens.push(len);
                totalLen += len;
            }
            
            // Find position along curve
            const targetLen = totalLen * pos;
            let currentLen = 0;
            for (let i = 0; i < segLens.length; i++) {
                if (currentLen + segLens[i] >= targetLen || i === segLens.length - 1) {
                    const bez = beziers[i];
                    const localT = segLens[i] > 0 ? (targetLen - currentLen) / segLens[i] : 0;
                    const t = Math.max(0, Math.min(1, localT));
                    const t2 = t * t, t3 = t2 * t;
                    const mt = 1 - t, mt2 = mt * mt, mt3 = mt2 * mt;
                    
                    const x = mt3 * bez.p0.x + 3 * mt2 * t * bez.cp1.x + 3 * mt * t2 * bez.cp2.x + t3 * bez.p1.x;
                    const y = mt3 * bez.p0.y + 3 * mt2 * t * bez.cp1.y + 3 * mt * t2 * bez.cp2.y + t3 * bez.p1.y;
                    
                    // Tangent (derivative of bezier)
                    const dx = 3 * mt2 * (bez.cp1.x - bez.p0.x) + 6 * mt * t * (bez.cp2.x - bez.cp1.x) + 3 * t2 * (bez.p1.x - bez.cp2.x);
                    const dy = 3 * mt2 * (bez.cp1.y - bez.p0.y) + 6 * mt * t * (bez.cp2.y - bez.cp1.y) + 3 * t2 * (bez.p1.y - bez.cp2.y);
                    
                    return { x, y, angle: Math.atan2(dy, dx) * 180 / Math.PI };
                }
                currentLen += segLens[i];
            }
            return { x: points[points.length-1].x, y: points[points.length-1].y, angle: 0 };
        };
    }, [allPoints, curvature]);

    // Arrow logic - position along the path based on arrowPosition (0-1)
    const arrowData = useMemo(() => {
        if (!showDirectionArrow || isORF) return null;
        return getPointOnCurvedPath(arrowPosition);
    }, [showDirectionArrow, isORF, arrowPosition, getPointOnCurvedPath]);

    // ORF: slashes are at fixed positions, lines connect directly to them
    const ORF_SLASH_SPACING = 4; // space between the two slashes
    const ORF_SLASH_HEIGHT = 8; // height of each slash

    // ORF symbol data - position and angle at midpoint, plus gap endpoints for split path
    const orfData = useMemo(() => {
        if (!isORF) return null;
        
        const position = 0.5; // Always at middle
        
        // Calculate total path length
        let totalLen = 0;
        const segLens: number[] = [];
        for(let i = 0; i < allPoints.length - 1; i++) {
            const dx = allPoints[i + 1].x - allPoints[i].x;
            const dy = allPoints[i + 1].y - allPoints[i].y;
            segLens.push(Math.sqrt(dx * dx + dy * dy));
            totalLen += segLens[segLens.length - 1];
        }
        
        // Gap is just for the two slashes (minimal)
        const halfGap = ORF_SLASH_SPACING / 2 + 3; // small gap for slashes only
        const midLen = totalLen * position;
        const gapStartLen = midLen - halfGap;
        const gapEndLen = midLen + halfGap;
        
        // Helper to get point at a specific length along path
        const getPointAtLength = (targetLen: number) => {
            let currentLen = 0;
            for(let i = 0; i < segLens.length; i++) {
                if (currentLen + segLens[i] >= targetLen) {
                    const t = segLens[i] > 0 ? (targetLen - currentLen) / segLens[i] : 0;
                    const p1 = allPoints[i], p2 = allPoints[i + 1];
                    return {
                        x: p1.x + (p2.x - p1.x) * t,
                        y: p1.y + (p2.y - p1.y) * t,
                        angle: Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
                    };
                }
                currentLen += segLens[i];
            }
            // Fallback to end
            const lastIdx = allPoints.length - 1;
            return {
                x: allPoints[lastIdx].x,
                y: allPoints[lastIdx].y,
                angle: Math.atan2(allPoints[lastIdx].y - allPoints[lastIdx - 1].y, 
                                  allPoints[lastIdx].x - allPoints[lastIdx - 1].x) * 180 / Math.PI
            };
        };
        
        const midPoint = getPointAtLength(midLen);
        const gapStart = getPointAtLength(Math.max(0, gapStartLen));
        const gapEnd = getPointAtLength(Math.min(totalLen, gapEndLen));
        
        return {
            x: midPoint.x,
            y: midPoint.y,
            angle: midPoint.angle,
            gapStart,
            gapEnd,
            totalLen
        };
    }, [adjustedStart, adjustedEnd, safeBreakpoints, isORF, allPoints]);

    // For ORF: create two separate path segments (before and after gap)
    const orfPathData = useMemo(() => {
        if (!isORF || !orfData) return { leftPath: '', rightPath: '' };
        
        // Left path: from start to gap start
        const leftPath = `M ${adjustedStart.x} ${adjustedStart.y} L ${orfData.gapStart.x} ${orfData.gapStart.y}`;
        
        // Right path: from gap end to end
        const rightPath = `M ${orfData.gapEnd.x} ${orfData.gapEnd.y} L ${adjustedEnd.x} ${adjustedEnd.y}`;
        
        return { leftPath, rightPath };
    }, [isORF, orfData, adjustedStart, adjustedEnd]);

    // For ORF connectors with breakpoints, we need more complex path calculation
    const orfPathDataComplex = useMemo(() => {
        if (!isORF || !orfData || safeBreakpoints.length === 0) return null;
        
        const halfGap = ORF_SLASH_SPACING / 2 + 3;
        const midLen = orfData.totalLen * 0.5;
        const gapStartLen = midLen - halfGap;
        const gapEndLen = midLen + halfGap;
        
        // Build left path (start to gapStart)
        let leftPoints: Vector2D[] = [adjustedStart];
        let rightPoints: Vector2D[] = [];
        let currentLen = 0;
        let passedGapStart = false;
        let passedGapEnd = false;
        
        for(let i = 0; i < allPoints.length - 1; i++) {
            const p1 = allPoints[i], p2 = allPoints[i + 1];
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const segLen = Math.sqrt(dx * dx + dy * dy);
            
            if (!passedGapStart && currentLen + segLen >= gapStartLen) {
                // Add gap start point
                const t = segLen > 0 ? (gapStartLen - currentLen) / segLen : 0;
                leftPoints.push({ x: p1.x + dx * t, y: p1.y + dy * t });
                passedGapStart = true;
            } else if (!passedGapStart) {
                leftPoints.push(p2);
            }
            
            if (!passedGapEnd && currentLen + segLen >= gapEndLen) {
                // Add gap end point
                const t = segLen > 0 ? (gapEndLen - currentLen) / segLen : 0;
                rightPoints.push({ x: p1.x + dx * t, y: p1.y + dy * t });
                passedGapEnd = true;
                // Add remaining points
                rightPoints.push(p2);
            } else if (passedGapEnd) {
                rightPoints.push(p2);
            }
            
            currentLen += segLen;
        }
        
        // Build path strings
        const leftPath = leftPoints.length >= 2 
            ? `M ${leftPoints[0].x} ${leftPoints[0].y} ` + leftPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
            : '';
        const rightPath = rightPoints.length >= 2
            ? `M ${rightPoints[0].x} ${rightPoints[0].y} ` + rightPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
            : '';
            
        return { leftPath, rightPath };
    }, [isORF, orfData, safeBreakpoints, allPoints, adjustedStart, adjustedEnd]);

    // Final ORF paths (use complex if breakpoints, simple otherwise)
    const finalOrfPaths = useMemo(() => {
        if (!isORF) return null;
        if (safeBreakpoints.length > 0 && orfPathDataComplex) {
            return orfPathDataComplex;
        }
        return orfPathData;
    }, [isORF, safeBreakpoints, orfPathData, orfPathDataComplex]);

    // ORF arrows - one on each side, position controlled by arrowPosition
    const orfArrowLeft = useMemo(() => {
        if (!isORF || !showDirectionArrow || !orfData) return null;
        // Arrow on left segment - arrowPosition controls how far from start (scaled to left segment)
        const leftSegmentLen = orfData.totalLen * 0.5 - (ORF_SLASH_SPACING / 2 + 3);
        const targetLen = leftSegmentLen * arrowPosition;
        
        let currentLen = 0;
        for(let i = 0; i < allPoints.length - 1; i++) {
            const dx = allPoints[i + 1].x - allPoints[i].x;
            const dy = allPoints[i + 1].y - allPoints[i].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);
            if (currentLen + segLen >= targetLen) {
                const t = segLen > 0 ? (targetLen - currentLen) / segLen : 0;
                const p1 = allPoints[i], p2 = allPoints[i + 1];
                return {
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t,
                    angle: Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
                };
            }
            currentLen += segLen;
        }
        return null;
    }, [isORF, showDirectionArrow, orfData, arrowPosition, allPoints]);

    const orfArrowRight = useMemo(() => {
        if (!isORF || !showDirectionArrow || !orfData) return null;
        // Arrow on right segment - arrowPositionRight controls how far from end of gap (scaled to right segment)
        const rightSegmentStart = orfData.totalLen * 0.5 + (ORF_SLASH_SPACING / 2 + 3);
        const rightSegmentLen = orfData.totalLen - rightSegmentStart;
        const targetLen = rightSegmentStart + rightSegmentLen * arrowPositionRight;
        
        let currentLen = 0;
        for(let i = 0; i < allPoints.length - 1; i++) {
            const dx = allPoints[i + 1].x - allPoints[i].x;
            const dy = allPoints[i + 1].y - allPoints[i].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);
            if (currentLen + segLen >= targetLen) {
                const t = segLen > 0 ? (targetLen - currentLen) / segLen : 0;
                const p1 = allPoints[i], p2 = allPoints[i + 1];
                return {
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t,
                    angle: Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
                };
            }
            currentLen += segLen;
        }
        return null;
    }, [isORF, showDirectionArrow, orfData, arrowPositionRight, allPoints]);
        
        
    const finalColor = color ?? BLACK;
    // Handle dash array - same for both continuous and ORF connectors
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
        {/* Visual path - for continuous connectors */}
        {!isORF && (
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
        )}
        
        {/* Visual paths - for ORF connectors (two segments with gap) */}
        {isORF && finalOrfPaths && (
          <>
            <path
              d={finalOrfPaths.leftPath}
              stroke={toCSS(finalColor)}
              strokeWidth={finalStrokeWidth}
              strokeOpacity={opacity ?? 1}
              strokeDasharray={finalDashArray || 'none'}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
            <path
              d={finalOrfPaths.rightPath}
              stroke={toCSS(finalColor)}
              strokeWidth={finalStrokeWidth}
              strokeOpacity={opacity ?? 1}
              strokeDasharray={finalDashArray || 'none'}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          </>
        )}
        
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
        
        {/* Arrow for continuous connectors */}
        {arrowData && !isORF && (
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
        
        {/* Arrows for ORF connectors - one on each side */}
        {orfArrowLeft && (
          <g transform={`translate(${orfArrowLeft.x}, ${orfArrowLeft.y}) rotate(${orfArrowLeft.angle})`}>
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
        {orfArrowRight && (
          <g transform={`translate(${orfArrowRight.x}, ${orfArrowRight.y}) rotate(${orfArrowRight.angle})`}>
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
        
        {/* ORF connector: // symbol at midpoint (forward-leaning slashes) */}
        {orfData && (
          <g transform={`translate(${orfData.x}, ${orfData.y}) rotate(${orfData.angle})`}>
            {/* Left forward slash / (leaning in arrow direction) */}
            <line
              x1={-ORF_SLASH_SPACING / 2 - 2}
              y1={-ORF_SLASH_HEIGHT / 2}
              x2={-ORF_SLASH_SPACING / 2 + 2}
              y2={ORF_SLASH_HEIGHT / 2}
              stroke={toCSS(finalColor)}
              strokeWidth={finalStrokeWidth}
              strokeLinecap="round"
              pointerEvents="none"
            />
            {/* Right forward slash / (leaning in arrow direction) */}
            <line
              x1={ORF_SLASH_SPACING / 2 - 2}
              y1={-ORF_SLASH_HEIGHT / 2}
              x2={ORF_SLASH_SPACING / 2 + 2}
              y2={ORF_SLASH_HEIGHT / 2}
              stroke={toCSS(finalColor)}
              strokeWidth={finalStrokeWidth}
              strokeLinecap="round"
              pointerEvents="none"
            />
          </g>
        )}
      </g>
    );
  }
  
  export const MemoizedComponent = memo(Component);
}
