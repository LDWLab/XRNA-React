import { useEffect, useMemo, useState } from "react";
import { NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../../../../App";
import InputWithValidator from "../../../generic/InputWithValidator";
import { NucleotideKeysToRerender } from "../../../../context/Context";
import { asAngle, crossProduct, magnitude, orthogonalizeLeft, orthogonalizeRight, scaleUp, subtract, toNormalCartesian } from "../../../../data_structures/Vector2D";
import { Nucleotide } from "../../Nucleotide";
import { sign } from "../../../../utils/Utils";
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
        return subtract(
          singularNucleotideProps,
          nucleotideProps[previousNucleotideIndex]
        );
      } else if (nextNucleotideExistsFlag) {
        return subtract(
          nucleotideProps[nextNucleotideIndex],
          singularNucleotideProps
        );
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

          const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
          const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
          const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
          for (const {
            minimumNucleotideIndexInclusive,
            maximumNucleotideIndexInclusive
          } of regionsPerRnaMolecule) {
            for (let nucleotideIndex = minimumNucleotideIndexInclusive; nucleotideIndex <= maximumNucleotideIndexInclusive; nucleotideIndex += nucleotideIndexIncrement) {
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
                        content : `${nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex}`
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
        for (const rnaComplexIndexAsString in regions) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          const regionsPerRnaComplex = regions[rnaComplexIndex];
          
          startingNucleotideIndicesPerRegion[rnaComplexIndex] = {};
          const startingNucleotideIndicesPerRegionPerRnaComplex = startingNucleotideIndicesPerRegion[rnaComplexIndex];
          for (const rnaMoleculeName in regionsPerRnaComplex) {
            const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
            startingNucleotideIndicesPerRegionPerRnaComplex[rnaMoleculeName] = [];
            const startingNucleotideIndicesPerRegionPerRnaMolecule = startingNucleotideIndicesPerRegionPerRnaComplex[rnaMoleculeName];
            for (let i = 0; i < regionsPerRnaMolecule.length; i++) {
              const region = regionsPerRnaMolecule[i];
              startingNucleotideIndicesPerRegionPerRnaMolecule.push(region.minimumNucleotideIndexInclusive);
            }
          }
        }
        setStartingNucleotideIndicesPerRegion(startingNucleotideIndicesPerRegion);
      },
      [
        regions
      ]
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
            const newStartingNucleotideIndicesPerRegion = {
              ...startingNucleotideIndicesPerRegion
            };
            newStartingNucleotideIndicesPerRegion[rnaComplexIndex][rnaMoleculeName][regionIndex] = newStartingNucleotideIndex;
            setStartingNucleotideIndicesPerRegion(newStartingNucleotideIndicesPerRegion);
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
    ) => void
  };

  export function Component(props : Props) {
    const {
      regions,
      rnaComplexProps,
      startingNucleotideIndicesPerRegion,
      updateStartingNucleotideIndexHelper
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
    ] = useState<NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaMolecule>();
    const [
      startingNucleotideIndex,
      setStartingNucleotideIndex
    ] = useState<number | undefined>(undefined);
    // Begin memo data.
    const firstNucleotideIndexPerRnaMolecule = useMemo(
      function() {
        if (
          selectedRnaComplexIndex === undefined ||
          selectedRnaMoleculeName === undefined ||
          selectedRegionIndex === undefined || 
          startingNucleotideIndex === undefined
        ) {
          return undefined;
        }
        const singularRnaComplexProps = rnaComplexProps[selectedRnaComplexIndex];
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[selectedRnaMoleculeName];
        return singularRnaMoleculeProps.firstNucleotideIndex;
      },
      [
        startingNucleotideIndex
      ]
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
            // console.log("newSelectedRnaComplexIndex", newSelectedRnaComplexIndex);
            setSelectedRnaComplexIndex(newSelectedRnaComplexIndex);
            setRegionsPerSelectedRnaComplex(regions[newSelectedRnaComplexIndex]);
            setStartingNucleotideIndicesPerRegionPerRnaComplex(startingNucleotideIndicesPerRegion[newSelectedRnaComplexIndex]);
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
      {selectedRnaComplexIndex !== undefined && regionsPerSelectedRnaComplex !== undefined && startingNucleotideIndicesPerRegionPerRnaComplex !== undefined && <>
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
      {selectedRnaMoleculeName !== undefined && regionsPerSelectedRnaMolecule !== undefined && startingNucleotideIndicesPerRegionPerRnaMolecule !== undefined && <>
        <br/>
        <label>
          Region index in [1-{regionsPerSelectedRnaMolecule.length}]:&nbsp;
          <select
            value = {selectedRegionIndex}
            onChange = {function(e) {
              const newSelectedRegionIndex = Number.parseInt(e.target.value) - 1;
              setSelectedRegionIndex(newSelectedRegionIndex);
              setSelectedRegion(regionsPerSelectedRnaMolecule[newSelectedRegionIndex]);
              setStartingNucleotideIndex(startingNucleotideIndicesPerRegionPerRnaMolecule[newSelectedRegionIndex]);
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
              const incrementedI = i + 1;
              return <option
                key = {i}
                value = {incrementedI}
              >
                {incrementedI}
              </option>;
            })}
          </select>
        </label>
      </>}
      {selectedRegionIndex !== undefined && selectedRegion !== undefined && startingNucleotideIndex !== undefined && <>
        <br/>
        <InputWithValidator.Integer
          value = {(startingNucleotideIndex ?? Number.NaN) + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
          setValue = {function(newFirstNucleotideIndex) {
            updateStartingNucleotideIndexHelper(
              selectedRnaComplexIndex as number,
              selectedRnaMoleculeName as string,
              selectedRegionIndex,
              newFirstNucleotideIndex
            );
        }}
          min = {selectedRegion.minimumNucleotideIndexInclusive}
          max = {selectedRegion.maximumNucleotideIndexInclusive}
        />
      </>}
    </>;
  }
}