import React, { createRef, FunctionComponent, LegacyRef, memo, useContext, useMemo, useState } from "react";
import { useEffect } from "react";
import { FullKeys } from "../../App";
import { Context } from "../../context/Context";
import Color, { BLACK, toCSS } from "../../data_structures/Color";
import Font from "../../data_structures/Font";
import { Vector2D } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";

export namespace LabelContent {
  export type SvgRepresentation = SVGTextElement;
  
  export type ExternalProps = Vector2D & {
    content : string,
    font? : Font,
    color? : Color,
    strokeWidth? : number
  };

  export type Props = ExternalProps & {
    fullKeys : FullKeys,
    id : string
  };

  export function Component(props : Props) {
    const {
      content,
      x,
      y,
      fullKeys,
      id
    } = props;
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex,
    } = fullKeys;

    // Begin reference data.
    const contentSvgTextElementReference = createRef<SVGTextElement>();
    // Begin context data.
    const onMouseDownHelper = useContext(Context.Label.Content.OnMouseDownHelper);
    const className = useContext(Context.Label.ClassName);
    const setMouseOverText = useContext(Context.App.SetMouseOverText);
    const firstNucleotideIndexInRnaMolecule = useContext(Context.RnaMolecule.FirstNucleotideIndex);
    const rnaComplexName = useContext(Context.RnaComplex.Name);
    const symbol = useContext(Context.Nucleotide.Symbol);

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
        return props.font ?? structuredClone(Font.DEFAULT);
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
    return <text
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.LABEL_CONTENT
      }}
      id = {id}
      ref = {contentSvgTextElementReference}
      transform = {`translate(${x}, ${y}) translate(${graphicalAdjustment.x}, ${graphicalAdjustment.y}) scale(1 -1)`}
      className = {className + " noselect"}
      fontSize = {font.size}
      fontFamily = {font.family}
      fontWeight = {font.weight}
      fontStyle = {font.style}
      strokeWidth = {strokeWidth}
      fill = {toCSS(color)}
      onMouseDown = {function(e) {
        onMouseDownHelper(
          e,
          fullKeys
        );
        e.preventDefault();
      }}
      onMouseOver = {function(e) {
        setMouseOverText(`Nucleotide #${firstNucleotideIndexInRnaMolecule + nucleotideIndex} (${symbol}) in RNA molecule "${rnaMoleculeName}" in RNA complex "${rnaComplexName}"`);
      }}
    >
      {content}
    </text>;
  }

  export const MemoizedComponent = memo(Component);
}