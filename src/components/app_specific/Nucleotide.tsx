import { createRef, memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FullKeys, HTML_ELEMENT_ID_DELIMITER } from "../../App";
import { Context } from "../../context/Context";
import Color, { BLACK, toCSS } from "../../data_structures/Color";
import Font from "../../data_structures/Font";
import { Vector2D } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { LabelContent } from "./LabelContent";
import { LabelLine } from "./LabelLine";
import { SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import "../../App.css";

export function getLabelContentHtmlElementId(
  rnaComplexIndex : number,
  rnaMoleculeName : string,
  nucleotideIndex : number
) {
  return `${rnaComplexIndex}${HTML_ELEMENT_ID_DELIMITER}${rnaMoleculeName}${HTML_ELEMENT_ID_DELIMITER}${nucleotideIndex}${HTML_ELEMENT_ID_DELIMITER}LabelContent`;
}

export function getGraphicalAdjustment(rectangle : {width : number, height : number}) {
  return {
    x : -0.5 * rectangle.width,
    y : -0.25 * rectangle.height
  };
}

export namespace Nucleotide {
  export type SvgRepresentation = SVGTextElement;
  
  export enum Symbol {
    FIVE_PRIME = "5'",
    THREE_PRIME = "3'",
    FIVE = "5",
    THREE = "3",
    A = "A",
    C = "C",
    G = "G",
    U = "U"
  };
  export const symbols = Object.values(Symbol);

  export function isSymbol(candidateSymbol : string) : candidateSymbol is Symbol {
    return (symbols as string[]).includes(candidateSymbol);
  }

  export type ExternalProps = Vector2D & {
    symbol : Symbol,
    color? : Color
    strokeWidth? : number,
    font? : Font,
    labelContentProps? : LabelContent.ExternalProps,
    labelLineProps? : LabelLine.ExternalProps
  };
  
  export type Props = ExternalProps & {
    scaffoldingKey : number
  };

  function Component(props : Props) {
    const {
      x,
      y,
      symbol,
      labelContentProps,
      labelLineProps,
      scaffoldingKey
    } = props;
    // Begin context data.
    const rnaComplexIndex = useContext(Context.RnaComplex.Index);
    const rnaComplexName = useContext(Context.RnaComplex.Name);
    const rnaMoleculeName = useContext(Context.RnaMolecule.Name);
    const nucleotideIndex = scaffoldingKey;
    const fullKeys = {
      nucleotideIndex,
      rnaMoleculeName,
      rnaComplexIndex,
    };
    const firstNucleotideIndexInRnaMolecule = useContext(Context.RnaMolecule.FirstNucleotideIndex);
    const setMouseOverText = useContext(Context.App.SetMouseOverText);
    const onMouseDownHelper = useContext(Context.Nucleotide.OnMouseDownHelper);
    // Begin state data.
    const [
      textDimensions,
      setTextDimensions
    ] = useState({
      width : 0,
      height : 0
    });
    // Begin references.
    const symbolReference = createRef<SVGTextElement>();
    // Begin memo data.
    const font = useMemo(
      function() {
        return props.font ?? structuredClone(Font.DEFAULT)
      },
      [props.font]
    );
    const color = useMemo(
      function() {
        return props.color ?? BLACK;
      },
      [props.color]
    );
    const strokeWidth = useMemo(
      function() {
        return props.strokeWidth ?? DEFAULT_STROKE_WIDTH
      },
      [props.strokeWidth]
    );
    const graphicalAdjustment = useMemo<Vector2D>(
      function() {
        return getGraphicalAdjustment(textDimensions);
      },
      [textDimensions]
    );
    // Begin effects.
    useEffect(
      function() {
        setTextDimensions((symbolReference.current as SVGTextElement).getBBox());
      },
      [
        symbol,
        font
      ]
    );
    return <g
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.NUCLEOTIDE,
        [SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX] : nucleotideIndex + firstNucleotideIndexInRnaMolecule
      }}
      transform = {`translate(${x}, ${y})`}
    >
      <text
        ref = {symbolReference}
        className = "nucleotide"
        transform = {`translate(${graphicalAdjustment.x}, ${graphicalAdjustment.y}) scale(1, -1)`}
        fontStyle = {font.style}
        fontWeight = {font.weight}
        fontFamily = {font.family}
        fontSize = {font.size}
        strokeWidth = {strokeWidth}
        fill = {toCSS(color)}
        // stroke = {stroke}
        onMouseDown = {function(e : React.MouseEvent<Nucleotide.SvgRepresentation>) {
          onMouseDownHelper(
            e,
            fullKeys
          );
        }}
        onMouseOver = {function(e : React.MouseEvent<Nucleotide.SvgRepresentation>) {
          setMouseOverText(`Nucleotide #${firstNucleotideIndexInRnaMolecule + nucleotideIndex} (${symbol}) in RNA molecule "${rnaMoleculeName}" in RNA complex "${rnaComplexName}"`);
        }}
        onMouseLeave = {function() {
          setMouseOverText("");
        }}
      >
        {symbol}
      </text>
      {labelLineProps && <LabelLine.Component
        {...labelLineProps}
        fullKeys = {fullKeys}
      />}
      {labelContentProps && <LabelContent.Component
        {...labelContentProps}
        id = {getLabelContentHtmlElementId(
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        )}
        fullKeys = {fullKeys}
      />}
    </g>;
  }

  export const MemoizedComponent = memo(Component);
}