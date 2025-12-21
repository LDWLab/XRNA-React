import { createRef, memo, useContext, useEffect, useMemo, useState } from "react";
import { Context } from "../../context/Context";
import Color, { BLACK, toCSS } from "../../data_structures/Color";
import Font from "../../data_structures/Font";
import { Vector2D } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";

export namespace TextAnnotation {
  export type SvgRepresentation = SVGTextElement;

  export type Props = Vector2D & {
    id: string;
    content: string;
    font?: Font;
    color?: Color;
    strokeColor?: Color;
    strokeWidth?: number;
    strokeOpacity?: number;
    opacity?: number;
    rotation?: number; // degrees
    backgroundColor?: Color;
    padding?: number;
    borderColor?: Color;
    borderWidth?: number;
    borderRadius?: number;
  };

  export const TEXT_ANNOTATION_CLASS_NAME = "text-annotation";

  export function Component(props: Props) {
    const {
      id,
      content,
      x,
      y,
    } = props;

    // Begin reference data.
    const textRef = createRef<SVGTextElement>();
    
    // Begin context data.
    const onMouseDownHelper = useContext(Context.TextAnnotation.OnMouseDownHelper);
    const setMouseOverText = useContext(Context.App.SetMouseOverText);
    const rnaComplexIndex = useContext(Context.RnaComplex.Index);

    // Begin state data.
    const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });
    const [graphicalAdjustment, setGraphicalAdjustment] = useState<Vector2D>({ x: 0, y: 0 });

    // Begin memo data.
    const color = useMemo(() => props.color ?? BLACK, [props.color]);
    const strokeColor = useMemo(() => props.strokeColor, [props.strokeColor]);
    const strokeWidth = useMemo(() => props.strokeWidth ?? 0, [props.strokeWidth]);
    const strokeOpacity = useMemo(() => props.strokeOpacity ?? 1, [props.strokeOpacity]);
    const font = useMemo(() => props.font ?? structuredClone(Font.DEFAULT), [props.font]);
    const opacity = useMemo(() => props.opacity ?? 1, [props.opacity]);
    const rotation = useMemo(() => props.rotation ?? 0, [props.rotation]);
    const hasStroke = strokeColor !== undefined && strokeWidth > 0;
    const backgroundColor = props.backgroundColor;
    const padding = props.padding ?? 4;
    const borderColor = props.borderColor;
    const borderWidth = props.borderWidth ?? 1;
    const borderRadius = props.borderRadius ?? 2;

    // Begin effects.
    useEffect(() => {
      if (textRef.current) {
        const bbox = textRef.current.getBBox();
        setTextDimensions({ width: bbox.width, height: bbox.height });
      }
    }, [content, font.size, font.family]);

    useEffect(() => {
      setGraphicalAdjustment({
        x: textDimensions.width * -0.5,
        y: textDimensions.height * -0.25
      });
    }, [textDimensions]);

    const hasBackground = backgroundColor !== undefined;
    const hasBorder = borderColor !== undefined;

    return (
      <g
        transform={`translate(${x}, ${y}) rotate(${-rotation})`}
        style={{ cursor: 'move' }}
        {...{ [SVG_PROPERTY_XRNA_TYPE]: SvgPropertyXrnaType.TEXT_ANNOTATION }}
      >
        {/* Background rectangle */}
        {(hasBackground || hasBorder) && (
          <rect
            x={graphicalAdjustment.x - padding}
            y={-textDimensions.height - graphicalAdjustment.y - padding}
            width={textDimensions.width + padding * 2}
            height={textDimensions.height + padding * 2}
            fill={hasBackground ? toCSS(backgroundColor) : 'none'}
            stroke={hasBorder ? toCSS(borderColor) : 'none'}
            strokeWidth={hasBorder ? borderWidth : 0}
            rx={borderRadius}
            ry={borderRadius}
            opacity={opacity}
            transform="scale(1, -1)"
          />
        )}
        <text
          ref={textRef}
          className={`${TEXT_ANNOTATION_CLASS_NAME} noselect`}
          transform={`translate(${graphicalAdjustment.x}, ${graphicalAdjustment.y}) scale(1, -1)`}
          fontSize={font.size}
          fontFamily={font.family}
          fontWeight={font.weight}
          fontStyle={font.style}
          stroke={hasStroke ? toCSS(strokeColor) : 'none'}
          strokeWidth={hasStroke ? strokeWidth : 0}
          strokeOpacity={strokeOpacity}
          fill={toCSS(color)}
          opacity={opacity}
          pointerEvents="all"
          onMouseDown={(e) => {
            onMouseDownHelper(e, rnaComplexIndex, id);
            e.preventDefault();
          }}
          onMouseOver={() => {
            setMouseOverText(
              `Text: "${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"\n` +
              `Position: (${x.toFixed(1)}, ${y.toFixed(1)})\n` +
              `tip: Drag to move, Ctrl+click to delete`
            );
          }}
          onMouseLeave={() => {
            setMouseOverText("");
          }}
        >
          {content}
        </text>
      </g>
    );
  }

  export const MemoizedComponent = memo(Component);
}
