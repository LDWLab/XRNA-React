import React, { createElement, memo, useContext } from "react";
import { Context } from "../../context/Context";
import Color, { toCSS, BLACK } from "../../data_structures/Color";
import { Vector2D, add, dotProduct, interpolate, normalize, orthogonalize, scaleUp, subtract } from "../../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";
import { Nucleotide } from "./Nucleotide";
import { SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0, SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1, SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0, SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1, SVG_PROPERTY_XRNA_BASE_PAIR_TYPE, SVG_PROPERTY_XRNA_COMPLEX_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";

export function getBasePairType(symbol0 : Nucleotide.Symbol, symbol1 : Nucleotide.Symbol) : BasePair.CanonicalType {
  if (symbol0 > symbol1) {
    // Ensure symbol0 <= symbol1.
    let temp = symbol0;
    symbol0 = symbol1;
    symbol1 = temp;
  }

  const basePairTypeRecord = BasePair.typeRecord;
  let basePairType : BasePair.CanonicalType | undefined = undefined;
  if (symbol0 in basePairTypeRecord) {
    basePairType = (basePairTypeRecord[symbol0] as Partial<Record<Nucleotide.Symbol, BasePair.CanonicalType>>)[symbol1];
  }
  if (basePairType === undefined) {
    throw `Unsupported base-pair type between ${symbol0} and ${symbol1}`;
  }
  return basePairType;
}

export function isBasePairType(candidateBasePair : string) : candidateBasePair is BasePair.Type {
  return (BasePair.types as string[]).includes(candidateBasePair);
}

export namespace BasePair {
  export enum Type {
    CANONICAL = "canonical",
    WOBBLE = "wobble",
    MISMATCH = "mismatch",
    CIS_WATSON_CRICK_WATSON_CRICK = "cis_watson_crick_watson_crick",
    TRANS_WATSON_CRICK_WATSON_CRICK = "trans_watson_crick_watson_crick",
    CIS_WATSON_CRICK_HOOGSTEEN = "cis_watson_crick_hoogsteen",
    TRANS_WATSON_CRICK_HOOGSTEEN = "trans_watson_crick_hoogsteen",
    CIS_WATSON_CRICK_SUGAR_EDGE = "cis_watson_crick_sugar_edge",
    TRANS_WATSON_CRICK_SUGAR_EDGE = "trans_watson_crick_sugar_edge",
    CIS_HOOGSTEEN_HOOGSTEEN = "cis_hoogsteen_hoogsteen",
    TRANS_HOOGSTEEN_HOOGSTEEN = "trans_hoogsteen_hoogsteen",
    CIS_HOOGSTEEN_SUGAR_EDGE = "cis_hoogsteen_sugar_edge",
    TRANS_HOOGSTEEN_SUGAR_EDGE = "trans_hoogsteen_sugar_edge",
    CIS_SUGAR_EDGE_SUGAR_EDGE = "cis_sugar_edge_sugar_edge",
    TRANS_SUGAR_EDGE_SUGAR_EDGE = "trans_sugar_edge_sugar_edge"
  }

  export const types = Object.values(Type);

  export type CanonicalType = Extract<Type, Type.CANONICAL | Type.WOBBLE | Type.MISMATCH>;

  export const CanonicalType = {
    [Type.CANONICAL] : Type.CANONICAL,
    [Type.WOBBLE] : Type.WOBBLE,
    [Type.MISMATCH] : Type.MISMATCH
  };

  export const canonicalTypes = Object.values(CanonicalType);

  export const typeRecord : Partial<Record<Nucleotide.Symbol, Partial<Record<Nucleotide.Symbol, CanonicalType>>>> = {
    [Nucleotide.Symbol.A] : {
      [Nucleotide.Symbol.A] : Type.MISMATCH,
      [Nucleotide.Symbol.C] : Type.MISMATCH,
      [Nucleotide.Symbol.G] : Type.MISMATCH,
      [Nucleotide.Symbol.U] : Type.CANONICAL
    },
    [Nucleotide.Symbol.C] : {
      [Nucleotide.Symbol.C] : Type.MISMATCH,
      [Nucleotide.Symbol.G] : Type.CANONICAL,
      [Nucleotide.Symbol.U] : Type.MISMATCH
    },
    [Nucleotide.Symbol.G] : {
      [Nucleotide.Symbol.G] : Type.MISMATCH,
      [Nucleotide.Symbol.U] : Type.WOBBLE
    },
    [Nucleotide.Symbol.U] : {
      [Nucleotide.Symbol.U] : Type.MISMATCH
    }
  };

  export type CoreProps = {
    basePairType? : BasePair.Type,
    color? : Color,
    strokeWidth? : number,
    points? : Array<Vector2D>
  };

  export type ExternalProps = {
    mappedBasePair : CoreProps,
    position0 : Vector2D,
    position1 : Vector2D
  };

  export type FinalizedMappedBasePair = CoreProps & Required<Pick<CoreProps, "basePairType">>;

  export type NucleotideIndicesForBasePair = {
    rnaComplexName : string,
    rnaMoleculeName0 : string,
    formattedNucleotideIndex0 : number,
    rnaMoleculeName1 : string,
    formattedNucleotideIndex1 : number
  };

  export type Props = ExternalProps & NucleotideIndicesForBasePair & {
    mappedBasePair : FinalizedMappedBasePair
  };

  export type SimplifiedProps = Omit<CoreProps & Required<Pick<CoreProps, "basePairType" | "strokeWidth">>, "color"> & {
    position0 : Vector2D,
    position1 : Vector2D,
    svgPropertiesForXrna : object,
    stroke? : string,
    fill? : string
  };

  const interpolationFactor0 = 0.25;
  const interpolationFactor1 = 1 - interpolationFactor0;

  const sugarEdgeSugarEdgeScalar = Math.sqrt(3) * 0.5;
  const nonSugarEdgeSugarEdgeScalar = (3 + Math.sqrt(3)) * 0.5;

  function Line(props : SimplifiedProps) {
    const {
      position0,
      position1,
      stroke,
      strokeWidth,
      svgPropertiesForXrna
    } = props;
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      interpolationFactor1
    );
    return <line
      {...svgPropertiesForXrna}
      x1 = {interpolatedPosition0.x}
      y1 = {interpolatedPosition0.y}
      x2 = {interpolatedPosition1.x}
      y2 = {interpolatedPosition1.y}
      stroke = {stroke}
      strokeWidth = {strokeWidth}
      pointerEvents = "none"
    />;
  }

  function Circle(props : SimplifiedProps) {
    const {
      position0,
      position1,
      stroke,
      fill,
      strokeWidth,
      svgPropertiesForXrna
    } = props;
    const center = {
      x : (position0.x + position1.x) * 0.5,
      y : (position0.y + position1.y) * 0.5
    }
    const basePairRadius = useContext(Context.BasePair.Radius);
    return <circle
      {...svgPropertiesForXrna}
      r = {basePairRadius}
      cx = {center.x}
      cy = {center.y}
      stroke = {stroke}
      fill = {fill}
      strokeWidth = {strokeWidth}
      pointerEvents = "none"
    />;
  }

  function WatsonCrickWatsonCrick(props : SimplifiedProps) {
    const {
      position0,
      position1,
      svgPropertiesForXrna,
      stroke,
      fill,
      strokeWidth
    } = props;
    const basePairRadius = useContext(Context.BasePair.Radius);
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      interpolationFactor1
    );
    const strokeForLines = ["none", undefined].includes(stroke) ? fill : stroke;
    const center = scaleUp(
      add(
        position0,
        position1
      ),
      0.5
    );
    const dv = scaleUp(
      normalize(subtract(
        position1,
        position0
      )),
      basePairRadius
    );
    const interpolatedPositionNearCenter0 = subtract(
      center,
      dv
    );
    const interpolatedPositionNearCenter1 = add(
      center,
      dv
    );
    const elements = new Array<JSX.Element>();
    if (dotProduct(
      subtract(
        interpolatedPositionNearCenter0,
        interpolatedPosition0
      ),
      subtract(
        center,
        interpolatedPositionNearCenter0
      )
    ) > 0) {
      elements.push(<line
        key = {0}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition0.x}
        y1 = {interpolatedPosition0.y}
        x2 = {interpolatedPositionNearCenter0.x}
        y2 = {interpolatedPositionNearCenter0.y}
      />);
    }
    elements.push(<circle
      key = {1}
      pointerEvents = "none"
      stroke = {stroke}
      fill = {fill}
      strokeWidth = {strokeWidth}
      cx = {center.x}
      cy = {center.y}
      r = {basePairRadius}
    />);
    if (dotProduct(
      subtract(
        interpolatedPositionNearCenter1,
        interpolatedPosition1
      ),
      subtract(
        center,
        interpolatedPositionNearCenter1
      )
    ) > 0) {
      elements.push(<line
        key = {2}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition1.x}
        y1 = {interpolatedPosition1.y}
        x2 = {interpolatedPositionNearCenter1.x}
        y2 = {interpolatedPositionNearCenter1.y}
      />);
    }
    return <g
      {...svgPropertiesForXrna}
    >
      {elements}
    </g>;
  }

  function WatsonCrickHoogsteen(props : SimplifiedProps) {
    const {
      position0,
      position1,
      svgPropertiesForXrna,
      stroke,
      fill,
      strokeWidth
    } = props;
    const basePairRadius = useContext(Context.BasePair.Radius);
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      interpolationFactor1
    );
    const strokeForLines = ["none", undefined].includes(stroke) ? fill : stroke;
    const center = scaleUp(
      add(
        position0,
        position1
      ),
      0.5
    );
    const unitDv = normalize(subtract(
      position1,
      position0
    ));
    const basePairRadiusDv = scaleUp(
      unitDv,
      basePairRadius
    );
    const scaledUpDv = scaleUp(
      unitDv,
      1.5 * basePairRadius
    );
    const orthogonalDv = orthogonalize(basePairRadiusDv);
    const circleCenter = subtract(
      center,
      scaledUpDv
    );
    const squareCenter = add(
      center,
      scaledUpDv
    );
    const pointOnLineForCircle0 = subtract(
      circleCenter,
      basePairRadiusDv
    );
    const pointOnLineForCircle1 = add(
      circleCenter,
      basePairRadiusDv
    );
    const pointOnLineForSquare0 = subtract(
      squareCenter,
      basePairRadiusDv
    );
    const pointOnLineForSquare1 = add(
      squareCenter,
      basePairRadiusDv
    );
    const pointsForSquare = [
      subtract(
        pointOnLineForSquare0,
        orthogonalDv
      ),
      add(
        pointOnLineForSquare0,
        orthogonalDv
      ),
      add(
        pointOnLineForSquare1,
        orthogonalDv
      ),
      subtract(
        pointOnLineForSquare1,
        orthogonalDv
      )
    ];
    const elements = new Array<JSX.Element>();
    if (dotProduct(
      subtract(
        pointOnLineForCircle0,
        interpolatedPosition0
      ),
      subtract(
        center,
        pointOnLineForCircle0
      )
    ) > 0) {
      elements.push(<line
        key = {0}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition0.x}
        y1 = {interpolatedPosition0.y}
        x2 = {pointOnLineForCircle0.x}
        y2 = {pointOnLineForCircle0.y}
      />);
    }
    elements.push(
      <circle
        key = {1}
        pointerEvents = "none"
        stroke = {stroke}
        fill = {fill}
        strokeWidth = {strokeWidth}
        cx = {circleCenter.x}
        cy = {circleCenter.y}
        r = {basePairRadius}
      />,
      <line
        key = {2}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {pointOnLineForCircle1.x}
        y1 = {pointOnLineForCircle1.y}
        x2 = {pointOnLineForSquare0.x}
        y2 = {pointOnLineForSquare0.y}
      />,
      <path
        key = {3}
        d = {`M ${pointsForSquare[0].x} ${pointsForSquare[0].y} L ${pointsForSquare[1].x} ${pointsForSquare[1].y} L ${pointsForSquare[2].x} ${pointsForSquare[2].y} L ${pointsForSquare[3].x} ${pointsForSquare[3].y} Z`}
        stroke = {stroke}
        fill = {fill}
        pointerEvents = "none"
        strokeWidth = {strokeWidth}
      />
    );
    
    if (dotProduct(
      subtract(
        pointOnLineForSquare1,
        interpolatedPosition1
      ),
      subtract(
        center,
        pointOnLineForSquare1
      )
    ) > 0) {
      elements.push(<line
        key = {4}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {pointOnLineForSquare1.x}
        y1 = {pointOnLineForSquare1.y}
        x2 = {interpolatedPosition1.x}
        y2 = {interpolatedPosition1.y}
      />);
    }
    return <g
      {...svgPropertiesForXrna}
    >
      {elements}
    </g>;
  }

  function WatsonCrickSugarEdge(props : SimplifiedProps) {
    const {
      position0,
      position1,
      svgPropertiesForXrna,
      stroke,
      fill,
      strokeWidth
    } = props;
    const basePairRadius = useContext(Context.BasePair.Radius);
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      interpolationFactor1
    );
    const strokeForLines = ["none", undefined].includes(stroke) ? fill : stroke;
    const center = scaleUp(
      add(
        position0,
        position1
      ),
      0.5
    );
    const unitDv = normalize(subtract(
      position1,
      position0
    ));
    const dv = scaleUp(
      unitDv,
      nonSugarEdgeSugarEdgeScalar * basePairRadius 
    );
    const basePairRadiusDv = scaleUp(
      unitDv,
      basePairRadius
    );
    const orthogonalDv = scaleUp(
      orthogonalize(unitDv),
      basePairRadius
    );
    const circleCenter = add(
      subtract(
        center,
        dv
      ),
      basePairRadiusDv
    );
    const pointOnLineForCircle0 = subtract(
      circleCenter,
      basePairRadiusDv
    );
    const pointOnLineForCircle1 = add(
      circleCenter,
      basePairRadiusDv
    );
    const pointOnLineForTriangle0 = add(
      circleCenter,
      scaleUp(
        unitDv,
        2 * basePairRadius
      )
    );
    const pointOnLineForTriangle1 = add(
      center,
      dv
    );
    const orthogonalPoint0 = add(
      pointOnLineForTriangle0,
      orthogonalDv
    );
    const orthogonalPoint1 = subtract(
      pointOnLineForTriangle0,
      orthogonalDv
    );
    const elements = new Array<JSX.Element>();
    if (dotProduct(
      subtract(
        pointOnLineForCircle0,
        interpolatedPosition0
      ),
      subtract(
        center,
        pointOnLineForCircle0
      )
    ) > 0) {
      elements.push(<line
        key = {0}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition0.x}
        y1 = {interpolatedPosition0.y}
        x2 = {pointOnLineForCircle0.x}
        y2 = {pointOnLineForCircle0.y}
      />);
    }
    elements.push(
      <circle
        key = {1}
        pointerEvents = "none"
        stroke = {stroke}
        fill = {fill}
        strokeWidth = {strokeWidth}
        cx = {circleCenter.x}
        cy = {circleCenter.y}
        r = {basePairRadius}
      />,
      <line
        key = {2}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {pointOnLineForCircle1.x}
        y1 = {pointOnLineForCircle1.y}
        x2 = {pointOnLineForTriangle0.x}
        y2 = {pointOnLineForTriangle0.y}
      />,
      <path
        key = {3}
        d = {`M ${orthogonalPoint0.x} ${orthogonalPoint0.y} L ${orthogonalPoint1.x} ${orthogonalPoint1.y} L ${pointOnLineForTriangle1.x} ${pointOnLineForTriangle1.y} Z`}
        stroke = {stroke}
        fill = {fill}
        pointerEvents = "none"
        strokeWidth = {strokeWidth}
      />
    );
    if (dotProduct(
      subtract(
        pointOnLineForTriangle1,
        interpolatedPosition1
      ),
      subtract(
        center,
        pointOnLineForTriangle1
      )
    ) > 0) {
      elements.push(<line
        key = {4}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {pointOnLineForTriangle1.x}
        y1 = {pointOnLineForTriangle1.y}
        x2 = {interpolatedPosition1.x}
        y2 = {interpolatedPosition1.y}
        />);
    }
    return <g
      {...svgPropertiesForXrna}
    >
      {elements}
    </g>;
  }

  function HoogsteenHoogsteen(props : SimplifiedProps) {
    const {
      position0,
      position1,
      svgPropertiesForXrna,
      stroke,
      fill,
      strokeWidth
    } = props;
    const basePairRadius = useContext(Context.BasePair.Radius);
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      interpolationFactor1
    );
    const strokeForLines = ["none", undefined].includes(stroke) ? fill : stroke;
    const center = scaleUp(
      add(
        position0,
        position1
      ),
      0.5
    );
    const unitDv = normalize(subtract(
      position1,
      position0
    ));
    const dv = scaleUp(
      unitDv,
      basePairRadius
    );
    const orthogonalDv = scaleUp(
      orthogonalize(unitDv),
      basePairRadius
    );
    const interpolatedPositionNearCenter0 = subtract(
      center,
      dv
    );
    const interpolatedPositionNearCenter1 = add(
      center,
      dv
    );
    const pointsForSquare = [
      subtract(
        interpolatedPositionNearCenter0,
        orthogonalDv
      ),
      add(
        interpolatedPositionNearCenter0,
        orthogonalDv
      ),
      add(
        interpolatedPositionNearCenter1,
        orthogonalDv
      ),
      subtract(
        interpolatedPositionNearCenter1,
        orthogonalDv
      )
    ];
    const elements = new Array<JSX.Element>();
    if (dotProduct(
      subtract(
        interpolatedPositionNearCenter0,
        interpolatedPosition0
      ),
      subtract(
        center,
        interpolatedPositionNearCenter0
      )
    ) > 0) {
      elements.push(<line
        key = {0}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition0.x}
        y1 = {interpolatedPosition0.y}
        x2 = {interpolatedPositionNearCenter0.x}
        y2 = {interpolatedPositionNearCenter0.y}
      />);
    }
    elements.push(<path
      key = {1}
      d = {`M ${pointsForSquare[0].x} ${pointsForSquare[0].y} L ${pointsForSquare[1].x} ${pointsForSquare[1].y} L ${pointsForSquare[2].x} ${pointsForSquare[2].y} L ${pointsForSquare[3].x} ${pointsForSquare[3].y} Z`}
      stroke = {stroke}
      fill = {fill}
      pointerEvents = "none"
      strokeWidth = {strokeWidth}
    />);
    if (dotProduct(
      subtract(
        interpolatedPositionNearCenter1,
        interpolatedPosition1
      ),
      subtract(
        center,
        interpolatedPositionNearCenter1
      )
    ) > 0) {
      elements.push(<line
        key = {2}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition1.x}
        y1 = {interpolatedPosition1.y}
        x2 = {interpolatedPositionNearCenter1.x}
        y2 = {interpolatedPositionNearCenter1.y}
      />);
    }
    return <g
      {...svgPropertiesForXrna}
    >
      {elements}
    </g>;
  }

  function HoogsteenSugarEdge(props : SimplifiedProps) {
    const {
      position0,
      position1,
      svgPropertiesForXrna,
      stroke,
      fill,
      strokeWidth
    } = props;
    const basePairRadius = useContext(Context.BasePair.Radius);
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      interpolationFactor1
    );
    const strokeForLines = ["none", undefined].includes(stroke) ? fill : stroke;
    const center = scaleUp(
      add(
        position0,
        position1
      ),
      0.5
    );
    const unitDv = normalize(subtract(
      position1,
      position0
    ));
    const dv = scaleUp(
      unitDv,
      nonSugarEdgeSugarEdgeScalar * basePairRadius 
    );
    const basePairRadiusDv = scaleUp(
      unitDv,
      basePairRadius
    );
    const orthogonalDv = scaleUp(
      orthogonalize(unitDv),
      basePairRadius
    );
    const circleCenter = add(
      subtract(
        center,
        dv
      ),
      basePairRadiusDv
    );
    const pointOnLineForSquare0 = subtract(
      circleCenter,
      basePairRadiusDv
    );
    const pointOnLineForSquare1 = add(
      circleCenter,
      basePairRadiusDv
    );
    const pointOnLineForTriangle0 = add(
      circleCenter,
      scaleUp(
        unitDv,
        2 * basePairRadius
      )
    );
    const pointOnLineForTriangle1 = add(
      center,
      dv
    );
    const pointsForSquare = [
      subtract(
        pointOnLineForSquare0,
        orthogonalDv
      ),
      add(
        pointOnLineForSquare0,
        orthogonalDv
      ),
      add(
        pointOnLineForSquare1,
        orthogonalDv
      ),
      subtract(
        pointOnLineForSquare1,
        orthogonalDv
      )
    ];
    const orthogonalPoint0 = add(
      pointOnLineForTriangle0,
      orthogonalDv
    );
    const orthogonalPoint1 = subtract(
      pointOnLineForTriangle0,
      orthogonalDv
    );
    const elements = new Array<JSX.Element>();
    if (dotProduct(
      subtract(
        pointOnLineForSquare0,
        interpolatedPosition0
      ),
      subtract(
        center,
        pointOnLineForSquare0
      )
    ) > 0) {
      elements.push(<line
        key = {0}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition0.x}
        y1 = {interpolatedPosition0.y}
        x2 = {pointOnLineForSquare0.x}
        y2 = {pointOnLineForSquare0.y}
      />);
    }
    elements.push(
      <path
        key = {1}
        d = {`M ${pointsForSquare[0].x} ${pointsForSquare[0].y} L ${pointsForSquare[1].x} ${pointsForSquare[1].y} L ${pointsForSquare[2].x} ${pointsForSquare[2].y} L ${pointsForSquare[3].x} ${pointsForSquare[3].y} Z`}
        stroke = {stroke}
        fill = {fill}
        pointerEvents = "none"
        strokeWidth = {strokeWidth}
      />,
      <line
        key = {2}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {pointOnLineForSquare1.x}
        y1 = {pointOnLineForSquare1.y}
        x2 = {pointOnLineForTriangle0.x}
        y2 = {pointOnLineForTriangle0.y}
      />,
      <path
        key = {3}
        d = {`M ${orthogonalPoint0.x} ${orthogonalPoint0.y} L ${orthogonalPoint1.x} ${orthogonalPoint1.y} L ${pointOnLineForTriangle1.x} ${pointOnLineForTriangle1.y} Z`}
        stroke = {stroke}
        fill = {fill}
        pointerEvents = "none"
        strokeWidth = {strokeWidth}
      />
    );
    if (dotProduct(
      subtract(
        pointOnLineForTriangle1,
        interpolatedPosition1
      ),
      subtract(
        center,
        pointOnLineForTriangle1
      )
    ) > 0) {
      elements.push(<line
        key = {4}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {pointOnLineForTriangle1.x}
        y1 = {pointOnLineForTriangle1.y}
        x2 = {interpolatedPosition1.x}
        y2 = {interpolatedPosition1.y}
      />);
    }
    return <g
      {...svgPropertiesForXrna}
    >
      {elements}
    </g>;
  }

  function SugarEdgeSugarEdge(props : SimplifiedProps) {
    const {
      position0,
      position1,
      svgPropertiesForXrna,
      stroke,
      fill,
      strokeWidth
    } = props;
    const basePairRadius = useContext(Context.BasePair.Radius);
    const interpolatedPosition0 = interpolate(
      position0,
      position1,
      interpolationFactor0
    );
    const interpolatedPosition1 = interpolate(
      position0,
      position1,
      interpolationFactor1
    );
    const strokeForLines = ["none", undefined].includes(stroke) ? fill : stroke;
    const center = scaleUp(
      add(
        position0,
        position1
      ),
      0.5
    );
    const unitDv = normalize(subtract(
      position1,
      position0
    ));
    const dv = scaleUp(
      unitDv,
      sugarEdgeSugarEdgeScalar * basePairRadius 
    );
    const orthogonalDv = scaleUp(
      orthogonalize(unitDv),
      basePairRadius
    );
    const interpolatedPositionNearCenter0 = subtract(
      center,
      dv
    );
    const interpolatedPositionNearCenter1 = add(
      center,
      dv
    );
    const orthogonalPoint0 = add(
      interpolatedPositionNearCenter0,
      orthogonalDv
    );
    const orthogonalPoint1 = subtract(
      interpolatedPositionNearCenter0,
      orthogonalDv
    );
    const elements = new Array<JSX.Element>();
    if (dotProduct(
      subtract(
        interpolatedPositionNearCenter0,
        interpolatedPosition0
      ),
      subtract(
        center,
        interpolatedPositionNearCenter0
      )
    ) > 0) {
      elements.push(<line
        key = {0}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition0.x}
        y1 = {interpolatedPosition0.y}
        x2 = {interpolatedPositionNearCenter0.x}
        y2 = {interpolatedPositionNearCenter0.y}
      />);
    }
    elements.push(<path
      key = {1}
      d = {`M ${orthogonalPoint0.x} ${orthogonalPoint0.y} L ${orthogonalPoint1.x} ${orthogonalPoint1.y} L ${interpolatedPositionNearCenter1.x} ${interpolatedPositionNearCenter1.y} Z`}
      stroke = {stroke}
      fill = {fill}
      pointerEvents = "none"
      strokeWidth = {strokeWidth}
    />);
    if (dotProduct(
      subtract(
        interpolatedPositionNearCenter0,
        interpolatedPosition0
      ),
      subtract(
        center,
        interpolatedPositionNearCenter0
      )
    ) > 0) {
      elements.push(<line
        key = {2}
        pointerEvents = "none"
        stroke = {strokeForLines}
        strokeWidth = {strokeWidth}
        x1 = {interpolatedPosition1.x}
        y1 = {interpolatedPosition1.y}
        x2 = {interpolatedPositionNearCenter1.x}
        y2 = {interpolatedPositionNearCenter1.y}
      />);
    }
    return <g
      {...svgPropertiesForXrna}
    >
      {elements}
    </g>;
  }

  const basePairRenderMap : Record<BasePair.Type, (props : SimplifiedProps) => JSX.Element> = {
    [BasePair.Type.CANONICAL] : Line,
    [BasePair.Type.MISMATCH] : Circle,
    [BasePair.Type.WOBBLE] : Circle,
    [BasePair.Type.CIS_WATSON_CRICK_WATSON_CRICK] : WatsonCrickWatsonCrick,
    [BasePair.Type.TRANS_WATSON_CRICK_WATSON_CRICK] : WatsonCrickWatsonCrick,
    [BasePair.Type.CIS_WATSON_CRICK_HOOGSTEEN] : WatsonCrickHoogsteen,
    [BasePair.Type.TRANS_WATSON_CRICK_HOOGSTEEN] : WatsonCrickHoogsteen,
    [BasePair.Type.CIS_WATSON_CRICK_SUGAR_EDGE] : WatsonCrickSugarEdge,
    [BasePair.Type.TRANS_WATSON_CRICK_SUGAR_EDGE] : WatsonCrickSugarEdge,
    [BasePair.Type.CIS_HOOGSTEEN_HOOGSTEEN] : HoogsteenHoogsteen,
    [BasePair.Type.TRANS_HOOGSTEEN_HOOGSTEEN] : HoogsteenHoogsteen,
    [BasePair.Type.CIS_HOOGSTEEN_SUGAR_EDGE] : HoogsteenSugarEdge,
    [BasePair.Type.TRANS_HOOGSTEEN_SUGAR_EDGE] : HoogsteenSugarEdge,
    [BasePair.Type.CIS_SUGAR_EDGE_SUGAR_EDGE] : SugarEdgeSugarEdge,
    [BasePair.Type.TRANS_SUGAR_EDGE_SUGAR_EDGE] : SugarEdgeSugarEdge,
  };

  function strokeDontFill(color : string) {
    return {
      stroke : color,
      fill : "none"
    };
  }

  function fill(color : string) {
    return {
      stroke : "none",
      fill : color
    }
  }

  const componentStrokeAndFillRecord : Record<BasePair.Type, (color : string) => { stroke? : string, fill? : string }> = {
    [BasePair.Type.CANONICAL] : (color? : string) => ({
      stroke : color
    }),
    [BasePair.Type.WOBBLE] : fill,
    [BasePair.Type.MISMATCH] : strokeDontFill,
    [BasePair.Type.CIS_WATSON_CRICK_WATSON_CRICK] : fill,
    [BasePair.Type.TRANS_WATSON_CRICK_WATSON_CRICK] : strokeDontFill,
    [BasePair.Type.CIS_WATSON_CRICK_HOOGSTEEN] : fill,
    [BasePair.Type.TRANS_WATSON_CRICK_HOOGSTEEN] : strokeDontFill,
    [BasePair.Type.CIS_WATSON_CRICK_SUGAR_EDGE] : fill,
    [BasePair.Type.TRANS_WATSON_CRICK_SUGAR_EDGE] : strokeDontFill,
    [BasePair.Type.CIS_HOOGSTEEN_HOOGSTEEN] : fill,
    [BasePair.Type.TRANS_HOOGSTEEN_HOOGSTEEN] : strokeDontFill,
    [BasePair.Type.CIS_HOOGSTEEN_SUGAR_EDGE] : fill,
    [BasePair.Type.TRANS_HOOGSTEEN_SUGAR_EDGE] : strokeDontFill,
    [BasePair.Type.CIS_SUGAR_EDGE_SUGAR_EDGE] : fill,
    [BasePair.Type.TRANS_SUGAR_EDGE_SUGAR_EDGE] : strokeDontFill
  };

  export function Component(props : Props) {
    const {
      position0,
      position1,
      mappedBasePair,
      rnaComplexName,
      rnaMoleculeName0,
      formattedNucleotideIndex0,
      rnaMoleculeName1,
      formattedNucleotideIndex1
    } = props;
    const defaultStrokeWidth = useContext(Context.BasePair.AverageStrokeWidth);
    const colorAsString = toCSS(mappedBasePair.color ?? BLACK);
    const strokeWidth = mappedBasePair.strokeWidth ?? defaultStrokeWidth;
    if (mappedBasePair.points !== undefined) {
      const points = mappedBasePair.points.map(function({ x, y }) {
        return `${x},${y}`;
      }).join(" ");
      return <polyline
        stroke = {colorAsString}
        strokeWidth = {strokeWidth}
        pointerEvents = "none"
        points = {points}
        fill = "none"
      />;
    }
    const basePairType = mappedBasePair.basePairType;
    const svgPropertiesForXrna = {
      [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.BASE_PAIR,
      [SVG_PROPERTY_XRNA_COMPLEX_NAME] : rnaComplexName,
      [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0] : rnaMoleculeName0,
      [SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1] : rnaMoleculeName1,
      [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0] : formattedNucleotideIndex0,
      [SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1] : formattedNucleotideIndex1,
      [SVG_PROPERTY_XRNA_BASE_PAIR_TYPE] : basePairType
    };
    return createElement(
      basePairRenderMap[basePairType],
      {
        position0,
        position1,
        basePairType,
        strokeWidth,
        svgPropertiesForXrna,
        ...componentStrokeAndFillRecord[basePairType](colorAsString)
      }
    );
  }

  export const MemoizedComponent = memo(Component);
}

export default BasePair;