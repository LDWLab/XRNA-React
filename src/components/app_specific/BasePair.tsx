import React, { createElement, useContext } from "react";
import { Context } from "../../context/Context";
import Color, { toCSS, BLACK } from "../../data_structures/Color";
import { Vector2D, interpolate } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { Nucleotide } from "./Nucleotide";
import { SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0, SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1, SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0, SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1, SVG_PROPERTY_XRNA_BASE_PAIR_TYPE, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";

export function getBasePairType(symbol0 : Nucleotide.Symbol, symbol1 : Nucleotide.Symbol) : BasePair.Type {
  switch (`${symbol0}_${symbol1}`) {
    case "A_A":
    case "C_C":
    case "G_G":
    case "U_U":
    case "A_C":
    case "C_A":
    case "C_U":
    case "U_C":
    case "A_G":
    case "G_A":
      return BasePair.Type.MISMATCH;
    case "G_U":
    case "U_G":
      return BasePair.Type.WOBBLE;
    case "A_U":
    case "U_A":
    case "C_G":
    case "G_C":
      return BasePair.Type.CANONICAL;
    default:
      throw `Unsupported base-pair type between ${symbol0} and ${symbol1}`;
  }
}

export function isBasePairType(candidateBasePair : string) : candidateBasePair is BasePair.Type {
  return (BasePair.types as string[]).includes(candidateBasePair);
}

export namespace BasePair {
  export enum Type {
    CANONICAL = "canonical",
    WOBBLE = "wobble",
    MISMATCH = "mismatch"
  }

  export const types = Object.values(BasePair.Type);

  export type CoreProps = {
    basePairType? : BasePair.Type,
    color? : Color,
    strokeWidth? : number
  };

  export type ExternalProps = {
    mappedBasePair : CoreProps,
    position0 : Vector2D,
    position1 : Vector2D
  };

  export type FinalizedMappedBasePair = CoreProps & Required<Pick<CoreProps, "basePairType">>;

  export type NucleotideIndicesForBasePair = {
    rnaMoleculeName0 : string,
    formattedNucleotideIndex0 : number,
    rnaMoleculeName1 : string,
    formattedNucleotideIndex1 : number
  };

  export type Props = ExternalProps & NucleotideIndicesForBasePair & {
    mappedBasePair : FinalizedMappedBasePair
  };

  export type SimplifiedProps = Required<CoreProps> & NucleotideIndicesForBasePair & {
    position0 : Vector2D,
    position1 : Vector2D
  };

  function Canonical(props : SimplifiedProps) {
    const {
      rnaMoleculeName0,
      formattedNucleotideIndex0,
      rnaMoleculeName1,
      formattedNucleotideIndex1,
      position0,
      position1,
      color,
      strokeWidth
    } = props;
    const interpolationFactor0 = 0.25;
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      1 - interpolationFactor0
    );
    return <line
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.BASE_PAIR,
        [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0] : rnaMoleculeName0,
        [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1] : rnaMoleculeName1,
        [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0] : formattedNucleotideIndex0,
        [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1] : formattedNucleotideIndex1,
        [SVG_PROPERTY_XRNA_BASE_PAIR_TYPE] : Type.CANONICAL
      }}
      style = {{
        pointerEvents : "none"
      }}
      x1 = {interpolatedPosition0.x}
      y1 = {interpolatedPosition0.y}
      x2 = {interpolatedPosition1.x}
      y2 = {interpolatedPosition1.y}
      stroke = {toCSS(color)}
      strokeWidth = {strokeWidth}
      pointerEvents = "none"
    />;
  }

  function Wobble(props : SimplifiedProps) {
    const {
      rnaMoleculeName0,
      formattedNucleotideIndex0,
      rnaMoleculeName1,
      formattedNucleotideIndex1,
      position0,
      position1,
      color,
      strokeWidth
    } = props;
    const center = {
      x : (position0.x + position1.x) * 0.5,
      y : (position0.y + position1.y) * 0.5
    }
    const basePairRadiusContext = useContext(Context.BasePair.Radius);
    return <circle
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.BASE_PAIR,
        [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0] : rnaMoleculeName0,
        [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1] : rnaMoleculeName1,
        [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0] : formattedNucleotideIndex0,
        [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1] : formattedNucleotideIndex1,
        [SVG_PROPERTY_XRNA_BASE_PAIR_TYPE] : Type.WOBBLE
      }}
      style = {{
        pointerEvents : "none"
      }}
      r = {basePairRadiusContext.wobble}
      cx = {center.x}
      cy = {center.y}
      fill = {toCSS(color)}
      stroke = "none"
      strokeWidth = {strokeWidth}
      pointerEvents = "none"
    />;
  }

  function Mismatch(props : SimplifiedProps) {
    const {
      rnaMoleculeName0,
      formattedNucleotideIndex0,
      rnaMoleculeName1,
      formattedNucleotideIndex1,
      position0,
      position1,
      color,
      strokeWidth
    } = props;
    const center = {
      x : (position0.x + position1.x) * 0.5,
      y : (position0.y + position1.y) * 0.5
    }
    const basePairRadiusContext = useContext(Context.BasePair.Radius);
    return <circle
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.BASE_PAIR,
        [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0] : rnaMoleculeName0,
        [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1] : rnaMoleculeName1,
        [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0] : formattedNucleotideIndex0,
        [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1] : formattedNucleotideIndex1,
        [SVG_PROPERTY_XRNA_BASE_PAIR_TYPE] : Type.MISMATCH
      }}
      style = {{
        pointerEvents : "none"
      }}
      r = {basePairRadiusContext.mismatch}
      cx = {center.x}
      cy = {center.y}
      fill = "none"
      stroke = {toCSS(color)}
      strokeWidth = {strokeWidth}
      pointerEvents = "none"
    />;
  }

  const basePairRenderMap : Record<BasePair.Type, (props : SimplifiedProps) => JSX.Element> = {
    [BasePair.Type.CANONICAL] : Canonical,
    [BasePair.Type.MISMATCH] : Mismatch,
    [BasePair.Type.WOBBLE] : Wobble
  };

  export function Component(props : Props) {
    const {
      position0,
      position1,
      mappedBasePair,
      rnaMoleculeName0,
      formattedNucleotideIndex0,
      rnaMoleculeName1,
      formattedNucleotideIndex1
    } = props;
    const basePairType = mappedBasePair.basePairType;
    const color = mappedBasePair.color ?? BLACK;
    const strokeWidth = mappedBasePair.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    return createElement(
      basePairRenderMap[basePairType],
      {
        position0,
        position1,
        basePairType,
        color,
        strokeWidth,
        rnaMoleculeName0,
        formattedNucleotideIndex0,
        rnaMoleculeName1,
        formattedNucleotideIndex1
      }
    );
  }
}

export default BasePair;