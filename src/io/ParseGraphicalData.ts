import { NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../App";
import BasePair, { getBasePairType } from "../components/app_specific/BasePair";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { DuplicateBasePairKeysHandler, insertBasePair } from "../components/app_specific/RnaComplex";
import { Line2D } from "../data_structures/Geometry";
import { Vector2D, distanceSquared, dotProduct, magnitude, negate, normalize, subtract } from "../data_structures/Vector2D";
import { degreesToRadians } from "../utils/Utils";

const EPSILON_SQUARED = 1e-8;
const SCALARS_TO_TRY = [1, 1.5, 2, 2.5, 3, 3.5, 4];

type Constraints = {
  minimumDistanceRatio : number,
  // A dot product less than or equal to this number suggests that the two input vectors point mostly in opposite directions.
  dotProductThreshold : number
};

const constraints : {
  normal : Constraints,
  strict : Constraints
} = {
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

    type FailedBasePairs = {
      zeroCandidateBasePairs : Record<BasePair.Type | "undefined", {
        lines : Array<{
          line : BasePairLine
        }>,
        centers : Array<{
          center : BasePairCenter
        }>
      }>,
      tooManyCandidateBasePairs : Record<BasePair.Type | "undefined", {
        lines : Array<{
          line : BasePairLine,
          arrayIndices : Array<{
            0 : number,
            1 : number
          }>
        }>,
        centers : Array<{
          center : BasePairCenter,
          arrayIndices : Array<{
            0 : number,
            1 : number
          }>
        }>
      }>
    };

    let logFlag = false;

    let failedBasePairs = getInitialFailedBasePairs();

    function getInitialFailedBasePairs() : FailedBasePairs {
      return {
        zeroCandidateBasePairs : {
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
          },
          undefined : {
            lines : [],
            centers : []
          }
        },
        tooManyCandidateBasePairs : {
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
          },
          undefined : {
            lines : [],
            centers : []
          }
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
        full : indicesWithSquaredDistances,
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
      constraints : Constraints
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
      const closestNucleotides0 = calculateNucleotideData(
        findClosestNucleotides(
          basePairLine.v0,
          3
        ).sliced,
        basePairLine.v0
      ).filter(function({dv}) {
        return dotProduct(
          dv,
          baseLineDirection
        ) / magnitude(dv) < dotProductThreshold
      });
      const closestNucleotides1 = calculateNucleotideData(
        findClosestNucleotides(
          basePairLine.v1,
          3
        ).sliced,
        basePairLine.v1
      ).filter(function({dv}) {
        return dotProduct(
          dv,
          negatedBaseLineDirection
        ) / magnitude(dv) < dotProductThreshold;
      });
      const length0 = closestNucleotides0.length;
      const length1 = closestNucleotides1.length;
      let filteredNucleotideData = new Array<{
        indices0 : Indices,
        indices1 : Indices,
        totalDistance : number,
        distanceRatio : number,
        type : BasePair.Type
      }>();
      const expectedBasePairType = basePairLine.basePairType;
      for (let i = 0; i < length0; i++) {
        const nucleotideDatumI = closestNucleotides0[i];
        const indicesI = nucleotideDatumI.indices;
        const distanceI = nucleotideDatumI.distance;
        const symbolI = singularRnaComplexProps.rnaMoleculeProps[indicesI.rnaMoleculeName].nucleotideProps[indicesI.nucleotideIndex].symbol;
        for (let j = 0; j < length1; j++) {
          const nucleotideDatumJ = closestNucleotides1[j];
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
          failedBasePairs.zeroCandidateBasePairs[expectedBasePairType ?? "undefined"].lines.push({
            line : basePairLine
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
          failedBasePairs.tooManyCandidateBasePairs[expectedBasePairType ?? "undefined"].lines.push({
            line : basePairLine,
            arrayIndices : filteredNucleotideData.map(function({
              indices0,
              indices1
            }) {
              return {
                0 : indices0.arrayIndex,
                1 : indices1.arrayIndex
              }
            })
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
      constraints : Constraints
    ) {
      const {
        dotProductThreshold,
        minimumDistanceRatio
      } = constraints;
      const maximumDistanceRatio = 1 / minimumDistanceRatio;
      const {
        full,
        sliced
      } = findClosestNucleotides(
        basePairCenter,
        6
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
          failedBasePairs.zeroCandidateBasePairs[expectedBasePairType ?? "undefined"].centers.push({
            center : basePairCenter
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
          failedBasePairs.tooManyCandidateBasePairs[expectedBasePairType ?? "undefined"].centers.push({
            center : basePairCenter,
            arrayIndices : filteredNucleotideData.map(function({
              indices0,
              indices1
            }) {
              return {
                0 : indices0.arrayIndex,
                1 : indices1.arrayIndex
              }
            })
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
    // Make a first attempt to create base pairs.
    for (const basePairType of basePairTypeHandlingOrder) {
      const {
        centers,
        lines
      } = typedBasePairs[basePairType];
      for (const line of lines) {
        attemptToCreateBasePairDefinedByLine(
          line,
          constraints.normal
        );
      }
      for (const center of centers) {
        attemptToCreateBasePairDefinedByCenter(
          center,
          constraints.normal
        );
      }
    }
    logFlag = true;
    let failedBasePairsWorkingCopy = structuredClone(failedBasePairs);
    failedBasePairs = getInitialFailedBasePairs();
    // Make a second attempt to create base pairs (of failed base pairs).
    for (const basePairType of basePairTypeHandlingOrder) {
      // TODO: Implement support for failed base pairs with zero candidates.
      const {
        lines,
        centers
      } = failedBasePairsWorkingCopy.tooManyCandidateBasePairs[basePairType];
      for (const line of lines) {
        line.arrayIndices = line.arrayIndices.filter(function(arrayIndexPair : {0 : number, 1 : number}) {
          return arrayIndexPair[0] in flattenedNucleotideProps && arrayIndexPair[1] in flattenedNucleotideProps;
        });
        if (line.arrayIndices.length === 1) {
          const arrayIndexPair = line.arrayIndices[0];
          createBasePair(
            flattenedNucleotideProps[arrayIndexPair[0]].indices,
            flattenedNucleotideProps[arrayIndexPair[1]].indices,
            line.line.basePairType
          );
        } else {
          // TODO: Implement this.
        }
      }
      for (const center of centers) {
        center.arrayIndices = center.arrayIndices.filter(function(arrayIndexPair : {0 : number, 1 : number}) {
          return arrayIndexPair[0] in flattenedNucleotideProps && arrayIndexPair[1] in flattenedNucleotideProps;
        });
        if (center.arrayIndices.length === 1) {
          const arrayIndexPair = center.arrayIndices[0];
          createBasePair(
            flattenedNucleotideProps[arrayIndexPair[0]].indices,
            flattenedNucleotideProps[arrayIndexPair[1]].indices,
            center.center.basePairType
          );
        } else {
          // TODO: Implement this.
        }
      }
    }
  }

  // Invert y coordinates.
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

// export function parseGraphicalData(
//   rnaComplexProps : RnaComplexProps,
//   basePairLines : BasePairLines,
//   basePairCenters : BasePairCenters,
//   graphicalAdjustments : GraphicalAdjustments = {}
// ) : void {
//   // function invertYCoordinates() {
//   //   // Calculate maximum y coordinate.
//   //   let maximumYCoordinate = Number.NEGATIVE_INFINITY;
//   //   for (let singularNucleotideProps of nucleotideProps) {
//   //     if (singularNucleotideProps.y > maximumYCoordinate) {
//   //       maximumYCoordinate = singularNucleotideProps.y;
//   //     }
//   //   }
//   //   for (let bondLine of bondLines) {
//   //     for (let vector of [bondLine.v0, bondLine.v1]) {
//   //       if (vector.y > maximumYCoordinate) {
//   //         maximumYCoordinate = vector.y;
//   //       }
//   //     }
//   //   }
//   //   // Invert y coordinates.
//   //   for (let singularNucleotideProps of nucleotideProps) {
//   //     singularNucleotideProps.y = maximumYCoordinate - singularNucleotideProps.y;
//   //   }
//   //   for (let bondLine of bondLines) {
//   //     for (let vector of [bondLine.v0, bondLine.v1]) {
//   //       vector.y = maximumYCoordinate - vector.y;
//   //     }
//   //   }
//   // }

//   type FlattenedNucleotideProps =  Array<{
//     indices : NucleotideIndices,
//     singularNucleotideProps : Nucleotide.ExternalProps,
//     graphicalAdjustment : GraphicalAdjustmentPerNucleotide
//   }>;
//   function findClosestNucleotides(
//     flattenedNucleotideProps : FlattenedNucleotideProps,
//     target : Vector2D,
//     count : number
//   ) {
//     const indicesWithSquaredDistances = flattenedNucleotideProps.map(function({
//       indices,
//       singularNucleotideProps,
//       graphicalAdjustment
//     }) {
//       const adjustedPosition = {
//         x : singularNucleotideProps.x - graphicalAdjustment.x * 0.5,
//         y : singularNucleotideProps.y + graphicalAdjustment.y
//       };
//       return {
//         indices,
//         adjustedPosition,
//         squaredDistance : distanceSquared(target, adjustedPosition)
//       };
//     });

//     if (indicesWithSquaredDistances.length < count) {
//       throw TOO_FEW_NUCLEOTIDES_ERROR;
//     }
//     indicesWithSquaredDistances.sort(function(
//       indicesWithSquaredDistance0,
//       indicesWithSquaredDistance1
//     ) {
//       return indicesWithSquaredDistance0.squaredDistance - indicesWithSquaredDistance1.squaredDistance;
//     });
//     return {
//       indices : indicesWithSquaredDistances.slice(
//         0,
//         count
//       ).map(function(indicesWithSquaredDistance) {
//         return indicesWithSquaredDistance.indices;
//       }),
//       indicesWithSquaredDistances
//     };
//   }

//   function flattenNucleotideProps(
//     singularRnaComplexProps : RnaComplex.ExternalProps,
//     graphicalAdjustmentsPerRnaComplex : GraphicalAdjustmentsPerRnaComplex
//   ) {
//     const flattenedNucleotides : FlattenedNucleotideProps = [];
//     const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
//     for (const rnaMoleculeName in rnaMoleculeProps) {
//       const graphicalAdjustmentsPerRnaMolecule = graphicalAdjustmentsPerRnaComplex[rnaMoleculeName] ?? {};
//       const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
//       const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
//       for (const nucleotideIndexAsString in nucleotideProps) {
//         const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
//         const singularNucleotideProps = nucleotideProps[nucleotideIndex];
//         flattenedNucleotides.push({
//           indices : {
//             rnaMoleculeName,
//             nucleotideIndex
//           },
//           singularNucleotideProps,
//           graphicalAdjustment : graphicalAdjustmentsPerRnaMolecule[nucleotideIndex] ?? {
//             x : 0,
//             y : 0
//           }
//         });
//       }
//     }
//     return flattenedNucleotides;
//   }

//   function createBasePairDefinedByBasePairCenter(
//     flattenedNucleotideProps : FlattenedNucleotideProps,
//     basePairCenter : Vector2D,
//     rnaComplexIndex : number,
//     basePairType? : BasePair.Type
//   ) {
//     const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
//     const closestNucleotides = findClosestNucleotides(
//       flattenedNucleotideProps,
//       basePairCenter,
//       6
//     );
//     const nucleotideData = closestNucleotides.indicesWithSquaredDistances.slice(0, 6).map(function({
//       indices,
//       squaredDistance,
//       adjustedPosition
//     }) {
//       return {
//         dv : subtract(
//           adjustedPosition,
//           basePairCenter
//         ),
//         distance : Math.sqrt(squaredDistance),
//         indices
//       };
//     });
//     let filteredNucleotideData = new Array<{
//       nucleotideIndices0 : NucleotideIndices,
//       nucleotideIndices1 : NucleotideIndices,
//       dotProduct : number,
//       totalDistance : number,
//       distanceMetric : number,
//       type : BasePair.Type
//     }>();
//     for (let i = 0; i < nucleotideData.length; i++) {
//       const nucleotideDatumI = nucleotideData[i];
//       const indicesI = nucleotideDatumI.indices;
//       const distanceI = nucleotideDatumI.distance;
//       const symbolI = singularRnaComplexProps.rnaMoleculeProps[indicesI.rnaMoleculeName].nucleotideProps[indicesI.nucleotideIndex].symbol;
//       for (let j = i + 1; j < nucleotideData.length; j++) {
//         const nucleotideDatumJ = nucleotideData[j];
//         const indicesJ = nucleotideDatumJ.indices;
//         const distanceJ = nucleotideDatumJ.distance;
//         const dotProductIJ = dotProduct(
//           nucleotideDatumI.dv,
//           nucleotideDatumJ.dv
//         ) / (distanceI * distanceJ);
//         const symbolJ = singularRnaComplexProps.rnaMoleculeProps[indicesJ.rnaMoleculeName].nucleotideProps[indicesJ.nucleotideIndex].symbol;
//         if ((
//           indicesI.rnaMoleculeName !== indicesJ.rnaMoleculeName ||
//           Math.abs(indicesI.nucleotideIndex - indicesJ.nucleotideIndex) > 0
//         )) {
//           filteredNucleotideData.push({
//             nucleotideIndices0 : nucleotideDatumI.indices,
//             nucleotideIndices1 : nucleotideDatumJ.indices,
//             dotProduct : dotProductIJ,
//             totalDistance : distanceI + distanceJ,
//             distanceMetric : Math.abs(distanceI - distanceJ),
//             type : getBasePairType(
//               symbolI,
//               symbolJ
//             )
//           });
//         }
//       }
//     }
//     function createBasePair() {
//       const {
//         nucleotideIndices0,
//         nucleotideIndices1
//       } = filteredNucleotideData[0];
//       insertBasePair(
//         singularRnaComplexProps,
//         nucleotideIndices0.rnaMoleculeName,
//         nucleotideIndices0.nucleotideIndex,
//         nucleotideIndices1.rnaMoleculeName,
//         nucleotideIndices1.nucleotideIndex,
//         DuplicateBasePairKeysHandler.THROW_ERROR
//       );
//     }
//     if (basePairType !== undefined) {
//       filteredNucleotideData = filteredNucleotideData.filter(function({ type }) {
//         return basePairType === type;
//       });
//       switch (filteredNucleotideData.length) {
//         case 0 : {
//           throw `The input SVG file contains a malformed base pair.`;
//         }
//         case 1 : {
//           createBasePair();
//           return;
//         }
//       }
//     }
//     const nucleotideDataWithTheCorrectBasePairType = filteredNucleotideData;
//     filteredNucleotideData = filteredNucleotideData.filter(function({ dotProduct }) {
//       return dotProduct < DOT_PRODUCT_THRESHOLD;
//     });
//     filteredNucleotideData.sort(function(
//       nucleotidesDatum0,
//       nucleotidesDatum1
//     ) {
//       return nucleotidesDatum0.totalDistance - nucleotidesDatum1.totalDistance;
//     });
//     if (filteredNucleotideData.length === 0) {
//       filteredNucleotideData = nucleotideDataWithTheCorrectBasePairType;
//       filteredNucleotideData.sort(function(
//         nucleotidesDatum0,
//         nucleotidesDatum1
//       ) {
//         return nucleotidesDatum0.distanceMetric - nucleotidesDatum1.distanceMetric;
//       });
//     }
//     createBasePair();
//   }

//   function invertYCoordinates() {
//     let maximumYCoordinate = Number.NEGATIVE_INFINITY;
//     for (const singularRnaComplexProps of Object.values(rnaComplexProps)) {
//       for (const singularRnaMoleculeProps of Object.values(singularRnaComplexProps.rnaMoleculeProps)) {
//         for (const singularNucleotideProps of Object.values(singularRnaMoleculeProps.nucleotideProps)) {
//           singularNucleotideProps.y *= -1;
//           if (singularNucleotideProps.labelContentProps !== undefined) {
//             singularNucleotideProps.labelContentProps.y *= -1;
//           }
//           if (singularNucleotideProps.labelLineProps !== undefined) {
//             for (const point of singularNucleotideProps.labelLineProps.points) {
//               point.y *= -1;
//             }
//           }
//         }
//       }
//     }
//   }

//   for (const rnaComplexIndexAsString in rnaComplexProps) {
//     const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
//     const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
//     const basePairLinesPerRnaComplex = basePairLines[rnaComplexIndex] ?? [];
//     const basePairCentersPerRnaComplex = basePairCenters[rnaComplexIndex] ?? [];
//     const graphicalAdjustmentsPerRnaComplex = graphicalAdjustments[rnaComplexIndex] ?? {};
//     const flattenedNucleotideProps = flattenNucleotideProps(
//       singularRnaComplexProps,
//       graphicalAdjustmentsPerRnaComplex
//     );
//     for (const basePairLine of basePairLinesPerRnaComplex) {
//       if (distanceSquared(basePairLine.v0, basePairLine.v1) > EPSILON_SQUARED) {
//         const basePairLineCenter = scaleUp(add(basePairLine.v0, basePairLine.v1), 0.5);
//         const dv0 = subtract(basePairLine.v0, basePairLineCenter);
//         const dv1 = negate(dv0);
//         for (const scalar of SCALARS_TO_TRY) {
//           const scaledLine : Line2D = {
//             v0 : add(basePairLineCenter, scaleUp(dv0, scalar)),
//             v1 : add(basePairLineCenter, scaleUp(dv1, scalar))
//           };
//           const indicesOfClosestNucleotide0 = findClosestNucleotides(
//             flattenedNucleotideProps,
//             scaledLine.v0,
//             1
//           ).indices[0];
//           const indicesOfClosestNucleotide1 = findClosestNucleotides(
//             flattenedNucleotideProps,
//             scaledLine.v1,
//             1
//           ).indices[0];
//           if (
//             indicesOfClosestNucleotide0.rnaMoleculeName !== indicesOfClosestNucleotide1.rnaMoleculeName ||
//             Math.abs(indicesOfClosestNucleotide0.nucleotideIndex - indicesOfClosestNucleotide1.nucleotideIndex) > 1
//           ) {
//             insertBasePair(
//               singularRnaComplexProps,
//               indicesOfClosestNucleotide0.rnaMoleculeName,
//               indicesOfClosestNucleotide0.nucleotideIndex,
//               indicesOfClosestNucleotide1.rnaMoleculeName,
//               indicesOfClosestNucleotide1.nucleotideIndex,
//               DuplicateBasePairKeysHandler.THROW_ERROR
//             );
//             break;
//           }
//         }
//       } else {
//         createBasePairDefinedByBasePairCenter(
//           flattenedNucleotideProps,
//           basePairLine.v0,
//           rnaComplexIndex,
//           BasePair.Type.CANONICAL
//         );
//       }
//     }
//     for (const basePairCenter of basePairCentersPerRnaComplex) {
//       createBasePairDefinedByBasePairCenter(
//         flattenedNucleotideProps,
//         basePairCenter,
//         rnaComplexIndex,
//         basePairCenter.type
//       );
//     }
//   }
//   invertYCoordinates();
// }