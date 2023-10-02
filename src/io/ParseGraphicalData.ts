import { RnaComplexKey, RnaComplexProps } from "../App";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { DuplicateBasePairKeysHandler, RnaComplex, insertBasePair } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { Line2D } from "../data_structures/Geometry";
import { Vector2D, add, distance, distanceSquared, dotProduct, negate, scaleUp, subtract } from "../data_structures/Vector2D";

const EPSILON = 1e-4;
const SCALARS_TO_TRY = [1, 1.5, 2, 2.5, 3, 3.5, 4];
// This number is the dot product of <-1, 0> and <cos(PI / 4), sin(PI / 4)>.
// A dot product less than or equal to this number suggests that the two input vectors point mostly in opposite directions.
const DOT_PRODUCT_THRESHOLD = -0.7071067811865476;

const TOO_FEW_NUCLEOTIDES_ERROR = "Too few nucleotides exist within the RNA complex (the number is less than the requested number).";

type NucleotideIndices = {
  rnaMoleculeName : string,
  nucleotideIndex : number
};

export function parseGraphicalData(
  rnaComplexProps : RnaComplexProps,
  basePairLines : Record<RnaComplexKey, Array<Line2D>>
) : void {
  // function invertYCoordinates() {
  //   // Calculate maximum y coordinate.
  //   let maximumYCoordinate = Number.NEGATIVE_INFINITY;
  //   for (let singularNucleotideProps of nucleotideProps) {
  //     if (singularNucleotideProps.y > maximumYCoordinate) {
  //       maximumYCoordinate = singularNucleotideProps.y;
  //     }
  //   }
  //   for (let bondLine of bondLines) {
  //     for (let vector of [bondLine.v0, bondLine.v1]) {
  //       if (vector.y > maximumYCoordinate) {
  //         maximumYCoordinate = vector.y;
  //       }
  //     }
  //   }
  //   // Invert y coordinates.
  //   for (let singularNucleotideProps of nucleotideProps) {
  //     singularNucleotideProps.y = maximumYCoordinate - singularNucleotideProps.y;
  //   }
  //   for (let bondLine of bondLines) {
  //     for (let vector of [bondLine.v0, bondLine.v1]) {
  //       vector.y = maximumYCoordinate - vector.y;
  //     }
  //   }
  // }

  type FlattenedNucleotideProps =  Array<{
    indices : NucleotideIndices,
    singularNucleotideProps : Nucleotide.ExternalProps
  }>;
  function findClosestNucleotides(
    flattenedNucleotideProps : FlattenedNucleotideProps,
    target : Vector2D,
    count : number
  ) {
    const indicesWithSquaredDistances = flattenedNucleotideProps.map(function({indices, singularNucleotideProps}) {
      return {
        indices,
        squaredDistance : distanceSquared(target, singularNucleotideProps)
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
      indices : indicesWithSquaredDistances.slice(
        0,
        count
      ).map(function(indicesWithSquaredDistance) {
        return indicesWithSquaredDistance.indices;
      }),
      indicesWithSquaredDistances
    };
  }

  function flattenNucleotideProps(
    singularRnaComplexProps : RnaComplex.ExternalProps
  ) {
    const flattenedNucleotides : FlattenedNucleotideProps = [];
    const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
    for (const rnaMoleculeName in rnaMoleculeProps) {
      const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
      const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
      for (const nucleotideIndexAsString in nucleotideProps) {
        const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        const singularNucleotideProps = nucleotideProps[nucleotideIndex];
        flattenedNucleotides.push({
          indices : {
            rnaMoleculeName,
            nucleotideIndex
          },
          singularNucleotideProps
        });
      }
    }
    return flattenedNucleotides;
  }

  function createBasePairDefinedByCircleCenter(
    singularRnaComplexProps : RnaComplex.ExternalProps,
    candidateNucleotideIndices : Array<{
      indices : NucleotideIndices,
      squaredDistance : number
    }>,
    circleCenter : Vector2D
  ) {
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const nucleotideData = candidateNucleotideIndices.map(function({ indices, squaredDistance }) {
      const { rnaMoleculeName, nucleotideIndex } = indices;
      const singularNucleotideProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
      return {
        dv : subtract(
          singularNucleotideProps,
          circleCenter
        ),
        distance : Math.sqrt(squaredDistance),
        indices
      };
    });
    const circularlyOrientedNucleotidesData = new Array<{
      nucleotideIndices0 : NucleotideIndices,
      nucleotideIndices1 : NucleotideIndices,
      totalDistance : number
    }>();
    for (let i = 0; i < nucleotideData.length; i++) {
      const nucleotideDatumI = nucleotideData[i];
      const indicesI = nucleotideDatumI.indices;
      for (let j = i + 1; j < nucleotideData.length; j++) {
        const nucleotideDatumJ = nucleotideData[j];
        const indicesJ = nucleotideDatumJ.indices;
        if ((
          indicesI.rnaMoleculeName !== indicesJ.rnaMoleculeName ||
          Math.abs(indicesI.nucleotideIndex - indicesJ.nucleotideIndex) > 0
        ) && dotProduct(
          nucleotideDatumI.dv,
          nucleotideDatumJ.dv
        ) < DOT_PRODUCT_THRESHOLD) {
          circularlyOrientedNucleotidesData.push({
            nucleotideIndices0 : nucleotideDatumI.indices,
            nucleotideIndices1 : nucleotideDatumJ.indices,
            totalDistance : nucleotideDatumI.distance + nucleotideDatumJ.distance
          });
        }
      }
    }
    circularlyOrientedNucleotidesData.sort(function(
      circularlyOrientedNucleotidesDatum0,
      circularlyOrientedNucleotidesDatum1
    ) {
      return circularlyOrientedNucleotidesDatum0.totalDistance - circularlyOrientedNucleotidesDatum1.totalDistance;
    });
    const {
      nucleotideIndices0,
      nucleotideIndices1
    } = circularlyOrientedNucleotidesData[0];
    insertBasePair(
      singularRnaComplexProps,
      nucleotideIndices0.rnaMoleculeName,
      nucleotideIndices0.nucleotideIndex,
      nucleotideIndices1.rnaMoleculeName,
      nucleotideIndices1.nucleotideIndex,
      DuplicateBasePairKeysHandler.THROW_ERROR
    );
  }

  function invertYCoordinates() {
    let maximumYCoordinate = Number.NEGATIVE_INFINITY;
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

  for (const rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    if (rnaComplexIndex in basePairLines) {
      const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
      const basePairLinesPerRnaComplex = basePairLines[rnaComplexIndex];
      const flattenedNucleotideProps = flattenNucleotideProps(
        singularRnaComplexProps
      );
      for (const bondLine of basePairLinesPerRnaComplex) {
        if (distance(bondLine.v0, bondLine.v1) > EPSILON) {
          const bondLineCenter = scaleUp(add(bondLine.v0, bondLine.v1), 0.5);
          const dv0 = subtract(bondLine.v0, bondLineCenter);
          const dv1 = negate(dv0);
          for (const scalar of SCALARS_TO_TRY) {
            const scaledLine : Line2D = {
              v0 : add(bondLineCenter, scaleUp(dv0, scalar)),
              v1 : add(bondLineCenter, scaleUp(dv1, scalar))
            };
            const indicesOfClosestNucleotide0 = findClosestNucleotides(
              flattenedNucleotideProps,
              scaledLine.v0,
              1
            ).indices[0];
            const indicesOfClosestNucleotide1 = findClosestNucleotides(
              flattenedNucleotideProps,
              scaledLine.v1,
              1
            ).indices[0];
            if (
              indicesOfClosestNucleotide0.rnaMoleculeName !== indicesOfClosestNucleotide1.rnaMoleculeName ||
              Math.abs(indicesOfClosestNucleotide0.nucleotideIndex - indicesOfClosestNucleotide1.nucleotideIndex) > 1
            ) {
              insertBasePair(
                singularRnaComplexProps,
                indicesOfClosestNucleotide0.rnaMoleculeName,
                indicesOfClosestNucleotide0.nucleotideIndex,
                indicesOfClosestNucleotide1.rnaMoleculeName,
                indicesOfClosestNucleotide1.nucleotideIndex,
                DuplicateBasePairKeysHandler.THROW_ERROR
              );
              break;
            }
          }
        } else {
          const closestNucleotides = findClosestNucleotides(
            flattenedNucleotideProps,
            bondLine.v0,
            2
          );
          const indicesOfClosestNucleotides = closestNucleotides.indices;
          const indicesOfClosestNucleotide0 = indicesOfClosestNucleotides[0];
          const indicesOfClosestNucleotide1 = indicesOfClosestNucleotides[1];
          if (
            indicesOfClosestNucleotide0.rnaMoleculeName !== indicesOfClosestNucleotide1.rnaMoleculeName ||
            Math.abs(indicesOfClosestNucleotide0.nucleotideIndex - indicesOfClosestNucleotide1.nucleotideIndex) > 1
          ) {
            insertBasePair(
              singularRnaComplexProps,
              indicesOfClosestNucleotide0.rnaMoleculeName,
              indicesOfClosestNucleotide0.nucleotideIndex,
              indicesOfClosestNucleotide1.rnaMoleculeName,
              indicesOfClosestNucleotide1.nucleotideIndex,
              DuplicateBasePairKeysHandler.THROW_ERROR
            );
          } else {
            createBasePairDefinedByCircleCenter(
              singularRnaComplexProps,
              closestNucleotides.indicesWithSquaredDistances.slice(0, 6),
              bondLine.v0
            );
          }
        }
      }
    }
  }
  invertYCoordinates();
}