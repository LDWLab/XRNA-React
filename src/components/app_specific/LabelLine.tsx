import React, { FunctionComponent, LegacyRef, memo, useContext, useEffect, useMemo, useState } from "react";
import { FullKeys } from "../../App";
import { Context } from "../../context/Context";
import Color, { toCSS, BLACK } from "../../data_structures/Color";
import { subtract, scaleUp, orthogonalize, magnitude, add, Vector2D } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";

export namespace LabelLine {
  export type BodySvgRepresentation = SVGPathElement;
  export type EndpointSvgRepresentation = SVGCircleElement;

  export type OptionalProps = {
    color? : Color,
    strokeWidth? : number
  };

  export type ExternalProps = OptionalProps & {
    points : Array<Vector2D>
  };

  export type Props = ExternalProps & {
    fullKeys : FullKeys,
    id : string
  }

  type RenderData = {
    pathDAttribute : string,
    polylinePointsAttribute : string
  };

  export function Component(props : Props) {
    const {
      fullKeys,
      points,
      id
    } = props;
    // Begin constants.
    const BOUNDING_PATH_RADIUS = 1;
    // Begin context.
    const bodyOnMouseDownHelper = useContext(Context.Label.Line.Body.OnMouseDownHelper);
    const endpointOnMouseDownHelper = useContext(Context.Label.Line.Endpoint.OnMouseDownHelper);
    const className = useContext(Context.Label.ClassName);
    // Begin state data.
    const radius = BOUNDING_PATH_RADIUS;
    const [
      renderData,
      setRenderData
    ] = useState<RenderData>({
      pathDAttribute : "",
      polylinePointsAttribute : ""
    });
    function updateRenderData() {
      let endpoint0 = points[0];
      let endpoint1 = endpoint0;
      const paths = new Array<string>();
      for (let i = 1; i < points.length; i++) {
        endpoint1 = points[i];
        const difference = subtract(endpoint1, endpoint0);
        const scaledOrthogonal = scaleUp(orthogonalize(difference), BOUNDING_PATH_RADIUS / magnitude(difference));
        const endpoint0TranslatedPositively = add(endpoint0, scaledOrthogonal);
        const endpoint0TranslatedNegatively = subtract(endpoint0, scaledOrthogonal);
        const endpoint1TranslatedPositively = add(endpoint1, scaledOrthogonal);
        const endpoint1TranslatedNegatively = subtract(endpoint1, scaledOrthogonal);
        endpoint0 = endpoint1;
        paths.push(`M ${endpoint0TranslatedPositively.x} ${endpoint0TranslatedPositively.y} A 1 1 0 0 0 ${endpoint0TranslatedNegatively.x} ${endpoint0TranslatedNegatively.y} L ${endpoint1TranslatedNegatively.x} ${endpoint1TranslatedNegatively.y} A 1 1 0 0 0 ${endpoint1TranslatedPositively.x} ${endpoint1TranslatedPositively.y} z`);
      }
      setRenderData({
        pathDAttribute : paths.join(" "),
        polylinePointsAttribute : points.map(function({x, y}) {
          return `${x},${y}`;
        }).join(" ")
      });
    }
    useEffect(
      updateRenderData,
      [points]
    );
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
    return <g
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.LABEL_LINE
      }}
    >
      <polyline
        points = {renderData.polylinePointsAttribute}
        pointerEvents = "none"
        stroke = {toCSS(color)}
        strokeWidth = {strokeWidth}
        fill = "none"
      />
      {points.map(function(
        point,
        pointIndex
      ) {
        return <circle
          id = {id}
          key = {pointIndex}
          className = {className}
          pointerEvents = "all"
          strokeWidth = {DEFAULT_STROKE_WIDTH}
          fill = "none"
          cx = {point.x}
          cy = {point.y}
          r = {radius}
          onMouseDown = {function(e) {
            endpointOnMouseDownHelper(
              e,
              fullKeys,
              pointIndex,
              updateRenderData
            );
          }}
        />
      })}
      <path
        className = {className}
        pointerEvents = "all"
        strokeWidth = {DEFAULT_STROKE_WIDTH}
        fill = "none"
        d = {renderData.pathDAttribute}
        onMouseDown = {function(e) {
          bodyOnMouseDownHelper(
            e,
            fullKeys,
            updateRenderData
          );
          e.preventDefault();
        }}
      />
    </g>;
  }

  export const MemoizedComponent = memo(Component);
}