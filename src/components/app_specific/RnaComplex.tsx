import { useContext, useEffect, useMemo, useState } from "react";
import { RnaMoleculeKey, NucleotideKey } from "../../App";
import { BasePairKeysToRerenderPerRnaComplex, Context, NucleotideKeysToRerenderPerRnaComplex } from "../../context/Context";
import { Vector2D, add, distance, scaleUp } from "../../data_structures/Vector2D";
import Scaffolding from "../generic/Scaffolding";
import BasePair, { getBasePairType } from "./BasePair";
import { RnaMolecule } from "./RnaMolecule";
import { HandleQueryNotFound, sortedArraySplice } from "../../utils/Utils";
import { SVG_PROPERTY_XRNA_COMPLEX_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";

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
  duplicateBasePairKeysHandler = DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING,
  optionalBasePairParameters : Pick<RnaComplex.MappedBasePair, "basePairType" | "color" | "strokeWidth"> = {}
) {
  const { basePairs } = singularRnaComplexProps;
  const duplicateBasePairKeys = new Array<RnaComplex.BasePairKeys>();
  const basePairsToCreate = [];
  for (let basePairInfo of [
    {
      rnaMoleculeName : rnaMoleculeName0,
      nucleotideIndex : nucleotideIndex0,
      basePairedRnaMoleculeName : rnaMoleculeName1,
      basePairedNucleotideIndex : nucleotideIndex1
    },
    {
      rnaMoleculeName : rnaMoleculeName1,
      nucleotideIndex : nucleotideIndex1,
      basePairedRnaMoleculeName : rnaMoleculeName0,
      basePairedNucleotideIndex : nucleotideIndex0
    }
  ]) {
    const {
      rnaMoleculeName,
      nucleotideIndex,
      basePairedRnaMoleculeName,
      basePairedNucleotideIndex
    } = basePairInfo;
    let basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
    if (basePairsPerRnaMolecule === undefined) {
      basePairsPerRnaMolecule = {};
      basePairs[rnaMoleculeName] = basePairsPerRnaMolecule;
    } else if (nucleotideIndex in basePairsPerRnaMolecule) {
      const mappedInformation = basePairsPerRnaMolecule[nucleotideIndex];
      duplicateBasePairKeys.push(
        {
          rnaMoleculeName,
          nucleotideIndex
        },
        {
          rnaMoleculeName : mappedInformation.rnaMoleculeName,
          nucleotideIndex : mappedInformation.nucleotideIndex
        }
      );
      switch (duplicateBasePairKeysHandler) {
        case DuplicateBasePairKeysHandler.DO_NOTHING : {
          // Do nothing.
          break;
        }
        case DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING : {
          if (nucleotideIndex in basePairsPerRnaMolecule) {
            delete basePairs[mappedInformation.rnaMoleculeName][mappedInformation.nucleotideIndex];
          }
          break;
        }
        case DuplicateBasePairKeysHandler.THROW_ERROR : {
          if (nucleotideIndex in basePairsPerRnaMolecule) {
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
        ...optionalBasePairParameters
      }
    });
  }
  for (const basePairToCreate of basePairsToCreate) {
    const {
      basePairsPerRnaMolecule,
      nucleotideIndex,
      mappedBasePairInformation
    } = basePairToCreate;
    basePairsPerRnaMolecule[nucleotideIndex] = mappedBasePairInformation;
  }
  return duplicateBasePairKeys;
}

export function compareBasePairKeys(
  keys0 : RnaComplex.BasePairKeys,
  keys1 : RnaComplex.BasePairKeys
) {
  return keys0.rnaMoleculeName.localeCompare(keys1.rnaMoleculeName) || (keys0.nucleotideIndex - keys1.nucleotideIndex);
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

  export type MappedBasePair = BasePairKeys & BasePair.CoreProps;

  export type BasePairsPerRnaMolecule = Record<NucleotideKey, MappedBasePair>;

  export type BasePairs = Record<RnaMoleculeKey, BasePairsPerRnaMolecule>;

  export type ExternalProps = {
    name : string,
    rnaMoleculeProps : Record<string, RnaMolecule.ExternalProps>,
    basePairs : BasePairs
  };

  export type Props = ExternalProps & {
    nucleotideKeysToRerenderPerRnaComplex : NucleotideKeysToRerenderPerRnaComplex,
    basePairKeysToRerenderPerRnaComplex : BasePairKeysToRerenderPerRnaComplex
  };

  export function Component(props : Props) {
    type SingularFlattenedBasePairProps = {
      scaffoldingKey : {
        rnaMoleculeName : string,
        nucleotideIndex : number
      },
      props : BasePair.Props
    };
    const {
      name,
      rnaMoleculeProps,
      basePairs,
      nucleotideKeysToRerenderPerRnaComplex,
      basePairKeysToRerenderPerRnaComplex
    } = props;
    // Begin context data.
    const index = useContext(Context.RnaComplex.Index);
    const basePairDataToEditPerRnaComplex = useContext(Context.BasePair.DataToEditPerRnaComplex);
    const basePairAverageRadii = useContext(Context.BasePair.AverageDistances);
    const updateBasePairAverageDistances = useContext(Context.BasePair.UpdateAverageDistances);
    // Begin state data.
    // const [
    //   flattenedBasePairProps,
    //   setFlattenedBasePairProps
    // ] = useState<Scaffolding.SortedProps<ScaffoldingKey, BasePair.Props>>([]);
    const [
      editedFlattenedBasePairProps,
      setEditedFlattenedBasePairProps
    ] = useState<Array<SingularFlattenedBasePairProps>>([]);
    // Begin memo data.
    const flattenedRnaMoleculeProps = Object.entries(rnaMoleculeProps);
    // const flattenedRnaMoleculeProps = useMemo(
    //   function() {
    //     return Object.entries(rnaMoleculeProps);
    //   },
    //   [rnaMoleculeProps]
    // );
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
            mappedBasePair
          ]) {
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            const basePairKeys = {
              rnaMoleculeName,
              nucleotideIndex
            };
            if (isRelevantBasePairKeySetInPair(
              basePairKeys,
              mappedBasePair
            )) {
              const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
              const singularBasePairedRnaMoleculeProps = rnaMoleculeProps[mappedBasePair.rnaMoleculeName];
              const singularBasePairedNucleotideProps = singularBasePairedRnaMoleculeProps.nucleotideProps[mappedBasePair.nucleotideIndex];
              if (mappedBasePair.basePairType === undefined) {
                mappedBasePair.basePairType = getBasePairType(
                  singularNucleotideProps.symbol,
                  singularBasePairedNucleotideProps.symbol
                );
              }
              flattenedBasePairProps.push({
                scaffoldingKey : basePairKeys,
                props : {
                  mappedBasePair : mappedBasePair as BasePair.FinalizedMappedBasePair,
                  position0 : singularNucleotideProps,
                  position1 : singularBasePairedNucleotideProps,
                  rnaMoleculeName0 : rnaMoleculeName,
                  formattedNucleotideIndex0 : nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex,
                  rnaMoleculeName1 : mappedBasePair.rnaMoleculeName,
                  formattedNucleotideIndex1 : mappedBasePair.nucleotideIndex + singularBasePairedRnaMoleculeProps.firstNucleotideIndex
                }
              });
            }
          });
        });
        return flattenedBasePairProps;
      },
      [basePairs]
    );
    // Begin effect data.
    useEffect(
      function() {
        const editedFlattenedBasePairProps = flattenedBasePairProps;
        if (basePairDataToEditPerRnaComplex === undefined) {
          setEditedFlattenedBasePairProps(editedFlattenedBasePairProps);
          return;
        }
        for (const basePairDatumToDelete of basePairDataToEditPerRnaComplex.delete) {
          sortedArraySplice(
            editedFlattenedBasePairProps,
            function(editedFlattenedBasePairPropsI : SingularFlattenedBasePairProps) {
              return compareBasePairKeys(
                editedFlattenedBasePairPropsI.scaffoldingKey,
                basePairDatumToDelete
              );
            },
            1,
            [],
            HandleQueryNotFound.DO_NOTHING
          );
        }
        for (const basePairDatumToAdd of basePairDataToEditPerRnaComplex.add) {
          const {
            rnaMoleculeName,
            nucleotideIndex
          } = basePairDatumToAdd;
          const mappedBasePair = basePairs[rnaMoleculeName][nucleotideIndex];
          if (isRelevantBasePairKeySetInPair(
            basePairDatumToAdd,
            mappedBasePair
          )) {
            const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
            const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
            const singularBasePairedRnaMoleculeProps = rnaMoleculeProps[mappedBasePair.rnaMoleculeName];
            const singularBasePairedNucleotideProps = singularBasePairedRnaMoleculeProps.nucleotideProps[mappedBasePair.nucleotideIndex];
            if (mappedBasePair.basePairType === undefined) {
              mappedBasePair.basePairType = getBasePairType(
                singularNucleotideProps.symbol,
                singularBasePairedNucleotideProps.symbol
              );
            }
            const newSingularFlattenedBasePairProps : SingularFlattenedBasePairProps = {
              scaffoldingKey : basePairDatumToAdd,
              props : {
                mappedBasePair : mappedBasePair as BasePair.FinalizedMappedBasePair,
                position0 : singularNucleotideProps,
                position1 : singularBasePairedNucleotideProps,
                rnaMoleculeName0 : rnaMoleculeName,
                formattedNucleotideIndex0 : nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex,
                rnaMoleculeName1 : mappedBasePair.rnaMoleculeName,
                formattedNucleotideIndex1 : mappedBasePair.nucleotideIndex + singularBasePairedRnaMoleculeProps.firstNucleotideIndex
              }
            };
            sortedArraySplice(
              editedFlattenedBasePairProps,
              function(editedFlattenedBasePairPropsI : SingularFlattenedBasePairProps) {
                return compareBasePairKeys(
                  editedFlattenedBasePairPropsI.scaffoldingKey,
                  basePairDatumToAdd
                );
              },
              0,
              [newSingularFlattenedBasePairProps],
              HandleQueryNotFound.ADD
            );
          }
        }
        setEditedFlattenedBasePairProps([...editedFlattenedBasePairProps]);
      },
      [
        flattenedBasePairProps,
        basePairDataToEditPerRnaComplex
      ]
    );
    useEffect(
      function() {
        let averageDistancesData = {} as Record<BasePair.Type, { count : number, distanceSum : number }>;
        for (const basePairType of BasePair.types) {
          averageDistancesData[basePairType] = {
            count : 0,
            distanceSum : 0
          };
        }
        let totalBasePairsCount = 0;
        let totalBasePairDistances = 0;
        for (let [rnaMoleculeName, basePairsPerRnaMolecule] of Object.entries(basePairs)) {
          for (let [nucleotideIndexAsString, basePair] of Object.entries(basePairsPerRnaMolecule)) {
            let nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            let nucleotideProps = rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
            let basePairNucleotideProps = rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex];
            let basePairDistance = distance(
              nucleotideProps,
              basePairNucleotideProps
            );
            totalBasePairDistances += basePairDistance;
            totalBasePairsCount++;

            let distancesData = averageDistancesData[basePair.basePairType ?? getBasePairType(nucleotideProps.symbol, basePairNucleotideProps.symbol)];
            distancesData.count++;
            distancesData.distanceSum += basePairDistance;
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
            basePair
          ]) {
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            return {
              nucleotideIndex,
              basePair
            };
          });
          const singularRnaMoleculeProps0 = rnaMoleculeProps[rnaMoleculeName];
          for (const { nucleotideIndex, basePair } of sortedBasePairsPerRnaMolecule) {
            const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex];
            const singularNucleotideProps1 = rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex];
            const pair = {
              0 : {
                nucleotideIndex,
                rnaMoleculeName
              },
              1 : basePair,
              center : scaleUp(
                add(
                  singularNucleotideProps0,
                  singularNucleotideProps1
                ),
                0.5
              )
            };
            if ((
              pair[0].rnaMoleculeName === previousPair[0].rnaMoleculeName &&
              pair[1].rnaMoleculeName === previousPair[1].rnaMoleculeName &&
              Math.abs(pair[0].nucleotideIndex - previousPair[0].nucleotideIndex) <= 1 &&
              Math.abs(pair[1].nucleotideIndex - previousPair[1].nucleotideIndex) <= 1
            )) {
              helixStepDistanceSum += distance(
                pair.center,
                previousPair.center
              );
              helixStepCount++;
            }
            previousPair = pair;
          }
        }
        const basePairRadius = totalBasePairDistances / (totalBasePairsCount * 12);
        const distances = {} as Record<BasePair.Type, number>;
        for (const basePairType of BasePair.types) {
          const averageDistancesDataI = averageDistancesData[basePairType];
          distances[basePairType] = averageDistancesDataI.distanceSum / averageDistancesDataI.count;
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
            <Context.BasePair.Radius.Provider
              value = {radii}
            >
              <Scaffolding.Component<BasePairKeys, BasePair.Props>
                sortedProps = {editedFlattenedBasePairProps}
                childComponent = {BasePair.Component}
                propsToRerenderKeys = {basePairKeysToRerenderPerRnaComplex}
                comparator = {compareBasePairKeys}
              />
            </Context.BasePair.Radius.Provider>
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