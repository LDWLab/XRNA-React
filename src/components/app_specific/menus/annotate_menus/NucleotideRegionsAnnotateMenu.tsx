import { useEffect, useMemo, useState } from "react";
import { NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../../../../App";
import InputWithValidator from "../../../generic/InputWithValidator";
import { NucleotideKeysToRerender } from "../../../../context/Context";
import { asAngle, crossProduct, magnitude, normalize, orthogonalizeLeft, orthogonalizeRight, scaleUp, subtract, toNormalCartesian } from "../../../../data_structures/Vector2D";
import { Nucleotide } from "../../Nucleotide";
import { sign, subtractNumbers } from "../../../../utils/Utils";
import { Collapsible } from "../../../generic/Collapsible";

export namespace NucleotideRegionsAnnotateMenu {
  export type Region = {
    minimumNucleotideIndexInclusive : number,
    maximumNucleotideIndexInclusive : number
  };

  export type RegionsPerRnaMolecule = Array<Region>;

  export type RegionsPerRnaComplex = Record<
    RnaMoleculeKey,
    RegionsPerRnaMolecule
  >;

  export type Regions = Record<
    RnaComplexKey, 
    RegionsPerRnaComplex
  >;

  export type StartingNucleotideIndicesPerRegionPerRnaMolecule = Array<number>;

  export type StartingNucleotideIndicesPerRegionPerRnaComplex = Record<
    RnaMoleculeKey,
    StartingNucleotideIndicesPerRegionPerRnaMolecule
  >;

  export type StartingNucleotideIndicesPerRegion = Record<
    RnaComplexKey,
    StartingNucleotideIndicesPerRegionPerRnaComplex
  >;

  export type Props = {
    regions : Regions,
    rnaComplexProps : RnaComplexProps,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void
  };

  enum AnnotationAction {
    CREATE = "create",
    DELETE = "delete"
  }

  export function Component(props : Props) {
    const {
      regions,
      rnaComplexProps,
      setNucleotideKeysToRerender
    } = props;
    // Begin state data.
    const [
      affectLabelLineFlag,
      setAffectLabelLineFlag
    ] = useState(true);
    const [
      affectLabelContentFlag,
      setAffectLabelContentFlag
    ] = useState(true);
    const [
      recreateExistingAnnotationsFlag,
      setRecreateExistingAnnotationsFlag
    ] = useState(false);
    const [
      nucleotideIndexIncrement,
      setNucleotideIndexIncrement
    ] = useState(10);
    const [
      startingNucleotideIndicesPerRegion,
      setStartingNucleotideIndicesPerRegion
    ] = useState<StartingNucleotideIndicesPerRegion>({});
    const [
      startingNucleotideOverridingIndicesForLabelsPerRegion,
      setStartingNucleotideOverridingIndicesForLabelsPerRegion
    ] = useState<StartingNucleotideIndicesPerRegion>({});
    // Begin helper functions.
    function getNucleotidesUnitVector(
      nucleotideProps : Record<NucleotideKey, Nucleotide.ExternalProps>,
      nucleotideIndex : number
    ) {
      const singularNucleotideProps = nucleotideProps[nucleotideIndex];
      const previousNucleotideIndex = nucleotideIndex - 1;
      const previousNucleotideExistsFlag = previousNucleotideIndex in nucleotideProps;
      const nextNucleotideIndex = nucleotideIndex + 1;
      const nextNucleotideExistsFlag = nextNucleotideIndex in nucleotideProps;
      if (previousNucleotideExistsFlag && nextNucleotideExistsFlag) {
        const angle0 = asAngle(subtract(
          singularNucleotideProps,
          nucleotideProps[previousNucleotideIndex]
        ));
        const angle1 = asAngle(subtract(
          nucleotideProps[nextNucleotideIndex],
          singularNucleotideProps
        ));
        const averageAngle = (angle0 + angle1) * 0.5;
        return toNormalCartesian(averageAngle);
      } else if (previousNucleotideExistsFlag) {
        return normalize(subtract(
          singularNucleotideProps,
          nucleotideProps[previousNucleotideIndex]
        ));
      } else if (nextNucleotideExistsFlag) {
        return normalize(subtract(
          nucleotideProps[nextNucleotideIndex],
          singularNucleotideProps
        ));
      } else {
        return {
          x : 1,
          y : 0
        };
      }
    }
    function performAnnotationAction(annotationAction : AnnotationAction) {
      const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
      for (const rnaComplexIndexAsString in regions) {
        const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
        if (!(rnaComplexIndex in nucleotideKeysToRerender)) {
          nucleotideKeysToRerender[rnaComplexIndex] = {};
        }
        const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];

        const averageDistancesPerRnaComplex = annotationData.averageDistances[rnaComplexIndex];

        const rightOrthogonalizationFlagRecordPerRnaComplex = annotationData.rightOrthogonalizationFlagRecord[rnaComplexIndex];

        const startingNucleotideIndicesPerRegionPerRnaComplex = startingNucleotideIndicesPerRegion[rnaComplexIndex];

        const startingNucleotideIndicesOverridingIndexForLabelsPerRnaComplex = startingNucleotideOverridingIndicesForLabelsPerRegion[rnaComplexIndex];

        const regionsPerRnaComplex = regions[rnaComplexIndex];
        const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
        const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
        for (const rnaMoleculeName in regionsPerRnaComplex) {
          if (!(rnaMoleculeName in nucleotideKeysToRerenderPerRnaComplex)) {
            nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
          }
          const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];

          const averageDistancesPerRnaMolecule = averageDistancesPerRnaComplex[rnaMoleculeName];

          const rightOrthogonalizationFlagRecordPerRnaMolecule = rightOrthogonalizationFlagRecordPerRnaComplex[rnaMoleculeName];

          const startingNucleotideIndicesPerRegionPerRnaMolecule = startingNucleotideIndicesPerRegionPerRnaComplex[rnaMoleculeName];

          const startingNucleotideIndicesOverridingIndexForLabelsPerRnaMolecule = startingNucleotideIndicesOverridingIndexForLabelsPerRnaComplex[rnaMoleculeName];

          const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
          const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
          const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
          for (let i = 0; i < regionsPerRnaMolecule.length; i++) {
            const {
              minimumNucleotideIndexInclusive,
              maximumNucleotideIndexInclusive
            } = regionsPerRnaMolecule[i];
            const startingNucleotideIndexPerRegion = startingNucleotideIndicesPerRegionPerRnaMolecule[i];
            
            const startingNucleotideOverridingIndexForLabelsPerRegion = startingNucleotideIndicesOverridingIndexForLabelsPerRnaMolecule[i];

            const nucleotideIndexDelta = startingNucleotideOverridingIndexForLabelsPerRegion - startingNucleotideIndexPerRegion;
            
            for (let nucleotideIndex = startingNucleotideIndexPerRegion; nucleotideIndex <= maximumNucleotideIndexInclusive; nucleotideIndex += nucleotideIndexIncrement) {
              if (!(nucleotideIndex in nucleotideProps)) {
                continue;
              }
              const singularNucleotideProps = nucleotideProps[nucleotideIndex];
              if (affectLabelContentFlag || affectLabelLineFlag) {
                nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
                switch (annotationAction) {
                  case AnnotationAction.CREATE : {
                    const nucleotidesUnitVector = getNucleotidesUnitVector(
                      nucleotideProps,
                      nucleotideIndex
                    );
                    const orthogonalUnitVector = (rightOrthogonalizationFlagRecordPerRnaMolecule ? orthogonalizeRight : orthogonalizeLeft)(nucleotidesUnitVector);
                    if (
                      affectLabelLineFlag && (
                        singularNucleotideProps.labelLineProps === undefined || 
                        recreateExistingAnnotationsFlag
                      )
                    ) {
                      singularNucleotideProps.labelLineProps = {
                        points : [
                          scaleUp(
                            orthogonalUnitVector,
                            averageDistancesPerRnaMolecule.labelPoint0Distance
                          ),
                          scaleUp(
                            orthogonalUnitVector,
                            averageDistancesPerRnaMolecule.labelPoint1Distance
                          )
                        ]
                      };
                    }
                    if (
                      affectLabelContentFlag && (
                        singularNucleotideProps.labelContentProps === undefined ||
                        recreateExistingAnnotationsFlag
                      )
                    ) {
                      const orthogonalAsAngle = asAngle(orthogonalUnitVector);
                      // Adjust horizontal scales up, vertical scales down.
                      const scalePercentAdjustment = Math.cos(2 * orthogonalAsAngle) * 0.125;
                      singularNucleotideProps.labelContentProps = {
                        ...scaleUp(
                          orthogonalUnitVector,
                          averageDistancesPerRnaMolecule.labelContentDistance * (1 + scalePercentAdjustment)
                        ),
                        content : `${nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex + nucleotideIndexDelta}`
                      }
                    }
                    break;
                  }
                  case AnnotationAction.DELETE : {
                    if (affectLabelLineFlag) {
                      delete singularNucleotideProps.labelLineProps;
                    }
                    if (affectLabelContentFlag) {
                      delete singularNucleotideProps.labelContentProps;
                    }
                    break;
                  }
                  default : {
                    throw "Unhandled switch case.";
                  }
                }
              }
            }
          }
        }
      }
      for (const nucleotideKeysToRerenderPerRnaComplex of Object.values(nucleotideKeysToRerender)) {
        for (const nucleotideKeysToRerenderPerRnaMolecule of Object.values(nucleotideKeysToRerenderPerRnaComplex)) {
          nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
        }
      }
      setNucleotideKeysToRerender(nucleotideKeysToRerender);
    }
    // Begin memo data.
    const annotationData = useMemo(
      function() {
        const averageDistances : Record<
          RnaComplexKey,
          Record<
            RnaMoleculeKey,
            {
              labelPoint0Distance : number,
              labelPoint1Distance : number,
              labelContentDistance : number
            }
          >
        > = {};
        const rightOrthogonalizationFlagRecord : Record<
          RnaComplexKey,
          Record<
            RnaMoleculeKey,
            boolean
          >
        > = {};
        for (const rnaComplexIndexAsString in rnaComplexProps) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          averageDistances[rnaComplexIndex] = {};
          const averageDistancesPerRnaComplex = averageDistances[rnaComplexIndex];

          rightOrthogonalizationFlagRecord[rnaComplexIndex] = {};
          const rightOrthogonalizationFlagRecordPerRnaComplex = rightOrthogonalizationFlagRecord[rnaComplexIndex];

          const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
          const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
          for (const rnaMoleculeName in rnaMoleculeProps) {
            averageDistancesPerRnaComplex[rnaMoleculeName] = {
              labelPoint0Distance : 2.5,
              labelPoint1Distance : 7.5,
              labelContentDistance : 10
            };
            const averageDistancesPerRnaMolecule = averageDistancesPerRnaComplex[rnaMoleculeName];

            let rightOrthogonalizationFlagVote = 0;

            const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
            const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
            let numberOfLabelLinesPerRnaMolecule = 0;
            let numberOfLabelContentsPerRnaMolecule = 0;
            let sumOfDistances = {
              labelPoint0 : 0,
              labelPoint1 : 0,
              labelContent : 0
            };
            for (const nucleotideIndexAsString in nucleotideProps) {
              const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
              const singularNucleotideProps = nucleotideProps[nucleotideIndex];

              const nucleotidesUnitVector = getNucleotidesUnitVector(
                nucleotideProps,
                nucleotideIndex
              );
              if (singularNucleotideProps.labelLineProps !== undefined) {
                numberOfLabelLinesPerRnaMolecule++;
                const {
                  points
                } = singularNucleotideProps.labelLineProps;
                if (points.length > 0) {
                  const distances = points.map(magnitude);
                  const minimumDistance = Math.min(...distances);
                  const point0 = points[0];
                  sumOfDistances.labelPoint0 += minimumDistance;
                  rightOrthogonalizationFlagVote -= sign(crossProduct(
                    nucleotidesUnitVector,
                    point0
                  ));
                  if (points.length > 1) {
                    const maximumDistance = Math.max(...distances);
                    const point1 = points[1];
                    sumOfDistances.labelPoint1 += maximumDistance;
                    rightOrthogonalizationFlagVote -= sign(crossProduct(
                      nucleotidesUnitVector,
                      point1
                    ));
                  }
                }
              }
              if (singularNucleotideProps.labelContentProps !== undefined) {
                numberOfLabelContentsPerRnaMolecule++;
                sumOfDistances.labelContent += magnitude(singularNucleotideProps.labelContentProps);
                rightOrthogonalizationFlagVote -= sign(crossProduct(
                  nucleotidesUnitVector,
                  singularNucleotideProps.labelContentProps
                ));
              }
            }
            if (numberOfLabelContentsPerRnaMolecule !== 0) {
              averageDistancesPerRnaMolecule.labelContentDistance = sumOfDistances.labelContent / numberOfLabelContentsPerRnaMolecule;
            }
            if (numberOfLabelLinesPerRnaMolecule) {
              const reciprocal = 1 / numberOfLabelLinesPerRnaMolecule;
              averageDistancesPerRnaMolecule.labelPoint0Distance = sumOfDistances.labelPoint0 * reciprocal;
              averageDistancesPerRnaMolecule.labelPoint1Distance = sumOfDistances.labelPoint1 * reciprocal;
            }

            rightOrthogonalizationFlagRecordPerRnaComplex[rnaMoleculeName] = rightOrthogonalizationFlagVote > 0;
          }
        }
        return {
          averageDistances,
          rightOrthogonalizationFlagRecord
        };
      },
      []
    );
    // Begin effects.
    useEffect(
      function() {
        const startingNucleotideIndicesPerRegion : StartingNucleotideIndicesPerRegion = {};
        const startingNucleotideOverridingIndicesForLabelsPerRegion : StartingNucleotideIndicesPerRegion = {};
        for (const rnaComplexIndexAsString in regions) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          const regionsPerRnaComplex = regions[rnaComplexIndex];
          
          startingNucleotideIndicesPerRegion[rnaComplexIndex] = {};
          const startingNucleotideIndicesPerRegionPerRnaComplex = startingNucleotideIndicesPerRegion[rnaComplexIndex];
          startingNucleotideOverridingIndicesForLabelsPerRegion[rnaComplexIndex] = {};
          const startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex = startingNucleotideOverridingIndicesForLabelsPerRegion[rnaComplexIndex];
          for (const rnaMoleculeName in regionsPerRnaComplex) {
            const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
            startingNucleotideIndicesPerRegionPerRnaComplex[rnaMoleculeName] = [];
            const startingNucleotideIndicesPerRegionPerRnaMolecule = startingNucleotideIndicesPerRegionPerRnaComplex[rnaMoleculeName];
            startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex[rnaMoleculeName] = [];
            const startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule = startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex[rnaMoleculeName];
            for (let i = 0; i < regionsPerRnaMolecule.length; i++) {
              const region = regionsPerRnaMolecule[i];
              startingNucleotideIndicesPerRegionPerRnaMolecule.push(region.minimumNucleotideIndexInclusive);
              startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule.push(region.minimumNucleotideIndexInclusive);
            }
          }
        }

        setStartingNucleotideIndicesPerRegion(startingNucleotideIndicesPerRegion);
        setStartingNucleotideOverridingIndicesForLabelsPerRegion(startingNucleotideOverridingIndicesForLabelsPerRegion);
      },
      [regions]
    );
    return <>
      <b>
        Nucleotide-Region(s) Annotation Editor:
      </b>
      <br/>
      <label>
        Affect label line(s):&nbsp;
        <input
          type = "checkbox"
          checked = {affectLabelLineFlag}
          onChange = {function(e) {
            setAffectLabelLineFlag(!affectLabelLineFlag);
          }}
        />
      </label>
      <br/>
      <label>
        Affect label content(s):&nbsp;
        <input
          type = "checkbox"
          checked = {affectLabelContentFlag}
          onChange = {function(e) {
            setAffectLabelContentFlag(!affectLabelContentFlag);
          }}
        />
      </label>
      <br/>
      <label>
        Re-create existing annotations:&nbsp;
        <input
          type = "checkbox"
          checked = {recreateExistingAnnotationsFlag}
          onChange = {function(e) {
            setRecreateExistingAnnotationsFlag(!recreateExistingAnnotationsFlag);
          }}
        />
      </label>
      <br/>
      <label>
        Nucleotide-index increment:&nbsp;
        <InputWithValidator.Integer
          value = {nucleotideIndexIncrement}
          setValue = {setNucleotideIndexIncrement}
          min = {1}
        />
      </label>
      <br/>
      <Collapsible.Component
        title = "Starting nucleotide indices"
      >
        <StartingNucleotideIndicesEditor.Component
          regions = {regions}
          rnaComplexProps = {rnaComplexProps}
          startingNucleotideIndicesPerRegion = {startingNucleotideIndicesPerRegion}
          updateStartingNucleotideIndexHelper = {function(
            rnaComplexIndex : RnaComplexKey,
            rnaMoleculeName : RnaMoleculeKey,
            regionIndex : number,
            newStartingNucleotideIndex : NucleotideKey
          ) {
            startingNucleotideIndicesPerRegion[rnaComplexIndex][rnaMoleculeName][regionIndex] = newStartingNucleotideIndex;
            setStartingNucleotideIndicesPerRegion(structuredClone(startingNucleotideIndicesPerRegion));
          }}
          startingNucleotideOverridingIndicesForLabelsPerRegion = {startingNucleotideOverridingIndicesForLabelsPerRegion}
          updateStartingNucleotideOverridingIndexForLabelPerRegionHelper = {function(
            rnaComplexIndex : RnaComplexKey,
            rnaMoleculeName : RnaMoleculeKey,
            regionIndex : number,
            newStartingNucleotideOverridingIndexForLabel : NucleotideKey
          ) {
            startingNucleotideOverridingIndicesForLabelsPerRegion[rnaComplexIndex][rnaMoleculeName][regionIndex] = newStartingNucleotideOverridingIndexForLabel;
            setStartingNucleotideOverridingIndicesForLabelsPerRegion(structuredClone(startingNucleotideOverridingIndicesForLabelsPerRegion));
          }}
        />
      </Collapsible.Component>
      <button
        onClick = {function(e) {
          performAnnotationAction(AnnotationAction.CREATE);
        }}
      >
        Create annotations
      </button>
      <br/>
      <button
        onClick = {function(e) {
          performAnnotationAction(AnnotationAction.DELETE);
        }}
      >
        Delete annotations
      </button>
    </>;
  }

}

