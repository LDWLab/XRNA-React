import { createRef, memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FullKeys, HTML_ELEMENT_ID_DELIMITER, NUCLEOTIDE_CLASS_NAME } from "../../App";
import { Context } from "../../context/Context";
import Color, { BLACK, toCSS } from "../../data_structures/Color";
import Font from "../../data_structures/Font";
import { Vector2D } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { LabelContent } from "./LabelContent";
import { LabelLine } from "./LabelLine";
import { SVG_PROPERTY_XRNA_COMPLEX_NAME, SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX, SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX, SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import "../../App.css";

export function getLabelLineHtmlElementId(
  rnaComplexIndex : number,
  rnaMoleculeName : string,
  nucleotideIndex : number
) {
  return `${rnaComplexIndex}${HTML_ELEMENT_ID_DELIMITER}${rnaMoleculeName}${HTML_ELEMENT_ID_DELIMITER}${nucleotideIndex}${HTML_ELEMENT_ID_DELIMITER}LabelLine`;
}

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
    y : -0.3 * rectangle.height
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
    U = "U",
    N = "N"
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
    nucleotideIndex : number
  };

  function Component(props : Props) {
    const {
      x,
      y,
      symbol,
      labelContentProps,
      labelLineProps,
      nucleotideIndex
    } = props;
    // Begin context data.
    const rnaComplexIndex = useContext(Context.RnaComplex.Index);
    const rnaComplexName = useContext(Context.RnaComplex.Name);
    const rnaMoleculeName = useContext(Context.RnaMolecule.Name);
    const fullKeys = {
      nucleotideIndex,
      rnaMoleculeName,
      rnaComplexIndex,
    };
    const firstNucleotideIndexInRnaMolecule = useContext(Context.RnaMolecule.FirstNucleotideIndex);
    const setMouseOverText = useContext(Context.App.SetMouseOverText);
    const onMouseDownHelper = useContext(Context.Nucleotide.OnMouseDownHelper);
    const labelsOnlyFlag = useContext(Context.Nucleotide.LabelsOnlyFlag);
    const indicesOfFrozenNucleotides = useContext(Context.App.IndicesOfFrozenNucleotides);
    let frozenFlag = false;
    if (rnaComplexIndex in indicesOfFrozenNucleotides) {
      const indicesOfFrozenNucleotidesPerRnaComplex = indicesOfFrozenNucleotides[rnaComplexIndex];
      if (rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex) {
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName];
        if (indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(nucleotideIndex)) {
          frozenFlag = true;
        }
      }
    }
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
      transform = {`translate(${x}, ${y})`}
    >
      <text
        {...{
          [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.NUCLEOTIDE,
          [SVG_PROPERTY_XRNA_COMPLEX_NAME] : rnaComplexName,
          [SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME] : rnaMoleculeName,
          [SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX] : firstNucleotideIndexInRnaMolecule,
          [SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX] : nucleotideIndex + firstNucleotideIndexInRnaMolecule
        }}
        ref = {symbolReference}
        className = {`${NUCLEOTIDE_CLASS_NAME} noselect`}
        transform = {`translate(${graphicalAdjustment.x}, ${graphicalAdjustment.y}) scale(1, -1)`}
        fontStyle = {font.style}
        fontWeight = {font.weight}
        fontFamily = {font.family}
        fontSize = {font.size}
        strokeWidth = {strokeWidth}
        fill = {toCSS(color)}
        pointerEvents = {labelsOnlyFlag ? "none" : "all"}
        // stroke = {stroke}
        onMouseDown = {function(e : React.MouseEvent<Nucleotide.SvgRepresentation>) {
          onMouseDownHelper(
            e,
            fullKeys
          );
        }}
        onMouseOver = {function(e : React.MouseEvent<Nucleotide.SvgRepresentation>) {
          const idx = firstNucleotideIndexInRnaMolecule + nucleotideIndex;
          setMouseOverText(
            `nucleotide: ${idx}\n` +
            `symbol:     ${symbol}\n` +
            `molecule:   ${rnaMoleculeName}\n` +
            `complex:    ${rnaComplexName}`
          );
        }}
        onMouseLeave = {function() {
          setMouseOverText("");
        }}
      >
        {frozenFlag && <animate attributeName = "opacity" values={`0;1;0`} dur = "2s" repeatCount = "indefinite"/>}
        {symbol}
      </text>
      <Context.Nucleotide.Symbol.Provider
        value = {symbol}
      >
        {labelLineProps && <LabelLine.Component
          {...labelLineProps}
          id = {getLabelContentHtmlElementId(
            rnaComplexIndex,
            rnaMoleculeName,
            nucleotideIndex
          )}
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
      </Context.Nucleotide.Symbol.Provider>
    </g>;
  }

  export const MemoizedComponent = memo(Component);
}