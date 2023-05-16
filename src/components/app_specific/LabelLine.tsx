import React, { FunctionComponent, LegacyRef, useContext, useEffect, useMemo, useState } from "react";
import { FullKeys } from "../../App";
import { Context } from "../../context/Context";
import Color, { toCSS, BLACK } from "../../data_structures/Color";
import { subtract, scaleUp, orthogonalize, magnitude, add } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";

export namespace LabelLine {
  export type BodySvgRepresentation = SVGPathElement;
  export type EndpointSvgRepresentation = SVGCircleElement;
  export type ExternalProps = {
    x0 : number,
    y0 : number,
    x1 : number,
    y1 : number,
    color? : Color,
    strokeWidth? : number
  };

  export type Props = ExternalProps & {
    fullKeys : FullKeys
  }

  export function Component(props : Props) {
    const {
      fullKeys,
      x0,
      y0,
      x1,
      y1
    } = props;
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = fullKeys;
    // Begin constants.
    const BOUNDING_PATH_RADIUS = 1;
    // Begin context.
    const bodyOnMouseDownHelper = useContext(Context.Label.Line.Body.OnMouseDownHelper);
    const conditionallySetVisibility = useContext(Context.App.ConditionallySetVisibility);
    const endpointOnMouseDownHelper = useContext(Context.Label.Line.Endpoint.OnMouseDownHelper);
    // Begin state data.
    const [
      bodyVisibilityFlag,
      setBodyVisibilityFlag
    ] = useState(false);
    const [
      endpoint0VisibilityFlag,
      setEndpoint0VisibilityFlag
    ] = useState(false);
    const [
      endpoint1VisibilityFlag,
      setEndpoint1VisibilityFlag
    ] = useState(false);
    const endpoint0 = {
      x : x0,
      y : y0
    };
    const endpoint1 = {
      x : x1,
      y : y1
    }
    const difference = subtract(endpoint1, endpoint0);
    const radius = BOUNDING_PATH_RADIUS;
    const scaledOrthogonal = scaleUp(orthogonalize(difference), BOUNDING_PATH_RADIUS / magnitude(difference));
    const endpoint0TranslatedPositively = add(endpoint0, scaledOrthogonal);
    const endpoint0TranslatedNegatively = subtract(endpoint0, scaledOrthogonal);
    const endpoint1TranslatedPositively = add(endpoint1, scaledOrthogonal);
    const endpoint1TranslatedNegatively = subtract(endpoint1, scaledOrthogonal);
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
    return <g>
      <line
        pointerEvents = "none"
        x1 = {x0}
        y1 = {y0}
        x2 = {x1}
        y2 = {y1}
        stroke = {toCSS(color)}
        strokeWidth = {strokeWidth}
      />
      <circle
        pointerEvents = "all"
        stroke = "red"
        strokeWidth = {DEFAULT_STROKE_WIDTH}
        fill = "none"
        cx = {x0}
        cy = {y0}
        r = {radius}
        visibility = {endpoint0VisibilityFlag ? "visible" : "hidden"}
        onMouseDown = {function(e) {
          endpointOnMouseDownHelper(
            e,
            fullKeys,
            0
          );
          e.preventDefault();
        }}
        onMouseOver = {function() {
          conditionallySetVisibility(setEndpoint0VisibilityFlag);
        }}
        onMouseLeave = {function() {
          setEndpoint0VisibilityFlag(false);
        }}
      />
      <circle
        pointerEvents = "all"
        stroke = "red"
        strokeWidth = {DEFAULT_STROKE_WIDTH}
        fill = "none"
        cx = {x1}
        cy = {y1}
        r = {radius}
        visibility = {endpoint1VisibilityFlag ? "visible" : "hidden"}
        onMouseDown = {function(e) {
          endpointOnMouseDownHelper(
            e,
            fullKeys,
            1
          );
          e.preventDefault();
        }}
        onMouseOver = {function() {
          conditionallySetVisibility(setEndpoint1VisibilityFlag);
        }}
        onMouseLeave = {function() {
          setEndpoint1VisibilityFlag(false);
        }}
      />
      <path
        pointerEvents = "all"
        stroke = "red"
        strokeWidth = {DEFAULT_STROKE_WIDTH}
        fill = "none"
        d = {`M ${endpoint0TranslatedPositively.x} ${endpoint0TranslatedPositively.y} A 1 1 0 0 0 ${endpoint0TranslatedNegatively.x} ${endpoint0TranslatedNegatively.y} L ${endpoint1TranslatedNegatively.x} ${endpoint1TranslatedNegatively.y} A 1 1 0 0 0 ${endpoint1TranslatedPositively.x} ${endpoint1TranslatedPositively.y} z`}
        visibility = {bodyVisibilityFlag ? "visible" : "hidden"}
        onMouseDown = {function(e) {
          bodyOnMouseDownHelper(
            e,
            fullKeys
          );
          e.preventDefault();
        }}
        onMouseOver = {function(e) {
          conditionallySetVisibility(setBodyVisibilityFlag);
        }}
        onMouseLeave = {function() {
          setBodyVisibilityFlag(false)
        }}
      />
    </g>;
  }
}