namespace StartingNucleotideIndicesEditor {
  export type Props = {
    regions : NucleotideRegionsAnnotateMenu.Regions,
    rnaComplexProps : RnaComplexProps,
    startingNucleotideIndicesPerRegion : NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegion,
    updateStartingNucleotideIndexHelper : (
      rnaComplexIndex : number,
      rnaMoleculeName : string,
      regionIndex : number,
      firstNucleotideIndex : number
    ) => void,
    startingNucleotideOverridingIndicesForLabelsPerRegion : NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegion,
    updateStartingNucleotideOverridingIndexForLabelPerRegionHelper : (
      rnaComplexIndex : number,
      rnaMoleculeName : string,
      regionIndex : number,
      overridingOverridingIndexForLabels : number
    ) => void
  };

  export function Component(props : Props) {
    const {
      regions,
      rnaComplexProps,
      startingNucleotideIndicesPerRegion,
      updateStartingNucleotideIndexHelper,
      startingNucleotideOverridingIndicesForLabelsPerRegion,
      updateStartingNucleotideOverridingIndexForLabelPerRegionHelper
    } = props;
    // Begin state data.
    const [
      selectedRnaComplexIndex,
      setSelectedRnaComplexIndex
    ] = useState<number | undefined>(undefined);
    const [
      selectedRnaMoleculeName,
      setSelectedRnaMoleculeName
    ] = useState<string | undefined>(undefined);
    const [
      selectedRegionIndex,
      setSelectedRegionIndex
    ] = useState<number | undefined>(undefined);
    const [
      regionsPerSelectedRnaComplex,
      setRegionsPerSelectedRnaComplex
    ] = useState<NucleotideRegionsAnnotateMenu.RegionsPerRnaComplex | undefined>(undefined);
    const [
      regionsPerSelectedRnaMolecule,
      setRegionsPerSelectedRnaMolecule
    ] = useState<NucleotideRegionsAnnotateMenu.RegionsPerRnaMolecule | undefined>(undefined);
    const [
      selectedRegion,
      setSelectedRegion
    ] = useState<NucleotideRegionsAnnotateMenu.Region | undefined>(undefined);
    const [
      startingNucleotideIndicesPerRegionPerRnaComplex,
      setStartingNucleotideIndicesPerRegionPerRnaComplex
    ] = useState<NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaComplex | undefined>(undefined);
    const [
      startingNucleotideIndicesPerRegionPerRnaMolecule,
      setStartingNucleotideIndicesPerRegionPerRnaMolecule
    ] = useState<NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaMolecule | undefined>(undefined);
    const [
      startingNucleotideIndexPerRegion,
      setStartingNucleotideIndexPerRegion
    ] = useState<number | undefined>(undefined);
    const [
      startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex,
      setStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex
    ] = useState<NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaComplex | undefined>(undefined);
    const [
      startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule,
      setStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule
    ] = useState<NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaMolecule | undefined>(undefined);
    const [
      startingNucleotideOverridingIndexForLabel,
      setStartingNucleotideOverridingIndexForLabel
    ] = useState<number | undefined>(undefined);
    // Begin memo data.
    const firstNucleotideIndexPerRnaMolecule = useMemo(
      function() {
        if (
          selectedRnaComplexIndex === undefined ||
          selectedRnaMoleculeName === undefined ||
          selectedRegionIndex === undefined || 
          startingNucleotideIndexPerRegion === undefined
        ) {
          return undefined;
        }
        const singularRnaComplexProps = rnaComplexProps[selectedRnaComplexIndex];
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[selectedRnaMoleculeName];
        return singularRnaMoleculeProps.firstNucleotideIndex;
      },
      [startingNucleotideIndexPerRegion]
    );
    return <>
      <label>
        RNA complex:&nbsp;
        <select
          value = {selectedRnaComplexIndex}
          onChange = {function(e) {
            const selectedRnaComplexIndexAsString = e.target.value;
            const newSelectedRnaComplexIndex = Number.parseInt(selectedRnaComplexIndexAsString);
            // const newSelectedRnaComplexIndex = Object.values(rnaComplexProps).findIndex(function(singularRnaComplexProps) {
            //   return singularRnaComplexProps.name === selectedRnaComplexName;
            // });
            setSelectedRnaComplexIndex(newSelectedRnaComplexIndex);
            setRegionsPerSelectedRnaComplex(regions[newSelectedRnaComplexIndex]);
            setStartingNucleotideIndicesPerRegionPerRnaComplex(startingNucleotideIndicesPerRegion[newSelectedRnaComplexIndex]);
            setStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex(startingNucleotideOverridingIndicesForLabelsPerRegion[newSelectedRnaComplexIndex]);
          }}
        >
          <option
            style = {{
              display : "none"
            }}
            value = {undefined}
          >
            Select an RNA-complex name
          </option>
          {Object.keys(regions).map(function(rnaComplexIndexAsString) {
            const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
            const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
            const rnaComplexName = singularRnaComplexProps.name;
            return <option
              key = {rnaComplexIndex}
              value = {rnaComplexIndex}
            >
              {rnaComplexName}
            </option>
          })}
        </select>
      </label>
      {selectedRnaComplexIndex !== undefined && regionsPerSelectedRnaComplex !== undefined && startingNucleotideIndicesPerRegionPerRnaComplex !== undefined && startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex !== undefined && <>
        <br/>
        <label>
          RNA molecule:&nbsp;
          <select
            value = {selectedRnaMoleculeName}
            onChange = {function(e) {
              const newRnaMoleculeName = e.target.value;
              setSelectedRnaMoleculeName(newRnaMoleculeName);
              setRegionsPerSelectedRnaMolecule(regionsPerSelectedRnaComplex[newRnaMoleculeName]);
              setStartingNucleotideIndicesPerRegionPerRnaMolecule(startingNucleotideIndicesPerRegionPerRnaComplex[newRnaMoleculeName]);
              setStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule(startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex[newRnaMoleculeName]);
            }}
          >
            <option
              style = {{
                display : "none"
              }}
            >
              Select an RNA-molecule name
            </option>
            {Object.keys(regions[selectedRnaComplexIndex]).map(function(rnaMoleculeName) {
              return <option
                key = {rnaMoleculeName}
                value = {rnaMoleculeName}
              >
                {rnaMoleculeName}
              </option>;
            })}
          </select>
        </label>
      </>}
      {selectedRnaMoleculeName !== undefined && regionsPerSelectedRnaMolecule !== undefined && startingNucleotideIndicesPerRegionPerRnaMolecule !== undefined && startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule !== undefined && <>
        <br/>
        <label>
          Region index in [1-{regionsPerSelectedRnaMolecule.length}]:&nbsp;
          <select
            value = {selectedRegionIndex}
            onChange = {function(e) {
              const newSelectedRegionIndex = Number.parseInt(e.target.value);
              setSelectedRegionIndex(newSelectedRegionIndex);
              setSelectedRegion(regionsPerSelectedRnaMolecule[newSelectedRegionIndex]);
              setStartingNucleotideIndexPerRegion(startingNucleotideIndicesPerRegionPerRnaMolecule[newSelectedRegionIndex]);
              setStartingNucleotideOverridingIndexForLabel(startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule[newSelectedRegionIndex]);
            }}
          >
            <option
              style = {{
                display : "none"
              }}
            >
              Select a region index
            </option>
            {regionsPerSelectedRnaMolecule.map(function(_, i) {
              return <option
                key = {i}
                value = {i}
              >
                {i + 1}
              </option>;
            })}
          </select>
        </label>
      </>}
      {selectedRegionIndex !== undefined && selectedRegion !== undefined && startingNucleotideIndexPerRegion !== undefined && startingNucleotideOverridingIndexForLabel !== undefined && <>
        <br/>
        <label>
          Starting index:&nbsp;
          <InputWithValidator.Integer
            value = {startingNucleotideIndexPerRegion + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
            setValue = {function(newFirstNucleotideIndex) {
              updateStartingNucleotideIndexHelper(
                selectedRnaComplexIndex as number,
                selectedRnaMoleculeName as string,
                selectedRegionIndex,
                newFirstNucleotideIndex - (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)
              );
          }}
            min = {selectedRegion.minimumNucleotideIndexInclusive + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
            max = {selectedRegion.maximumNucleotideIndexInclusive + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
          />
        </label>
        <br/>
        <label>
          Overriding label index:&nbsp;
          <InputWithValidator.Integer
            value = {startingNucleotideOverridingIndexForLabel + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
            setValue = {function(newNucleotideOverridingIndexForLabel) {
              const singularRnaComplexProps = rnaComplexProps[selectedRnaComplexIndex as number];
              const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[selectedRnaMoleculeName as string];
              updateStartingNucleotideOverridingIndexForLabelPerRegionHelper(
                selectedRnaComplexIndex as number,
                selectedRnaMoleculeName as string,
                selectedRegionIndex,
                newNucleotideOverridingIndexForLabel - singularRnaMoleculeProps.firstNucleotideIndex
              );
            }}
          />
        </label>
      </>}
    </>;
  }
}