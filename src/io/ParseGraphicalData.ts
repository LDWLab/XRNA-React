import { NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../App";
import BasePair, { getBasePairType } from "../components/app_specific/BasePair";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { DuplicateBasePairKeysHandler, insertBasePair } from "../components/app_specific/RnaComplex";
import { Line2D } from "../data_structures/Geometry";
import { Vector2D, add, distance, distanceSquared, dotProduct, magnitude, negate, normalize, scaleUp, subtract } from "../data_structures/Vector2D";
import { degreesToRadians } from "../utils/Utils";

const EPSILON_SQUARED = 1e-8;
const SCALARS_TO_TRY = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const INCREASED_NUMBER_OF_NEIGHBORING_NUCLEOTIDES = {
  line : 5,
  center : 10
};

type Constraints = {
  minimumDistanceRatio : number,
  // A dot product less than or equal to this number suggests that the two input vectors point mostly in opposite directions.
  dotProductThreshold : number
};

const constraints : {
  loose : Constraints,
  normal : Constraints,
  strict : Constraints
} = {
  // For now, some of these constraints are equal. They will be adjusted accordingly upon testing input data.
  loose : {
    minimumDistanceRatio : 0.8,
    dotProductThreshold : Math.cos(degreesToRadians(170))
  },
  normal : {
    minimumDistanceRatio : 0.8,
    dotProductThreshold : Math.cos(degreesToRadians(170))
  },
  strict : {
    minimumDistanceRatio : 0.895,
    dotProductThreshold : Math.cos(degreesToRadians(170))
  }
};

const TOO_FEW_NUCLEOTIDES_ERROR = "Too few nucleotides exist within the RNA complex (the number is less than the required number).";

type Indices = {
  rnaMoleculeName : string,
  nucleotideIndex : number,
  arrayIndex : number
};

export type BasePairLine = Line2D & BasePair.CoreProps;
export type BasePairLinesPerRnaComplex = Array<BasePairLine>;
export type BasePairLines = Record<RnaComplexKey, BasePairLinesPerRnaComplex>;

export type BasePairCenter = Vector2D & BasePair.CoreProps;
export type BasePairCentersPerRnaComplex = Array<BasePairCenter>;
export type BasePairCenters = Record<RnaComplexKey, BasePairCentersPerRnaComplex>;

export type GraphicalAdjustmentPerNucleotide = { x : number, y : number};
export type GraphicalAdjustmentsPerRnaMolecule = Record<NucleotideKey, GraphicalAdjustmentPerNucleotide>;
export type GraphicalAdjustmentsPerRnaComplex = Record<RnaMoleculeKey, GraphicalAdjustmentsPerRnaMolecule>;
export type GraphicalAdjustments = Record<RnaComplexKey, GraphicalAdjustmentsPerRnaComplex>;

export function parseGraphicalData(
  rnaComplexProps : RnaComplexProps,
  basePairLines : BasePairLines,
  basePairCenters : BasePairCenters,
  graphicalAdjustments : GraphicalAdjustments = {}
) {
  type FlattenedNucleotideProps = Array<{
    indices : Indices,
    singularNucleotideProps : Nucleotide.ExternalProps,
    adjustedPosition : Vector2D
  }>;

  const adjustedNucleotidePositions : Record<RnaComplexKey, Record<RnaMoleculeKey, Record<NucleotideKey, Vector2D>>> = {};

  for (const [rnaComplexIndexAsString, singularRnaComplexProps] of Object.entries(rnaComplexProps)) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const basePairLinesPerRnaComplex = basePairLines[rnaComplexIndex];
    const basePairCentersPerRnaComplex = basePairCenters[rnaComplexIndex];
    const graphicalAdjustmentsPerRnaComplex = graphicalAdjustments[rnaComplexIndex] ?? {};
    adjustedNucleotidePositions[rnaComplexIndex] = {};
    const adjustedNucleotidePositionsPerRnaComplex = adjustedNucleotidePositions[rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const flattenedNucleotideProps : FlattenedNucleotideProps = [];
    for (const [rnaMoleculeName, singularRnaMoleculeProps] of Object.entries(singularRnaComplexProps.rnaMoleculeProps)) {
      adjustedNucleotidePositionsPerRnaComplex[rnaMoleculeName] = {};
      const adjustedNucleotidePositionsPerRnaMolecule = adjustedNucleotidePositionsPerRnaComplex[rnaMoleculeName];
      const graphicalAdjustmentsPerRnaMolecule = graphicalAdjustmentsPerRnaComplex[rnaMoleculeName] ?? {};
      for (const [nucleotideIndexAsString, singularNucleotideProps] of Object.entries(singularRnaMoleculeProps.nucleotideProps)) {
        const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        const graphicalAdjustment = graphicalAdjustmentsPerRnaMolecule[nucleotideIndex] ?? {
          x : 0,
          y : 0
        };
        const adjustedPosition = {
          x : singularNucleotideProps.x - graphicalAdjustment.x * 0.5,
          y : singularNucleotideProps.y + graphicalAdjustment.y
        };
        adjustedNucleotidePositionsPerRnaMolecule[nucleotideIndex] = adjustedPosition;
        flattenedNucleotideProps.push({
          indices : {
            rnaMoleculeName,
            nucleotideIndex,
            arrayIndex : flattenedNucleotideProps.length
          },
          singularNucleotideProps,
          adjustedPosition
        });
      }
    }

    type ClosestNucleotides = Array<{
      indices : Indices,
      adjustedPosition : Vector2D,
      squaredDistance : number
    }>;

    type ArrayIndices = Array<{
      0 : number,
      1 : number
    }>;

    type LineData = {
      line : BasePairLine,
      allClosestNucleotides : {
        0 : ClosestNucleotides,
        1 : ClosestNucleotides
      }
    };

    type LineDataWithIndices = LineData & {
      arrayIndices : ArrayIndices
    };

    type CenterData = {
      center : BasePairCenter,
      allClosestNucleotides : ClosestNucleotides
    }

    type CenterDataWithIndices = CenterData & {
      arrayIndices : ArrayIndices
    };

    type FailedBasePairs = {
      zeroCandidateBasePairs : Record<BasePair.Type | "undefined", {
        lineData : Array<LineData>,
        centerData : Array<CenterData>
      }>,
      tooManyCandidateBasePairs : {
        lineDataWithIndices : Array<LineDataWithIndices>,
        centerDataWithIndices : Array<CenterDataWithIndices>
      }
    };

    let logFlag = false;

    let failedBasePairs = getInitialFailedBasePairs();

    const totalDistancesRecord : Record<BasePair.Type | "undefined", {
      minimum : number,
      maximum : number
    }> = {
      [BasePair.Type.CANONICAL] : {
        minimum : Number.POSITIVE_INFINITY,
        maximum : Number.NEGATIVE_INFINITY
      },
      [BasePair.Type.MISMATCH] : {
        minimum : Number.POSITIVE_INFINITY,
        maximum : Number.NEGATIVE_INFINITY
      },
      [BasePair.Type.WOBBLE] : {
        minimum : Number.POSITIVE_INFINITY,
        maximum : Number.NEGATIVE_INFINITY
      },
      undefined : {
        minimum : Number.POSITIVE_INFINITY,
        maximum : Number.NEGATIVE_INFINITY
      }
    };

    function getInitialFailedBasePairs() : FailedBasePairs {
      return {
        zeroCandidateBasePairs : {
          [BasePair.Type.CANONICAL] : {
            lineData : [],
            centerData : []
          },
          [BasePair.Type.WOBBLE] : {
            lineData : [],
            centerData : []
          },
          [BasePair.Type.MISMATCH] : {
            lineData : [],
            centerData : []
          },
          undefined : {
            lineData : [],
            centerData : []
          }
        },
        tooManyCandidateBasePairs : {
          lineDataWithIndices : [],
          centerDataWithIndices : []
        }
      };
    }

    function findClosestNucleotides(
      target : Vector2D,
      count : number
    ) {
      const indicesWithSquaredDistances : ClosestNucleotides = flattenedNucleotideProps.map(function(
        {
          indices,
          adjustedPosition
        }
      ) {
        return {
          indices,
          adjustedPosition,
          squaredDistance : distanceSquared(target, adjustedPosition)
        };
      });

      if (indicesWithSquaredDistances.length < count) {
        throw TOO_FEW_NUCLEOTIDES_ERROR;
      }
      indicesWithSquaredDistances.sort(function(
        indicesWithSquaredDistance0,
        indicesWithSquaredDistance1
      ) {
        return indicesWithSquaredDistance0.squaredDistance - indicesWithSquaredDistance1.squaredDistance;
      });
      return {
        all : indicesWithSquaredDistances,
        sliced : indicesWithSquaredDistances.slice(
          0,
          count
        )
      };
    }

    function createBasePair(
      indices0 : Indices,
      indices1 : Indices,
      type? : BasePair.Type
    ) {
      if (logFlag) {
        console.log(indices0.rnaMoleculeName, indices0.nucleotideIndex, indices1.rnaMoleculeName, indices1.nucleotideIndex);
      }
      insertBasePair(
        singularRnaComplexProps,
        indices0.rnaMoleculeName,
        indices0.nucleotideIndex,
        indices1.rnaMoleculeName,
        indices1.nucleotideIndex,
        DuplicateBasePairKeysHandler.THROW_ERROR,
        {
          basePairType : type
        }
      );

      const distanceI = distance(
        flattenedNucleotideProps[indices0.arrayIndex].singularNucleotideProps,
        flattenedNucleotideProps[indices1.arrayIndex].singularNucleotideProps
      );
      const distanceRecord = totalDistancesRecord[type ?? "undefined"];
      if (distanceI < distanceRecord.minimum) {
        distanceRecord.minimum = distanceI;
      }
      if (distanceI > distanceRecord.maximum) {
        distanceRecord.maximum = distanceI;
      }

      delete flattenedNucleotideProps[indices0.arrayIndex];
      delete flattenedNucleotideProps[indices1.arrayIndex];
    }

    function calculateNucleotideData(
      closestNucleotides : ClosestNucleotides,
      center : Vector2D
    ) {
      return closestNucleotides.map(function({
        indices,
        adjustedPosition,
        squaredDistance
      }) {
        return {
          indices,
          dv : subtract(
            adjustedPosition,
            center
          ),
          distance : Math.sqrt(squaredDistance),
          adjustedPosition
        };
      });
    }
    
    function attemptToCreateBasePairDefinedByLine(
      basePairLine : BasePairLine,
      constraints : Constraints,
      numberOfNeighboringNucleotides : number
    ) {
      const {
        dotProductThreshold,
        minimumDistanceRatio
      } = constraints;
      const maximumDistanceRatio = 1 / minimumDistanceRatio;
      const baseLineDirection = normalize(subtract(
        basePairLine.v1,
        basePairLine.v0
      ));
      const negatedBaseLineDirection = negate(baseLineDirection);
      const closestNucleotides0 = findClosestNucleotides(
        basePairLine.v0,
        numberOfNeighboringNucleotides
      );
      const nucleotideData0 = calculateNucleotideData(
        closestNucleotides0.sliced,
        basePairLine.v0
      ).filter(function({dv}) {
        return dotProduct(
          dv,
          baseLineDirection
        ) / magnitude(dv) < dotProductThreshold
      });
      const closestNucleotides1 = findClosestNucleotides(
        basePairLine.v1,
        numberOfNeighboringNucleotides
      );
      const nucleotideData1 = calculateNucleotideData(
        closestNucleotides1.sliced,
        basePairLine.v1
      ).filter(function({dv}) {
        return dotProduct(
          dv,
          negatedBaseLineDirection
        ) / magnitude(dv) < dotProductThreshold;
      });
      const length0 = nucleotideData0.length;
      const length1 = nucleotideData1.length;
      let filteredNucleotideData = new Array<{
        indices0 : Indices,
        indices1 : Indices,
        totalDistance : number,
        distanceRatio : number,
        type : BasePair.Type
      }>();
      const expectedBasePairType = basePairLine.basePairType;
      for (let i = 0; i < length0; i++) {
        const nucleotideDatumI = nucleotideData0[i];
        const indicesI = nucleotideDatumI.indices;
        const distanceI = nucleotideDatumI.distance;
        const symbolI = singularRnaComplexProps.rnaMoleculeProps[indicesI.rnaMoleculeName].nucleotideProps[indicesI.nucleotideIndex].symbol;
        for (let j = 0; j < length1; j++) {
          const nucleotideDatumJ = nucleotideData1[j];
          const indicesJ = nucleotideDatumJ.indices;
          const distanceJ = nucleotideDatumJ.distance;
          const symbolJ = singularRnaComplexProps.rnaMoleculeProps[indicesJ.rnaMoleculeName].nucleotideProps[indicesJ.nucleotideIndex].symbol;
          if (
            indicesI.rnaMoleculeName === indicesJ.rnaMoleculeName &&
            Math.abs(indicesI.nucleotideIndex - indicesJ.nucleotideIndex) <= 1
          ) {
            continue;
          }
          const type = getBasePairType(
            symbolI,
            symbolJ
          );
          if (
            expectedBasePairType !== undefined &&
            expectedBasePairType !== type
          ) {
            continue;
          }
          const distanceRatio = distanceI / distanceJ;
          if (
            distanceRatio < minimumDistanceRatio ||
            distanceRatio > maximumDistanceRatio
          ) {
            continue;
          }
          filteredNucleotideData.push({
            indices0 : indicesI,
            indices1 : indicesJ,
            totalDistance : distanceI + distanceJ,
            distanceRatio,
            type
          });
        }
      }
      const count = filteredNucleotideData.length;
      switch (count) {
        case 0 : {
          failedBasePairs.zeroCandidateBasePairs[expectedBasePairType ?? "undefined"].lineData.push({
            line : basePairLine,
            allClosestNucleotides : {
              0 : [],
              1 : []
            }
          });
          break;
        }
        case 1 : {
          const nucleotidePair = filteredNucleotideData[0];
          createBasePair(
            nucleotidePair.indices0,
            nucleotidePair.indices1,
            nucleotidePair.type
          );
          break;
        }
        default : {
          failedBasePairs.tooManyCandidateBasePairs.lineDataWithIndices.push({
            line : basePairLine,
            arrayIndices : filteredNucleotideData.map(function({
              indices0,
              indices1
            }) {
              return {
                0 : indices0.arrayIndex,
                1 : indices1.arrayIndex
              }
            }),
            allClosestNucleotides : {
              0 : closestNucleotides0.all,
              1 : closestNucleotides1.all
            }
          });
          break;
        }
      }
      if (filteredNucleotideData.length !== 1 && logFlag) {
        console.log(`Base-pair creation failed: ${filteredNucleotideData.length} (line; ${basePairLine.basePairType}; (${basePairLine.v0.x}, ${basePairLine.v0.y})-(${basePairLine.v1.x}, ${basePairLine.v1.y}))`, filteredNucleotideData);
      }
    }

    function attemptToCreateBasePairDefinedByCenter(
      basePairCenter : BasePairCenter,
      constraints : Constraints,
      numberOfNeighboringNucleotides : number
    ) {
      const {
        dotProductThreshold,
        minimumDistanceRatio
      } = constraints;
      const maximumDistanceRatio = 1 / minimumDistanceRatio;
      const {
        all,
        sliced
      } = findClosestNucleotides(
        basePairCenter,
        numberOfNeighboringNucleotides
      );
      const nucleotideData = calculateNucleotideData(
        sliced,
        basePairCenter
      );
      let filteredNucleotideData = new Array<{
        indices0 : Indices,
        indices1 : Indices,
        dotProduct : number,
        totalDistance : number,
        distanceRatio : number,
        type : BasePair.Type
      }>();
      const length = nucleotideData.length;
      const expectedBasePairType = basePairCenter.basePairType;
      for (let i = 0; i < length; i++) {
        const nucleotideDatumI = nucleotideData[i];
        const indicesI = nucleotideDatumI.indices;
        const distanceI = nucleotideDatumI.distance;
        const symbolI = singularRnaComplexProps.rnaMoleculeProps[indicesI.rnaMoleculeName].nucleotideProps[indicesI.nucleotideIndex].symbol;
        for (let j = i + 1; j < length; j++) {
          const nucleotideDatumJ = nucleotideData[j];
          const indicesJ = nucleotideDatumJ.indices;
          const distanceJ = nucleotideDatumJ.distance;
          const symbolJ = singularRnaComplexProps.rnaMoleculeProps[indicesJ.rnaMoleculeName].nucleotideProps[indicesJ.nucleotideIndex].symbol;
          if (
            indicesI.rnaMoleculeName === indicesJ.rnaMoleculeName &&
            Math.abs(indicesI.nucleotideIndex - indicesJ.nucleotideIndex) <= 1
          ) {
            continue;
          }
          const type = getBasePairType(
            symbolI,
            symbolJ
          );
          if (
            expectedBasePairType !== undefined &&
            expectedBasePairType !== type
          ) {
            continue;
          }
          const dotProductIJ = dotProduct(
            nucleotideDatumI.dv,
            nucleotideDatumJ.dv
          ) / (distanceI * distanceJ);
          if (dotProductIJ >= dotProductThreshold) {
            continue;
          }
          const distanceRatio = distanceI / distanceJ;
          if (
            distanceRatio < minimumDistanceRatio ||
            distanceRatio > maximumDistanceRatio
          ) {
            continue;
          }
          filteredNucleotideData.push({
            indices0 : indicesI,
            indices1 : indicesJ,
            dotProduct : dotProductIJ,
            totalDistance : distanceI + distanceJ,
            distanceRatio,
            type
          });
        }
      }
      const count = filteredNucleotideData.length;
      switch (count) {
        case 0 : {
          failedBasePairs.zeroCandidateBasePairs[expectedBasePairType ?? "undefined"].centerData.push({
            center : basePairCenter,
            allClosestNucleotides : []
          });
          break;
        }
        case 1 : {
          const nucleotidePair = filteredNucleotideData[0];
          createBasePair(
            nucleotidePair.indices0,
            nucleotidePair.indices1,
            nucleotidePair.type
          );
          break;
        }
        default : {
          failedBasePairs.tooManyCandidateBasePairs.centerDataWithIndices.push({
            center : basePairCenter,
            arrayIndices : filteredNucleotideData.map(function({
              indices0,
              indices1
            }) {
              return {
                0 : indices0.arrayIndex,
                1 : indices1.arrayIndex
              }
            }),
            allClosestNucleotides : all
          });
          break;
        }
      }
      if (filteredNucleotideData.length !== 1 && logFlag) {
        console.log(`Base-pair creation failed: ${filteredNucleotideData.length} (center; ${basePairCenter.basePairType}; ${basePairCenter.x}, ${basePairCenter.y})`, filteredNucleotideData);
      }
    }

    const basePairTypeHandlingOrderOrdinals : Record<BasePair.Type | "undefined", number> = {
      [BasePair.Type.WOBBLE] : 0,
      [BasePair.Type.CANONICAL] : 1,
      [BasePair.Type.MISMATCH] : 2,
      ["undefined"] : 3
    };
    // This order minimizes ambiguous base pairs.
    const basePairTypeHandlingOrder = Object.entries(basePairTypeHandlingOrderOrdinals).sort(function(
      typeWithOrdinal0,
      typeWithOrdinal1
    ) {
      return typeWithOrdinal0[1] - typeWithOrdinal1[1];
    }).map(function([type, ordinal]) {
      return type as BasePair.Type | "undefined";
    });

    const typedBasePairs : Record<BasePair.Type | "undefined", {
      lines : Array<BasePairLine>,
      centers : Array<BasePairCenter>
    }> = {
      "undefined" : {
        lines : [],
        centers : []
      },
      [BasePair.Type.CANONICAL] : {
        lines : [],
        centers : []
      },
      [BasePair.Type.MISMATCH] : {
        lines : [],
        centers : []
      },
      [BasePair.Type.WOBBLE] : {
        lines : [],
        centers : []
      }
    };
    for (const basePairCenter of basePairCentersPerRnaComplex) {
      typedBasePairs[basePairCenter.basePairType ?? "undefined"].centers.push(basePairCenter);
    }
    for (const basePairLine of basePairLinesPerRnaComplex) {
      const basePairsPerType = typedBasePairs[basePairLine.basePairType ?? "undefined"];
      if (EPSILON_SQUARED >= distanceSquared(
        basePairLine.v0,
        basePairLine.v1
      )) {
        // The vectors are effectively identical.
        basePairsPerType.centers.push(basePairLine.v0);
      } else {
        basePairsPerType.lines.push(basePairLine);
      }
    }
    // Make base pairs for every unambigious base pair.
    for (const basePairType of basePairTypeHandlingOrder) {
      const {
        centers,
        lines
      } = typedBasePairs[basePairType];
      for (const line of lines) {
        attemptToCreateBasePairDefinedByLine(
          line,
          constraints.normal,
          3
        );
      }
      for (const center of centers) {
        attemptToCreateBasePairDefinedByCenter(
          center,
          constraints.normal,
          6
        );
      }
    }
    let failedBasePairsWorkingCopy = structuredClone(failedBasePairs);
    failedBasePairs = getInitialFailedBasePairs();
    const remainderLines = new Array<LineDataWithIndices>();
    const remainderCenters = new Array<CenterDataWithIndices>();
    const {
      zeroCandidateBasePairs,
      tooManyCandidateBasePairs
    } = failedBasePairsWorkingCopy;
    // Make a second attempt to create base pairs (of failed base pairs).
    for (const line of tooManyCandidateBasePairs.lineDataWithIndices) {
      line.arrayIndices = line.arrayIndices.filter(function(arrayIndexPair : { 0 : number, 1 : number }) {
        return arrayIndexPair[0] in flattenedNucleotideProps && arrayIndexPair[1] in flattenedNucleotideProps;
      });
      switch (line.arrayIndices.length) {
        case 0 : {
          zeroCandidateBasePairs[line.line.basePairType ?? "undefined"].lineData.push(line);
          break;
        }
        case 1 : {
          // Create base pairs which are now unambiguous.
          const arrayIndexPair = line.arrayIndices[0];
          createBasePair(
            flattenedNucleotideProps[arrayIndexPair[0]].indices,
            flattenedNucleotideProps[arrayIndexPair[1]].indices,
            line.line.basePairType
          );
          break;
        }
        default : {
          remainderLines.push(line);
          break;
        }
      }
    }
    for (const center of tooManyCandidateBasePairs.centerDataWithIndices) {
      center.arrayIndices = center.arrayIndices.filter(function(arrayIndexPair : {0 : number, 1 : number}) {
        return arrayIndexPair[0] in flattenedNucleotideProps && arrayIndexPair[1] in flattenedNucleotideProps;
      });
      switch (center.arrayIndices.length) {
        case 0 : {
          zeroCandidateBasePairs[center.center.basePairType ?? "undefined"].centerData.push(center);
          break;
        }
        case 1 : {
          // Create base pairs which are now unambiguous.
          const arrayIndexPair = center.arrayIndices[0];
          createBasePair(
            flattenedNucleotideProps[arrayIndexPair[0]].indices,
            flattenedNucleotideProps[arrayIndexPair[1]].indices,
            center.center.basePairType
          );
          break;
        }
        default : {
          remainderCenters.push(center);
          break;
        }
      }
    }
    
    for (const basePairType of basePairTypeHandlingOrder) {
      const {
        centerData,
        lineData
      } = zeroCandidateBasePairs[basePairType];
      for (const lineDataI of lineData) {
        attemptToCreateBasePairDefinedByLine(
          lineDataI.line,
          constraints.loose,
          INCREASED_NUMBER_OF_NEIGHBORING_NUCLEOTIDES.line
        );
      }
      for (const centerDataI of centerData) {
        attemptToCreateBasePairDefinedByCenter(
          centerDataI.center,
          constraints.loose,
          INCREASED_NUMBER_OF_NEIGHBORING_NUCLEOTIDES.center
        );
      }
    }
    remainderLines.push(...failedBasePairs.tooManyCandidateBasePairs.lineDataWithIndices);
    remainderCenters.push(...failedBasePairs.tooManyCandidateBasePairs.centerDataWithIndices);
    const compositeData = [
      ...remainderLines.map(function(lineData) {
        const {
          line,
          arrayIndices
        } = lineData;
        return {
          center : {
            ...scaleUp(
              add(
                line.v0,
                line.v1
              ),
              0.5
            ),
            basePairType : line.basePairType
          },
          arrayIndices
        };
      }),
      ...remainderCenters
    ];

    // This sort function attempts to minimize the chances of overlapping base pairs
    function sort(
      object0 : { arrayIndices : ArrayIndices },
      object1 : { arrayIndices : ArrayIndices }
    ) {
      return object0.arrayIndices.length - object1.arrayIndices.length;
    }
    compositeData.sort(sort);
    // remainderLines.sort(sort);
    // remainderCenters.sort(sort);
    for (const centerData of compositeData) {
      let {
        center,
        arrayIndices
      } = centerData;
      const distanceRecordPerType = totalDistancesRecord[center.basePairType ?? "undefined"];
      arrayIndices = arrayIndices.filter(function(arrayIndicesI) {
        if (!(arrayIndicesI[0] in flattenedNucleotideProps)) {
          return false;
        }
        if (!(arrayIndicesI[1] in flattenedNucleotideProps)) {
          return false;
        }
        const singularFlattenedNucleotideProps0 = flattenedNucleotideProps[arrayIndicesI[0]];
        const singularFlattenedNucleotideProps1 = flattenedNucleotideProps[arrayIndicesI[1]];
        const distanceI = distance(
          singularFlattenedNucleotideProps0.singularNucleotideProps,
          singularFlattenedNucleotideProps1.singularNucleotideProps
        );
        if (distanceI < distanceRecordPerType.minimum * 0.95) {
          return false;
        }
        if (distanceI > distanceRecordPerType.maximum * 1.05) {
          return false;
        }
        return true;
      });
      if (arrayIndices.length === 0) {
        console.error("Base pairing failed.");
        continue;
      }
      const distanceData = arrayIndices.map(function(arrayIndicesI) {
        const singularFlattenedNucleotideProps0 = flattenedNucleotideProps[arrayIndicesI[0]];
        const singularFlattenedNucleotideProps1 = flattenedNucleotideProps[arrayIndicesI[1]];
        const distanceSquaredI = distanceSquared(
          scaleUp(
            add(
              singularFlattenedNucleotideProps0.singularNucleotideProps,
              singularFlattenedNucleotideProps1.singularNucleotideProps
            ),
            0.5
          ),
          center
        );
        return {
          distanceSquared : distanceSquaredI,
          indices0 : singularFlattenedNucleotideProps0.indices,
          indices1 : singularFlattenedNucleotideProps1.indices
        };
      });
      let minimizedDistanceData = distanceData[0];
      for (let i = 1; i < distanceData.length; i++) {
        const distanceDataI = distanceData[i];
        if (distanceDataI.distanceSquared < minimizedDistanceData.distanceSquared) {
          minimizedDistanceData = distanceDataI;
        }
      }
      createBasePair(
        minimizedDistanceData.indices0,
        minimizedDistanceData.indices1,
        center.basePairType
      );
    }
  }

  // Invert all y coordinates.
  for (const singularRnaComplexProps of Object.values(rnaComplexProps)) {
    for (const singularRnaMoleculeProps of Object.values(singularRnaComplexProps.rnaMoleculeProps)) {
      for (const singularNucleotideProps of Object.values(singularRnaMoleculeProps.nucleotideProps)) {
        singularNucleotideProps.y *= -1;
        if (singularNucleotideProps.labelContentProps !== undefined) {
          singularNucleotideProps.labelContentProps.y *= -1;
        }
        if (singularNucleotideProps.labelLineProps !== undefined) {
          for (const point of singularNucleotideProps.labelLineProps.points) {
            point.y *= -1;
          }
        }
      }
    }
  }
}