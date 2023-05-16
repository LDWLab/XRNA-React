import React, { createRef, FunctionComponent, LegacyRef, useContext, useMemo, useState } from "react";
import { useEffect } from "react";
import { FullKeys } from "../../App";
import { Context } from "../../context/Context";
import Color, { BLACK, toCSS } from "../../data_structures/Color";
import Font from "../../data_structures/Font";
import { Vector2D } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";

export namespace LabelContent {
  export type SvgRepresentation = SVGTextElement;
  
  export type ExternalProps = Vector2D & {
    content : string,
    font? : Font,
    color? : Color,
    strokeWidth? : number
  };

  export type Props = ExternalProps & {
    fullKeys : FullKeys
  };

  export function Component(props : Props) {
    const {
      content,
      x,
      y,
      fullKeys
    } = props;
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex,
    } = fullKeys;

    // Begin reference data.
    const contentSvgTextElementReference = createRef<SVGTextElement>();
    // Begin context data.
    const conditionallySetVisibility = useContext(Context.App.ConditionallySetVisibility);
    const onMouseDownHelper = useContext(Context.Label.Content.OnMouseDownHelper);

    // Begin state data.
    const [
      contentDimensions, 
      setContentDimensions
    ] = useState({
      width : 0,
      height : 0
    });
    const [
      graphicalAdjustment,
      setGraphicalAdjustment
    ] = useState<Vector2D>({
      x : 0,
      y : 0
    });
    const [
      strokeVisibilityFlag,
      setStrokeVisibilityFlag
    ] = useState(false);
    // Begin memo data.
    const color = useMemo(
      function() {
        return props.color ?? BLACK;
      },
      [props.color]
    );
    const strokeWidth = useMemo(
      function() {
        return props.strokeWidth ?? DEFAULT_STROKE_WIDTH;
      },
      [props.strokeWidth]
    );
    const font = useMemo(
      function() {
        return props.font ?? Font.DEFAULT;
      },
      [props.font]
    );
    // Begin effects.
    useEffect(
      function() {
        let contentBoundingBox = (contentSvgTextElementReference.current as SVGTextElement).getBBox();
        setContentDimensions({
          width : contentBoundingBox.width,
          height : contentBoundingBox.height
        });
      },
      [
        content,
        font.size
      ]
    );
    useEffect(
      function() {
        setGraphicalAdjustment({
          x : contentDimensions.width * -0.5,
          y : contentDimensions.height * -0.25
        });
      },
      [contentDimensions]
    );
    return <g
      transform = {`translate(${x + graphicalAdjustment.x} ${y + graphicalAdjustment.y})`}
    >
      <text
        ref = {contentSvgTextElementReference}
        transform = "scale(1 -1)"
        fontSize = {font.size}
        fontFamily = {font.family}
        fontWeight = {font.weight}
        fontStyle = {font.style}
        stroke = {strokeVisibilityFlag ? "red" : "none"}
        strokeWidth = {strokeWidth}
        fill = {toCSS(color)}
        onMouseDown = {function(e) {
          onMouseDownHelper(
            e,
            fullKeys
          );
          e.preventDefault();
        }}
        onMouseOver = {function() {
          conditionallySetVisibility(setStrokeVisibilityFlag);
        }}
        onMouseLeave = {function() {
          setStrokeVisibilityFlag(false);
        }}
      >
        {content}
      </text>
    </g>;
  }
}