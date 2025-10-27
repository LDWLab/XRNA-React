import { createElement, useContext, useEffect, useMemo, useState } from "react";
import { RnaMoleculeKey, NucleotideKey } from "../../App";
import { BasePairKeysToRerenderPerRnaComplex, Context, NucleotideKeysToRerenderPerRnaComplex } from "../../context/Context";
import { Vector2D, add, distance, scaleUp } from "../../data_structures/Vector2D";
import Scaffolding from "../generic/Scaffolding";
import BasePair, { getBasePairType } from "./BasePair";
import { RnaMolecule } from "./RnaMolecule";
import { binarySearch, HandleQueryNotFound, median, sortedArraySplice } from "../../utils/Utils";
import { SVG_PROPERTY_XRNA_COMPLEX_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";

const distanceScalars : Partial<Record<BasePair.Type, number>> = {
  [BasePair.Type.WOBBLE] : 1.15
}

export enum DuplicateBasePairKeysHandler {
  DO_NOTHING,
  THROW_ERROR,
  DELETE_PREVIOUS_MAPPING
}

export function insertBasePair(
  singularRnaComplexProps : RnaComplex.ExternalProps,
  rnaMoleculeName0 : string,
  nucleotideIndex0 : number,
  rnaMoleculeName1 : string,
  nucleotideIndex1 : number,
  duplicateBasePairKeysHandler = DuplicateBasePairKeysHandler.DO_NOTHING,
  optionalBasePairParameters : Pick<RnaComplex.MappedBasePair, "basePairType" | "color" | "strokeWidth" | "points"> = {}
) {
  const { basePairs } = singularRnaComplexProps;
  if (
    rnaMoleculeName0 in basePairs &&
    nucleotideIndex0 in basePairs[rnaMoleculeName0]
  ) {
    let foundBasePair = basePairs[rnaMoleculeName0][nucleotideIndex0].find(basePair => (
      basePair.rnaMoleculeName === rnaMoleculeName1 &&
      basePair.nucleotideIndex === nucleotideIndex1
    ));
    if (foundBasePair !== undefined) {
      foundBasePair.basePairType = optionalBasePairParameters.basePairType;
      // basePairs is a symmetric data structure. Therefore, definitivity of foundBasePair implies success of the following statement.
      basePairs[rnaMoleculeName1][nucleotideIndex1].find(basePair => (
        basePair.rnaMoleculeName === rnaMoleculeName0 &&
        basePair.nucleotideIndex === nucleotideIndex0
      ))!.basePairType = optionalBasePairParameters.basePairType;
    }
    return [{
      keys0 : {
        rnaMoleculeName : rnaMoleculeName0,
        nucleotideIndex : nucleotideIndex0
      },
      keys1 : {
        rnaMoleculeName : rnaMoleculeName1,
        nucleotideIndex : nucleotideIndex1
      }
    }];
  }
  const duplicateBasePairKeys = new Array<RnaComplex.FullBasePairKeys>();
  const basePairsToCreate = [];
  const basePairInfo0 = {
    rnaMoleculeName : rnaMoleculeName0,
    nucleotideIndex : nucleotideIndex0,
    basePairedRnaMoleculeName : rnaMoleculeName1,
    basePairedNucleotideIndex : nucleotideIndex1,
    basePairType : optionalBasePairParameters.basePairType
  };
  const basePairInfo1 = {
    rnaMoleculeName : rnaMoleculeName1,
    nucleotideIndex : nucleotideIndex1,
    basePairedRnaMoleculeName : rnaMoleculeName0,
    basePairedNucleotideIndex : nucleotideIndex0,
    basePairType : optionalBasePairParameters.basePairType
  };
  optionalBasePairParameters = structuredClone(optionalBasePairParameters);
  delete optionalBasePairParameters.basePairType;
  if (basePairInfo0.basePairType !== undefined && BasePair.isDirectedType(basePairInfo0.basePairType)) {
    basePairInfo1.basePairType = BasePair.reverseDirectedTypeMap[basePairInfo0.basePairType];
  }
  for (let basePairInfo of [
    basePairInfo0,
    basePairInfo1
  ]) {
    const {
      rnaMoleculeName,
      nucleotideIndex,
      basePairedRnaMoleculeName,
      basePairedNucleotideIndex,
      basePairType
    } = basePairInfo;
    if (!(rnaMoleculeName in basePairs)) {
      basePairs[rnaMoleculeName] = {};
    }
    const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
    if (nucleotideIndex in basePairsPerRnaMolecule) {
      const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
      for (const basePairPerNucleotide of basePairsPerNucleotide) {
        switch (duplicateBasePairKeysHandler) {
          case DuplicateBasePairKeysHandler.DO_NOTHING : {
            // Do nothing.
            break;
          }
          case DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING : {
            const [
              keys0,
              keys1
            ] = [
              {
                rnaMoleculeName,
                nucleotideIndex
              },
              basePairPerNucleotide
            ].sort(compareBasePairKeys);
            duplicateBasePairKeys.push({
              keys0,
              keys1
            });
            delete basePairs[basePairPerNucleotide.rnaMoleculeName][basePairPerNucleotide.nucleotideIndex];
            break;
          }
          case DuplicateBasePairKeysHandler.THROW_ERROR : {
            throw "Duplicate base-pair keys were found within this RNA complex. This is not allowed.";
          }
        }
      }
    }
    basePairsToCreate.push({
      basePairsPerRnaMolecule,
      nucleotideIndex,
      mappedBasePairInformation : {
        rnaMoleculeName : basePairedRnaMoleculeName,
        nucleotideIndex : basePairedNucleotideIndex,
        ...optionalBasePairParameters,
        basePairType
      }
    });
  }
  for (const basePairToCreate of basePairsToCreate) {
    const {
      basePairsPerRnaMolecule,
      nucleotideIndex,
      mappedBasePairInformation
    } = basePairToCreate;
    if (!(nucleotideIndex in basePairsPerRnaMolecule)) {
      basePairsPerRnaMolecule[nucleotideIndex] = [];
    }
    const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
    basePairsPerNucleotide.push(mappedBasePairInformation);
  }
  return duplicateBasePairKeys;
}

export function compareBasePairKeys(
  keys0 : RnaComplex.BasePairKeys,
  keys1 : RnaComplex.BasePairKeys
) {
  return (
    keys0.rnaMoleculeName.localeCompare(keys1.rnaMoleculeName) ||
    (keys0.nucleotideIndex - keys1.nucleotideIndex)
  );
}

export function compareFullBasePairKeys(
  fullKeys0 : RnaComplex.FullBasePairKeys,
  fullKeys1 : RnaComplex.FullBasePairKeys
) {
  return (
    compareBasePairKeys(
      fullKeys0.keys0,
      fullKeys1.keys0
    ) ||
    compareBasePairKeys(
      fullKeys0.keys1,
      fullKeys1.keys1
    )
  )
}

export function isRelevantBasePairKeySetInPair(
  keys0 : RnaComplex.BasePairKeys,
  keys1 : RnaComplex.BasePairKeys
) {
  return compareBasePairKeys(keys0, keys1) <= 0;
}

export function selectRelevantBasePairKeys(
  keys0 : RnaComplex.BasePairKeys,
  keys1 : RnaComplex.BasePairKeys
) {
  return isRelevantBasePairKeySetInPair(keys0, keys1) ? keys0 : keys1;
}

export namespace RnaComplex {
  export type BasePairKeys = {
    rnaMoleculeName : RnaMoleculeKey,
    nucleotideIndex : NucleotideKey
  };

  export type FullBasePairKeys = {
    keys0 : BasePairKeys,
    keys1 : BasePairKeys
  };

  export type MappedBasePair = BasePairKeys & BasePair.CoreProps;

  export type BasePairsPerNucleotide = Array<MappedBasePair>;

  export type BasePairsPerRnaMolecule = Record<NucleotideKey, BasePairsPerNucleotide>;

  export type BasePairs = Record<RnaMoleculeKey, BasePairsPerRnaMolecule>;

  export type ExternalProps = {
    name : string,
    rnaMoleculeProps : Record<string, RnaMolecule.ExternalProps>,
    basePairs : BasePairs
  };

  export type Props = ExternalProps & {
    nucleotideKeysToRerenderPerRnaComplex : NucleotideKeysToRerenderPerRnaComplex,
    basePairKeysToRerenderPerRnaComplex : BasePairKeysToRerenderPerRnaComplex,
    basePairUpdateTrigger : number
  };

  function createKey(
    {
      keys0,
      keys1
    } : {
      keys0 : BasePairKeys,
      keys1 : BasePairKeys
    }
  ) {
    return `#${keys0.nucleotideIndex} in ${keys0.rnaMoleculeName} basepaired to #${keys1.nucleotideIndex} in ${keys1.rnaMoleculeName}`;
  }

  export function Component(props : Props) {
    type SingularFlattenedBasePairProps = BasePair.Props & { key : string, nucleotideIndex0 : NucleotideKey, nucleotideIndex1 : NucleotideKey };
    const {
      name,
      rnaMoleculeProps,
      basePairs,
      nucleotideKeysToRerenderPerRnaComplex,
      basePairKeysToRerenderPerRnaComplex,
      basePairUpdateTrigger
    } = props;
    // Begin context data.
    const index = useContext(Context.RnaComplex.Index);
    const basePairDataToEditPerRnaComplex = useContext(Context.BasePair.DataToEditPerRnaComplex);
    const basePairAverageRadii = useContext(Context.BasePair.AverageDistances);
    const updateBasePairAverageDistances = useContext(Context.BasePair.UpdateAverageDistances);
    // Begin memo data.
    const flattenedRnaMoleculeProps = Object.entries(rnaMoleculeProps);
    const flattenedBasePairProps = useMemo(
      function() {
        const flattenedBasePairProps = new Array<SingularFlattenedBasePairProps>();
        Object.entries(basePairs).forEach(function([
          rnaMoleculeName,
          basePairsPerRnaMolecule
        ]) {
          const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
          Object.entries(basePairsPerRnaMolecule).forEach(function([
            nucleotideIndexAsString,
            basePairsPerNucleotide
          ]) {
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            const basePairKeys = {
              rnaMoleculeName,
              nucleotideIndex
            };
            for (const basePairPerNucleotide of basePairsPerNucleotide) {
              if (isRelevantBasePairKeySetInPair(
                basePairKeys,
                basePairPerNucleotide
              )) {
                const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
                const singularBasePairedRnaMoleculeProps = rnaMoleculeProps[basePairPerNucleotide.rnaMoleculeName];
                const singularBasePairedNucleotideProps = singularBasePairedRnaMoleculeProps.nucleotideProps[basePairPerNucleotide.nucleotideIndex];
                if (basePairPerNucleotide.basePairType === undefined) {
                  basePairPerNucleotide.basePairType = getBasePairType(
                    singularNucleotideProps.symbol,
                    singularBasePairedNucleotideProps.symbol
                  );
                }
                flattenedBasePairProps.push({
                  key : createKey({
                    keys0 : basePairKeys,
                    keys1 : basePairPerNucleotide
                  }),
                  mappedBasePair : basePairPerNucleotide as BasePair.FinalizedMappedBasePair,
                  position0 : singularNucleotideProps,
                  position1 : singularBasePairedNucleotideProps,
                  rnaComplexIndex : index,
                  rnaComplexName : name,
                  rnaMoleculeName0 : rnaMoleculeName,
                  nucleotideIndex0 : nucleotideIndex,
                  formattedNucleotideIndex0 : nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex,
                  rnaMoleculeName1 : basePairPerNucleotide.rnaMoleculeName,
                  nucleotideIndex1 : basePairPerNucleotide.nucleotideIndex,
                  formattedNucleotideIndex1 : basePairPerNucleotide.nucleotideIndex + singularBasePairedRnaMoleculeProps.firstNucleotideIndex,
                  updateTrigger : 0
                });
              }
            }
          });
        });
        flattenedBasePairProps.sort(function(
          singularFlattenedBasePairProps0,
          singularFlattenedBasePairProps1
        ) {
          return compareFullBasePairKeys(
            {
              keys0 : {
                rnaMoleculeName : singularFlattenedBasePairProps0.rnaMoleculeName0,
                nucleotideIndex : singularFlattenedBasePairProps0.nucleotideIndex0
              },
              keys1 : {
                rnaMoleculeName : singularFlattenedBasePairProps0.rnaMoleculeName1,
                nucleotideIndex : singularFlattenedBasePairProps0.nucleotideIndex1
              }
            },
            {
              keys0 : {
                rnaMoleculeName : singularFlattenedBasePairProps1.rnaMoleculeName0,
                nucleotideIndex : singularFlattenedBasePairProps1.nucleotideIndex0
              },
              keys1 : {
                rnaMoleculeName : singularFlattenedBasePairProps1.rnaMoleculeName1,
                nucleotideIndex : singularFlattenedBasePairProps1.nucleotideIndex1
              }
            }
          );
        });
        return flattenedBasePairProps;
      },
      [basePairs, basePairUpdateTrigger]
    );
    const averageBasePairStrokeWidth = useMemo(
      function() {
        let count = 0;
        let sum = 0;
        for (const rnaMoleculeName of Object.keys(basePairs)) {
          const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
          for (const nucleotideIndexAsString of Object.keys(basePairsPerRnaMolecule)) {
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
            for (const { strokeWidth } of basePairsPerNucleotide) {
              if (strokeWidth !== undefined) {
                count++;
                sum += strokeWidth;
              }
            }
          }
        }
        return count === 0 ? DEFAULT_STROKE_WIDTH : sum / count;
      },
      [basePairs]
    );
    const editedFlattenedBasePairProps = useMemo(
      function() {
        let editedFlattenedBasePairProps = [...flattenedBasePairProps];
        if (basePairDataToEditPerRnaComplex !== undefined) {
          for (const basePairDatumToDelete of basePairDataToEditPerRnaComplex.delete) {
            const {
              keys0,
              keys1
            } = basePairDatumToDelete;
            sortedArraySplice(
              editedFlattenedBasePairProps,
              function(editedFlattenedBasePairPropsI : SingularFlattenedBasePairProps) {
                return compareFullBasePairKeys(
                  {
                    keys0 : {
                      rnaMoleculeName : editedFlattenedBasePairPropsI.rnaMoleculeName0,
                      nucleotideIndex : editedFlattenedBasePairPropsI.nucleotideIndex0
                    },
                    keys1 : {
                      rnaMoleculeName : editedFlattenedBasePairPropsI.rnaMoleculeName1,
                      nucleotideIndex : editedFlattenedBasePairPropsI.nucleotideIndex1
                    }
                  },
                  basePairDatumToDelete
                );
              },
              1,
              [],
              HandleQueryNotFound.DO_NOTHING
            );
          }
          for (const basePairDatumToAdd of basePairDataToEditPerRnaComplex.add) {
            const { keys0, keys1 } = basePairDatumToAdd;
            const {
              rnaMoleculeName,
              nucleotideIndex
            } = keys0;
            const basePairsPerNucleotide = basePairs[rnaMoleculeName][nucleotideIndex];
            const basePairPerNucleotide = basePairsPerNucleotide.find((basePairPerNucleotide) => (
              basePairPerNucleotide.rnaMoleculeName === keys1.rnaMoleculeName &&
              basePairPerNucleotide.nucleotideIndex === keys1.nucleotideIndex
            ))!;
            if (isRelevantBasePairKeySetInPair(
              keys0,
              keys1
            )) {
              const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
              const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
              const singularBasePairedRnaMoleculeProps = rnaMoleculeProps[keys1.rnaMoleculeName];
              const singularBasePairedNucleotideProps = singularBasePairedRnaMoleculeProps.nucleotideProps[keys1.nucleotideIndex];
              if (basePairPerNucleotide.basePairType === undefined) {
                basePairPerNucleotide.basePairType = getBasePairType(
                  singularNucleotideProps.symbol,
                  singularBasePairedNucleotideProps.symbol
                );
              }
              const newSingularFlattenedBasePairProps : SingularFlattenedBasePairProps = {
                mappedBasePair : basePairPerNucleotide as BasePair.FinalizedMappedBasePair,
                position0 : singularNucleotideProps,
                position1 : singularBasePairedNucleotideProps,
                rnaComplexIndex : index,
                rnaComplexName : name,
                rnaMoleculeName0 : rnaMoleculeName,
                nucleotideIndex0 : nucleotideIndex,
                formattedNucleotideIndex0 : nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex,
                rnaMoleculeName1 : keys1.rnaMoleculeName,
                nucleotideIndex1 : keys1.nucleotideIndex,
                formattedNucleotideIndex1 : keys1.nucleotideIndex + singularBasePairedRnaMoleculeProps.firstNucleotideIndex,
                key : createKey(
                  basePairDatumToAdd
                )
              };
              sortedArraySplice(
                editedFlattenedBasePairProps,
                function(editedFlattenedBasePairPropsI : SingularFlattenedBasePairProps) {
                  return compareFullBasePairKeys(
                    {
                      keys0 : {
                        rnaMoleculeName : editedFlattenedBasePairPropsI.rnaMoleculeName0,
                        nucleotideIndex : editedFlattenedBasePairPropsI.nucleotideIndex0
                      },
                      keys1 : {
                        rnaMoleculeName : editedFlattenedBasePairPropsI.rnaMoleculeName1,
                        nucleotideIndex : editedFlattenedBasePairPropsI.nucleotideIndex1
                      }
                    },
                    basePairDatumToAdd
                  );
                },
                0,
                [newSingularFlattenedBasePairProps],
                HandleQueryNotFound.ADD
              );
            }
          }
        }
        const uniqueBasePairKeysToRerenderPerRnaComplex = [];
        const visited : Record<RnaMoleculeKey, Set<NucleotideKey>> = {};
        for (const keys of basePairKeysToRerenderPerRnaComplex) {
          const { rnaMoleculeName, nucleotideIndex } = keys;
          if (!(rnaMoleculeName in visited) || !visited[rnaMoleculeName].has(nucleotideIndex)) {
            uniqueBasePairKeysToRerenderPerRnaComplex.push(keys);
            if (!(rnaMoleculeName in visited)) {
              visited[rnaMoleculeName] = new Set<NucleotideKey>();
            }
            visited[rnaMoleculeName].add(nucleotideIndex);
          }
        }
        for (const keys of uniqueBasePairKeysToRerenderPerRnaComplex) {
          const binarySearchResult = binarySearch(
            editedFlattenedBasePairProps,
            ({ rnaMoleculeName0, nucleotideIndex0 }) => compareBasePairKeys(
              {
                rnaMoleculeName : rnaMoleculeName0,
                nucleotideIndex : nucleotideIndex0
              },
              keys
            )
          );
          if (binarySearchResult !== null) {
            let { arrayIndex } = binarySearchResult;
            for (let arrayIndex = binarySearchResult.arrayIndex; arrayIndex >= 0; arrayIndex--) {
              const arrayEntry = editedFlattenedBasePairProps[arrayIndex];
              if ((
                arrayEntry.rnaMoleculeName0 !== binarySearchResult.arrayEntry.rnaMoleculeName0 ||
                arrayEntry.nucleotideIndex0 !== binarySearchResult.arrayEntry.nucleotideIndex0
              )) {
                break;
              }
              editedFlattenedBasePairProps[arrayIndex] = {
                ...arrayEntry,
                updateTrigger : Math.random()
              };
            }
            for (let arrayIndex = binarySearchResult.arrayIndex; arrayIndex < editedFlattenedBasePairProps.length; arrayIndex++) {
              const arrayEntry = editedFlattenedBasePairProps[arrayIndex];
              if ((
                arrayEntry.rnaMoleculeName0 !== binarySearchResult.arrayEntry.rnaMoleculeName0 ||
                arrayEntry.nucleotideIndex0 !== binarySearchResult.arrayEntry.nucleotideIndex0
              )) {
                break;
              }
              editedFlattenedBasePairProps[arrayIndex] = {
                ...arrayEntry,
                updateTrigger : Math.random()
              };
            }
          }
        }
        return [...editedFlattenedBasePairProps];
      },
      [
        flattenedBasePairProps,
        basePairDataToEditPerRnaComplex,
        basePairKeysToRerenderPerRnaComplex
      ]
    );
    // Begin effects.
    useEffect(
      function() {
        let averageDistancesData = {} as Record<BasePair.Type, { count : number, distanceSum : number, distances : Array<number> }>;
        for (const basePairType of BasePair.types) {
          averageDistancesData[basePairType] = {
            count : 0,
            distanceSum : 0,
            distances : []
          };
        }
        let totalBasePairsCount = 0;
        let totalBasePairDistances = 0;
        for (let [rnaMoleculeName, basePairsPerRnaMolecule] of Object.entries(basePairs)) {
          for (let [nucleotideIndexAsString, basePairsPerNucleotide] of Object.entries(basePairsPerRnaMolecule)) {
            for (const basePairPerNucleotide of basePairsPerNucleotide) {
              let nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
              let nucleotideProps = rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
              let basePairNucleotideProps = rnaMoleculeProps[basePairPerNucleotide.rnaMoleculeName].nucleotideProps[basePairPerNucleotide.nucleotideIndex];
              let basePairDistance = distance(
                nucleotideProps,
                basePairNucleotideProps
              );
              totalBasePairDistances += basePairDistance;
              totalBasePairsCount++;

              let distancesData = averageDistancesData[basePairPerNucleotide.basePairType ?? getBasePairType(nucleotideProps.symbol, basePairNucleotideProps.symbol)];
              distancesData.count++;
              distancesData.distanceSum += basePairDistance;
              distancesData.distances.push(basePairDistance);
            }
          }
        }
        let helixStepDistanceSum = 0;
        let helixStepCount = 0;
        type Pair = { 0 : BasePairKeys, 1 : BasePairKeys, center : Vector2D };
        let previousPair : Pair = {
          0 : {
            nucleotideIndex : NaN,
            rnaMoleculeName : ""
          },
          1 : {
            nucleotideIndex : NaN,
            rnaMoleculeName : ""
          },
          center : {
            x : NaN,
            y : NaN
          }
        }
        for (const [rnaMoleculeName, basePairsPerRnaMolecule] of Object.entries(basePairs)) {
          const sortedBasePairsPerRnaMolecule = Object.entries(basePairsPerRnaMolecule).map(function([
            nucleotideIndexAsString,
            basePairsPerNucleotide
          ]) {
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            return {
              nucleotideIndex,
              basePairsPerNucleotide
            };
          });
          const singularRnaMoleculeProps0 = rnaMoleculeProps[rnaMoleculeName];
          for (const { nucleotideIndex, basePairsPerNucleotide } of sortedBasePairsPerRnaMolecule) {
            for (let i = 0; i < basePairsPerNucleotide.length; i++) {
              const basePairPerNucleotide = basePairsPerNucleotide[i];
              const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex];
              const singularNucleotideProps1 = rnaMoleculeProps[basePairPerNucleotide.rnaMoleculeName].nucleotideProps[basePairPerNucleotide.nucleotideIndex];
              const pair = {
                0 : {
                  nucleotideIndex,
                  rnaMoleculeName
                },
                1 : basePairPerNucleotide,
                center : scaleUp(
                  add(
                    singularNucleotideProps0,
                    singularNucleotideProps1
                  ),
                  0.5
                )
              };
              const helixFlag = (
                pair[0].rnaMoleculeName === previousPair[0].rnaMoleculeName &&
                pair[1].rnaMoleculeName === previousPair[1].rnaMoleculeName &&
                Math.abs(pair[0].nucleotideIndex - previousPair[0].nucleotideIndex) <= 1 &&
                Math.abs(pair[1].nucleotideIndex - previousPair[1].nucleotideIndex) <= 1
              );
              if (helixFlag) {
                helixStepDistanceSum += distance(
                  pair.center,
                  previousPair.center
                );
                helixStepCount++;
              }
              if (
                helixFlag ||
                i == basePairsPerNucleotide.length - 1
              ) {
                previousPair = pair;
              }
            }
          }
        }
        const basePairRadius = totalBasePairDistances / (totalBasePairsCount * 12);
        const distances = {} as Record<BasePair.Type, number>;
        for (const basePairType of BasePair.types) {
          const averageDistancesDataI = averageDistancesData[basePairType];
          // distances[basePairType] = averageDistancesDataI.distanceSum / averageDistancesDataI.count;
          distances[basePairType] = median(averageDistancesDataI.distances);
        }
        const canonicalDistance = distances[BasePair.Type.CANONICAL];
        if (!Number.isNaN(canonicalDistance)) {
          for (const basePairType of BasePair.types) {
            if (Number.isNaN(distances[basePairType])) {
              let newDistance = canonicalDistance;
              if (basePairType in distanceScalars) {
                newDistance *= distanceScalars[basePairType] as number;
              }
              distances[basePairType] = newDistance;
            }
          }
        }
        updateBasePairAverageDistances(
          index,
          {
            radius : basePairRadius,
            distances,
            helixDistance : helixStepDistanceSum / helixStepCount
          }
        );
      },
      [
        index,
        basePairs
      ]
    );
    const radii = index in basePairAverageRadii ? basePairAverageRadii[index].radius : Context.BasePair.DEFAULT_RADIUS;
    return <g
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.RNA_COMPLEX,
        [SVG_PROPERTY_XRNA_COMPLEX_NAME] : name
      }}
    >
      <Context.RnaComplex.Name.Provider
        value = {name}
      >
        <>
          <g>
            <Context.BasePair.AverageStrokeWidth.Provider
              value = {averageBasePairStrokeWidth}
            >
              {editedFlattenedBasePairProps.map(function(props : SingularFlattenedBasePairProps) {
                return <BasePair.MemoizedComponent
                  {...props}
                />;
                // return createElement(
                //   BasePair.MemoizedComponent,
                //   props
                // );
              })}
            </Context.BasePair.AverageStrokeWidth.Provider>
          </g>
          {flattenedRnaMoleculeProps.map(function(
            [
              rnaMoleculeName,
              singularRnaMoleculeProps
            ]
          ) {
            return <Context.RnaMolecule.Name.Provider
              key = {rnaMoleculeName}
              value = {rnaMoleculeName}
            >
              <RnaMolecule.Component
                key = {rnaMoleculeName}
                {...singularRnaMoleculeProps}
                nucleotideKeysToRerender = {nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] ?? []}
              />
            </Context.RnaMolecule.Name.Provider>
          })}
        </>
      </Context.RnaComplex.Name.Provider>
    </g>;
  }
}