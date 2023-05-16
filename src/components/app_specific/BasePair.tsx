import React, { createElement, useContext } from "react";
import { Context } from "../../context/Context";
import Color, { toCSS, BLACK } from "../../data_structures/Color";
import { Vector2D, interpolate } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { Nucleotide } from "./Nucleotide";

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

namespace BasePair {
  export enum Type {
    CANONICAL = "Canonical",
    WOBBLE = "Wobble",
    MISMATCH = "Mismatch"
  }

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

  export type Props = ExternalProps & {
    mappedBasePair : FinalizedMappedBasePair
  };

  export type SimplifiedProps = Required<CoreProps> & {
    position0 : Vector2D,
    position1 : Vector2D
  };

  export const types = Object.values(BasePair.Type);

  function Canonical(props : SimplifiedProps) {
    const interpolationFactor0 = 0.25;
    const interpolatedPosition0 = interpolate(
      props.position0,
      props.position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      props.position0,
      props.position1,
      1 - interpolationFactor0
    );
    return <line
      style = {{
        pointerEvents : "none"
      }}
      x1 = {interpolatedPosition0.x}
      y1 = {interpolatedPosition0.y}
      x2 = {interpolatedPosition1.x}
      y2 = {interpolatedPosition1.y}
      stroke = {toCSS(props.color)}
      strokeWidth = {props.strokeWidth}
      pointerEvents = "none"
    />;
  }

  function Wobble(props : SimplifiedProps) {
    const center = {
      x : (props.position0.x + props.position1.x) * 0.5,
      y : (props.position0.y + props.position1.y) * 0.5
    }
    const basePairRadiusContext = useContext(Context.BasePair.Radius);
    return <circle
      style = {{
        pointerEvents : "none"
      }}
      r = {basePairRadiusContext.wobble}
      cx = {center.x}
      cy = {center.y}
      fill = {toCSS(props.color)}
      stroke = "none"
      strokeWidth = {props.strokeWidth}
      pointerEvents = "none"
    />;
  }

  function Mismatch(props : SimplifiedProps) {
    const center = {
      x : (props.position0.x + props.position1.x) * 0.5,
      y : (props.position0.y + props.position1.y) * 0.5
    }
    const basePairRadiusContext = useContext(Context.BasePair.Radius);
    return <circle
      style = {{
        pointerEvents : "none"
      }}
      r = {basePairRadiusContext.mismatch}
      cx = {center.x}
      cy = {center.y}
      fill = "none"
      stroke = {toCSS(props.color)}
      strokeWidth = {props.strokeWidth}
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
      mappedBasePair
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
        strokeWidth
      }
    );
  }
}

export default BasePair;