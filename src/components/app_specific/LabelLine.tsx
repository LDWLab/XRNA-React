import React, { FunctionComponent, LegacyRef, memo, useContext, useEffect, useMemo, useState } from "react";
import { FullKeys } from "../../App";
import { Context } from "../../context/Context";
import Color, { toCSS, BLACK } from "../../data_structures/Color";
import { subtract, scaleUp, orthogonalize, magnitude, add, Vector2D } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX, SVG_PROPERTY_XRNA_COMPLEX_NAME, SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import { getLineBoundingPath } from "../../utils/Utils";

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
    const setMouseOverText = useContext(Context.App.SetMouseOverText);
    const firstNucleotideIndexInRnaMolecule = useContext(Context.RnaMolecule.FirstNucleotideIndex);
    const rnaComplexName = useContext(Context.RnaComplex.Name);
    const symbol = useContext(Context.Nucleotide.Symbol);
    const {
      nucleotideIndex,
      rnaMoleculeName,
      rnaComplexIndex
    } = fullKeys;
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
        paths.push(getLineBoundingPath(
          endpoint0,
          endpoint1
        ));
        endpoint0 = endpoint1;
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
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.LABEL_LINE,
        [SVG_PROPERTY_XRNA_COMPLEX_NAME] : rnaComplexName,
        [SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME] : rnaMoleculeName,
        [SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX] : nucleotideIndex + firstNucleotideIndexInRnaMolecule
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
          onMouseOver = {function(e) {
            setMouseOverText(`Nucleotide #${firstNucleotideIndexInRnaMolecule + nucleotideIndex} (${symbol}) in RNA molecule "${rnaMoleculeName}" in RNA complex "${rnaComplexName}"`);
          }}
          onMouseLeave = {function() {
            setMouseOverText("");
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
        onMouseOver = {function(e) {
          setMouseOverText(`Nucleotide #${firstNucleotideIndexInRnaMolecule + nucleotideIndex} (${symbol}) in RNA molecule "${rnaMoleculeName}" in RNA complex "${rnaComplexName}"`);
        }}
        onMouseLeave = {function() {
          setMouseOverText("");
        }}
      />
    </g>;
  }

  export const MemoizedComponent = memo(Component);
}