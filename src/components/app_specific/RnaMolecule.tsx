import { Fragment, createElement, useContext, useEffect, useMemo } from "react";
import { Context, NucleotideKeysToRerenderPerRnaMolecule } from "../../context/Context";
import Scaffolding from "../generic/Scaffolding";
import { Nucleotide } from "./Nucleotide";
import { SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX, SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import Color, { BLACK, areEqual } from "../../data_structures/Color";
import Font, { PartialFont, parseFontSize } from "../../data_structures/Font";
import { Setting } from "../../ui/Setting";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { SequenceConnector } from "./SequenceConnector";

export namespace RnaMolecule {
  export type ExternalProps = {
    firstNucleotideIndex : number,
    nucleotideProps : Record<number, Nucleotide.ExternalProps>
  };

  export type Props = ExternalProps & {
    nucleotideKeysToRerender : NucleotideKeysToRerenderPerRnaMolecule
  };

  export function Component(props : Props) {
    const {
      firstNucleotideIndex,
      nucleotideProps,
      nucleotideKeysToRerender
    } = props;
    // Begin context data
    const name = useContext(Context.RnaMolecule.Name);
    const rnaComplexIndex = useContext(Context.RnaComplex.Index);
    const updateLabelContentDefaultStyle = useContext(Context.Label.Content.UpdateDefaultStyle);
    const settingsRecord = useContext(Context.App.Settings);
    const displayContourLineFlag = settingsRecord[Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] as boolean;
    const contourLineWidth = settingsRecord[Setting.CONTOUR_LINE_WIDTH] as number;
    const pathModeFlag = settingsRecord[Setting.PATH_MODE] as boolean;
    const pathLineWidth = settingsRecord[Setting.PATH_LINE_WIDTH] as number;
    const indicesOfFrozenNucleotides = useContext(Context.App.IndicesOfFrozenNucleotides);
    // Begin memo data
    // const flattenedNucleotideProps = useMemo(
    //   function() {
    //     const flattenedNucleotideProps = Object.entries(nucleotideProps).map(function([
    //       nucleotideIndexAsString,
    //       singularNucleotideProps
    //     ]) {
    //       return {
    //         scaffoldingKey : Number.parseInt(nucleotideIndexAsString),
    //         props : singularNucleotideProps
    //       };
    //     });
    //     flattenedNucleotideProps.sort(function(
    //       singularFlattenedNucleotideProps0,
    //       singularFlattenedNucleotideProps1
    //     ) {
    //       return singularFlattenedNucleotideProps0.scaffoldingKey - singularFlattenedNucleotideProps1.scaffoldingKey
    //     });
    //     return flattenedNucleotideProps;
    //   },
    //   [nucleotideProps]
    // );
    // const renderedNucleotides = useMemo(
    //   function() {
    //     return flattenedNucleotideProps.map(function({ scaffoldingKey, props }) {
    //       const finalizedProps = props as Nucleotide.Props & { scaffoldingKey : number };
    //       finalizedProps.scaffoldingKey = scaffoldingKey;
    //       return <Fragment
    //         key = {scaffoldingKey}
    //       >
    //         {createElement(
    //           Nucleotide.Component,
    //           finalizedProps
    //         )}
    //       </Fragment>
    //     });
    //   },
    //   [flattenedNucleotideProps]
    // );
    
    const flattenedNucleotideProps = useMemo(
      function() {
        const flattenedNucleotideProps = Object.entries(nucleotideProps).map(function([
          nucleotideIndexAsString,
          singularNucleotideProps
        ]) {
          const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
          const finalizedProps = singularNucleotideProps as Nucleotide.ExternalProps & { nucleotideIndex : number, key : number };
          finalizedProps.key = nucleotideIndex;
          finalizedProps.nucleotideIndex = nucleotideIndex;
          return finalizedProps;
        });
        flattenedNucleotideProps.sort(function(
          singularFlattenedNucleotideProps0,
          singularFlattenedNucleotideProps1
        ) {
          return singularFlattenedNucleotideProps0.nucleotideIndex - singularFlattenedNucleotideProps1.nucleotideIndex
        });
        return flattenedNucleotideProps;
      },
      [nucleotideProps, nucleotideKeysToRerender]
    );
    // Group consecutive frozen nucleotides and create unified outlines
    const frozenNucleotideOutlines = useMemo(
      function() {
        // Check if this RNA molecule has frozen nucleotides
        if (!(rnaComplexIndex in indicesOfFrozenNucleotides)) return [];
        const indicesOfFrozenNucleotidesPerRnaComplex = indicesOfFrozenNucleotides[rnaComplexIndex];
        if (!(name in indicesOfFrozenNucleotidesPerRnaComplex)) return [];
        const frozenIndices = indicesOfFrozenNucleotidesPerRnaComplex[name];
        
        // Group consecutive frozen nucleotides
        const groups: Array<{ nucleotideIndex: number, x: number, y: number, font?: Font }[]> = [];
        let currentGroup: Array<{ nucleotideIndex: number, x: number, y: number, font?: Font }> = [];
        
        for (const props of flattenedNucleotideProps) {
          const isFrozen = frozenIndices.has(props.nucleotideIndex);
          
          if (isFrozen) {
            currentGroup.push({
              nucleotideIndex: props.nucleotideIndex,
              x: props.x,
              y: props.y,
              font: props.font
            });
          } else if (currentGroup.length > 0) {
            groups.push(currentGroup);
            currentGroup = [];
          }
        }
        
        // Don't forget the last group
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        
        // Helper function to calculate convex hull using Graham scan
        function convexHull(points: Array<{ x: number, y: number }>): Array<{ x: number, y: number }> {
          if (points.length < 3) return points;
          
          // Find the point with the lowest y-coordinate (and leftmost if tied)
          let start = points[0];
          for (let i = 1; i < points.length; i++) {
            if (points[i].y < start.y || (points[i].y === start.y && points[i].x < start.x)) {
              start = points[i];
            }
          }
          
          // Sort points by polar angle with respect to start point
          const sortedPoints = points.slice().sort((a, b) => {
            const angleA = Math.atan2(a.y - start.y, a.x - start.x);
            const angleB = Math.atan2(b.y - start.y, b.x - start.x);
            if (angleA !== angleB) return angleA - angleB;
            // If angles are equal, sort by distance
            const distA = Math.hypot(a.x - start.x, a.y - start.y);
            const distB = Math.hypot(b.x - start.x, b.y - start.y);
            return distA - distB;
          });
          
          const hull: Array<{ x: number, y: number }> = [sortedPoints[0], sortedPoints[1]];
          
          for (let i = 2; i < sortedPoints.length; i++) {
            while (hull.length > 1) {
              const p1 = hull[hull.length - 2];
              const p2 = hull[hull.length - 1];
              const p3 = sortedPoints[i];
              const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
              if (cross > 0) break;
              hull.pop();
            }
            hull.push(sortedPoints[i]);
          }
          
          return hull;
        }
        
        // Create outline paths for each group
        return groups.map(function(group) {
          const fontSize = group[0].font?.size ?? Font.DEFAULT_SIZE;
          const avgFontSize = typeof fontSize === "string" ? parseFontSize(fontSize) : fontSize;
          const strokeWidth = Math.max(avgFontSize / 12, 0.5);
          
          if (group.length === 1) {
            // Single nucleotide - render a circle
            const nucleotide = group[0];
            const radius = (avgFontSize / 2) * 1.3;
            
            return {
              type: 'circle' as const,
              x: nucleotide.x,
              y: nucleotide.y,
              radius,
              strokeWidth,
              indices: [nucleotide.nucleotideIndex]
            };
          }
          
          // Multiple consecutive nucleotides - create convex hull outline
          const radius = (avgFontSize / 2) * 1.3;
          
          // Create padding points around each nucleotide to form a hull
          const paddedPoints: Array<{ x: number, y: number }> = [];
          const angleSteps = 8; // Number of points to place around each nucleotide
          
          for (const nucleotide of group) {
            for (let i = 0; i < angleSteps; i++) {
              const angle = (i / angleSteps) * 2 * Math.PI;
              paddedPoints.push({
                x: nucleotide.x + radius * Math.cos(angle),
                y: nucleotide.y + radius * Math.sin(angle)
              });
            }
          }
          
          // Calculate convex hull
          const hull = convexHull(paddedPoints);
          
          // Create a smooth path from the hull points
          if (hull.length < 3) {
            // Fallback to circle if hull calculation fails
            const firstNucleotide = group[0];
            return {
              type: 'circle' as const,
              x: firstNucleotide.x,
              y: firstNucleotide.y,
              radius,
              strokeWidth,
              indices: group.map(n => n.nucleotideIndex)
            };
          }
          
          // Create a smooth curved path through the hull points
          let pathData = `M ${hull[0].x} ${hull[0].y}`;
          
          for (let i = 1; i < hull.length; i++) {
            pathData += ` L ${hull[i].x} ${hull[i].y}`;
          }
          pathData += ' Z';
          
          return {
            type: 'path' as const,
            path: pathData,
            strokeWidth,
            indices: group.map(n => n.nucleotideIndex)
          };
        });
      },
      [flattenedNucleotideProps, indicesOfFrozenNucleotides, rnaComplexIndex, name]
    );
    // const renderedNucleotides = useMemo(
    //   function() {
      // return renderedNucleotides;
    //   },
    //   [nucleotideProps]
    // );
    // Begin effects.
    useEffect(
      function() {
        type FontWithCount = { font : PartialFont, count : number };
        type ColorWithCount = { color : Color, count : number };

        const colorsWithCounts = new Array<ColorWithCount>();
        const fontsWithCounts = new Array<FontWithCount>();
        let fontSizeSum = 0;
        let countOfLabelContents = 0;
        for (const singularNucleotideProps of Object.values(nucleotideProps)) {
          const {
            labelContentProps
          } = singularNucleotideProps;
          if (labelContentProps !== undefined) {
            const {
              font,
              color
            } = labelContentProps;
            if (font !== undefined) {
              countOfLabelContents++;
              if (typeof font.size === "string") {
                fontSizeSum += parseFontSize(font.size);
              } else {
                fontSizeSum += font.size;
              }
              let foundFontFlag = false;
              for (const fontWithCount of fontsWithCounts) {
                if (PartialFont.areEqual(
                  font,
                  fontWithCount.font
                )) {
                  fontWithCount.count++;
                  foundFontFlag = true;
                  break;
                }
              }
              if (!foundFontFlag) {
                fontsWithCounts.push({
                  font,
                  count : 1
                });
              }
            }
            if (color !== undefined) {
              let foundColorFlag = false;
              for (const colorWithCount of colorsWithCounts) {
                if (areEqual(
                  color,
                  colorWithCount.color
                )) {
                  colorWithCount.count++;
                  foundColorFlag = true;
                  break;
                }
              }
              if (!foundColorFlag) {
                colorsWithCounts.push({
                  color,
                  count : 1
                });
              }
            }
          }
        }
        let mostCommonFont : FontWithCount = { font : structuredClone(Font.DEFAULT), count : 0 };
        for (const fontWithCount of fontsWithCounts) {
          if (fontWithCount.count > mostCommonFont.count) {
            mostCommonFont = fontWithCount;
          }
        }
        let mostCommonColor : ColorWithCount = { color : structuredClone(BLACK), count : 0 };
        for (const colorWithCount of colorsWithCounts) {
          if (colorWithCount.count < mostCommonColor.count) {
            mostCommonColor = colorWithCount;
          }
        }
        const averageFontSize = countOfLabelContents === 0 ? Font.DEFAULT_SIZE : fontSizeSum / countOfLabelContents;
        updateLabelContentDefaultStyle(
          rnaComplexIndex,
          name,
          {
            color : mostCommonColor.color,
            font : {
              ...mostCommonFont.font,
              size : averageFontSize
            }
          }
        );
      },
      [
        rnaComplexIndex,
        name,
        nucleotideProps
      ]
    );
    return <g
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.RNA_MOLECULE,
        [SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME] : name,
        [SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX] : firstNucleotideIndex
      }}
    >
      {displayContourLineFlag && <polyline
        points = {flattenedNucleotideProps.map(function({ x, y }) {
          return `${x},${y}`;
        }).join(" ")}
        pointerEvents = "none"
        stroke = "var(--color-text)"
        strokeWidth = {contourLineWidth}
        fill = "none"
      />}
      {/* Render path line in path mode */}
      {pathModeFlag && !displayContourLineFlag && (() => {
        // Helper function to create smooth curved path using Catmull-Rom splines
        const createCurvedPath = (points: Array<{ x: number, y: number }>, curvature: number): string => {
          if (points.length < 2) return '';
          if (points.length === 2 || curvature === 0) {
            // Straight line for 2 points or no curvature
            return `M ${points[0].x} ${points[0].y} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
          }
          
          // Catmull-Rom spline with tension controlled by curvature
          const tension = 1 - curvature; // 0 = maximum curve, 1 = straight
          let path = `M ${points[0].x} ${points[0].y}`;
          
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;
            
            // Calculate control points for cubic Bezier curve
            const t = tension;
            const d1x = (p2.x - p0.x) * (1 - t) / 2;
            const d1y = (p2.y - p0.y) * (1 - t) / 2;
            const d2x = (p3.x - p1.x) * (1 - t) / 2;
            const d2y = (p3.y - p1.y) * (1 - t) / 2;
            
            const cp1x = p1.x + d1x / 3;
            const cp1y = p1.y + d1y / 3;
            const cp2x = p2.x - d2x / 3;
            const cp2y = p2.y - d2y / 3;
            
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
          }
          
          return path;
        };
        
        // Group consecutive nucleotides by their path properties
        const pathSegments: Array<{
          points: Array<{ x: number, y: number }>,
          color: string,
          width: number,
          curvature: number
        }> = [];
        
        let currentSegment: {
          points: Array<{ x: number, y: number }>,
          color: string,
          width: number,
          curvature: number
        } | null = null;
        
        for (const nucleotide of flattenedNucleotideProps) {
          const color = nucleotide.pathColor 
            ? `rgb(${nucleotide.pathColor.red}, ${nucleotide.pathColor.green}, ${nucleotide.pathColor.blue})`
            : 'var(--color-text)';
          const width = nucleotide.pathLineWidth ?? pathLineWidth;
          const curvature = nucleotide.pathCurvature ?? 0;
          
          if (!currentSegment || currentSegment.color !== color || currentSegment.width !== width || currentSegment.curvature !== curvature) {
            if (currentSegment && currentSegment.points.length > 0) {
              // Add the first point of the new segment to connect them
              currentSegment.points.push({ x: nucleotide.x, y: nucleotide.y });
              pathSegments.push(currentSegment);
            }
            currentSegment = {
              points: [{ x: nucleotide.x, y: nucleotide.y }],
              color,
              width,
              curvature
            };
          } else {
            currentSegment.points.push({ x: nucleotide.x, y: nucleotide.y });
          }
        }
        
        if (currentSegment && currentSegment.points.length > 0) {
          pathSegments.push(currentSegment);
        }
        
        return <>
          {pathSegments.map((segment, index) => (
            <path
              key={`path-segment-${index}`}
              d={createCurvedPath(segment.points, segment.curvature)}
              pointerEvents="none"
              stroke={segment.color}
              strokeWidth={segment.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-xrna_type="path"
            />
          ))}
        </>;
      })()}
      {/* Centerline path - always rendered but hidden by default */}
      {!displayContourLineFlag && flattenedNucleotideProps.length > 0 && (() => {
        // Helper function to create smooth curved path using Catmull-Rom splines
        const createCurvedPath = (points: Array<{ x: number, y: number }>, curvature: number): string => {
          if (points.length < 2) return '';
          if (points.length === 2 || curvature === 0) {
            // Straight line for 2 points or no curvature
            return `M ${points[0].x} ${points[0].y} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
          }
          
          // Catmull-Rom spline with tension controlled by curvature
          const tension = 1 - curvature; // 0 = maximum curve, 1 = straight
          let path = `M ${points[0].x} ${points[0].y}`;
          
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;
            
            // Calculate control points for cubic Bezier curve
            const t = tension;
            const d1x = (p2.x - p0.x) * (1 - t) / 2;
            const d1y = (p2.y - p0.y) * (1 - t) / 2;
            const d2x = (p3.x - p1.x) * (1 - t) / 2;
            const d2y = (p3.y - p1.y) * (1 - t) / 2;
            
            const cp1x = p1.x + d1x / 3;
            const cp1y = p1.y + d1y / 3;
            const cp2x = p2.x - d2x / 3;
            const cp2y = p2.y - d2y / 3;
            
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
          }
          
          return path;
        };
        
        const centerPoints = flattenedNucleotideProps.map(n => ({ x: n.x, y: n.y }));
        const centerlinePath = createCurvedPath(centerPoints, 0.5);
        
        return <path
          d={centerlinePath}
          pointerEvents="none"
          stroke="rgb(0, 0, 0)"
          strokeWidth={0.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          visibility="hidden"
          data-xrna_type="centerline"
        />;
      })()}
      {!displayContourLineFlag && <Context.RnaMolecule.FirstNucleotideIndex.Provider
        value={firstNucleotideIndex}
      >
        {flattenedNucleotideProps.map(function(finalizedProps) {
          return createElement(
            Nucleotide.MemoizedComponent,
            finalizedProps
          );
        })}
        {flattenedNucleotideProps.map(function(singularNucleotideProps) {
          const { sequenceConnectorToNext, nucleotideIndex } = singularNucleotideProps;
          // Skip if no connector or if connector is marked as deleted
          if (!sequenceConnectorToNext || sequenceConnectorToNext.deleted) return null;
          
          const nextNucleotideProps = nucleotideProps[nucleotideIndex + 1];
          if (!nextNucleotideProps) return null;

          return <SequenceConnector.MemoizedComponent
            key={`${nucleotideIndex}-connector`}
            id={`${rnaComplexIndex}|${name}|${nucleotideIndex}|SequenceConnector`}
            start={{ x: singularNucleotideProps.x, y: singularNucleotideProps.y }}
            end={{ x: nextNucleotideProps.x, y: nextNucleotideProps.y }}
            fullKeys={{
              rnaComplexIndex,
              rnaMoleculeName: name,
              nucleotideIndex
            }}
            {...sequenceConnectorToNext}
          />;
        })}
      </Context.RnaMolecule.FirstNucleotideIndex.Provider>}
      {/* Render unified outlines for consecutive frozen nucleotides */}
      {!displayContourLineFlag && frozenNucleotideOutlines.map(function(outline, index) {
        if (outline.type === 'circle') {
          return <circle
            key={`frozen-outline-${index}`}
            cx={outline.x}
            cy={outline.y}
            r={outline.radius}
            fill="none"
            stroke="#e56565"
            strokeWidth={outline.strokeWidth}
            pointerEvents="none"
          />;
        } else {
          return <path
            key={`frozen-outline-${index}`}
            d={outline.path}
            fill="none"
            stroke="#e56565"
            strokeWidth={outline.strokeWidth}
            pointerEvents="none"
          />;
        }
      })}
    </g>;
  }
}