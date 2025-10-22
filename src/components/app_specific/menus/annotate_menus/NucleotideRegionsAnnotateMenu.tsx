import { useContext, useEffect, useMemo, useState } from "react";
import { NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../../../../App";
import InputWithValidator from "../../../generic/InputWithValidator";
import { Context, NucleotideKeysToRerender } from "../../../../context/Context";
import { asAngle, crossProduct, magnitude, normalize, orthogonalizeLeft, orthogonalizeRight, scaleUp, subtract, toNormalCartesian } from "../../../../data_structures/Vector2D";
import { Nucleotide } from "../../Nucleotide";
import { sign, subtractNumbers } from "../../../../utils/Utils";
import { Collapsible } from "../../../generic/Collapsible";
import BasePair from "../../BasePair";
import { DEFAULT_STROKE_WIDTH } from "../../../../utils/Constants";
import { BLACK } from "../../../../data_structures/Color";
import Font from "../../../../data_structures/Font";
import { useTheme } from "../../../../context/ThemeContext";

export namespace NucleotideRegionsAnnotateMenu {
  export function populateRegions(
    indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule : Set<number>,
    nucleotideIndices : Array<number>,
    regionsPerRnaMolecule : NucleotideRegionsAnnotateMenu.RegionsPerRnaMolecule
  ) {
    let minimumNucleotideIndexInclusive = Number.NaN;
    let maximumNucleotideIndexInclusive = Number.NaN;
    nucleotideIndices.sort(subtractNumbers);
    for (let i = 0; i < nucleotideIndices.length; i++) {
      const nucleotideIndex = nucleotideIndices[i];

      if (indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(nucleotideIndex)) {
        if (!Number.isNaN(minimumNucleotideIndexInclusive)) {
          regionsPerRnaMolecule.push({
            minimumNucleotideIndexInclusive,
            maximumNucleotideIndexInclusive
          });
        }
        minimumNucleotideIndexInclusive = Number.NaN;
      } else {
        if (Number.isNaN(minimumNucleotideIndexInclusive)) {
          minimumNucleotideIndexInclusive = nucleotideIndex;
        }
        maximumNucleotideIndexInclusive = nucleotideIndex;
      }
    }
    if (!Number.isNaN(minimumNucleotideIndexInclusive)) {
      regionsPerRnaMolecule.push({
        minimumNucleotideIndexInclusive,
        maximumNucleotideIndexInclusive
      });
    }
  }

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
    // Begin context data.
    const averageDistancesFromContext = useContext(Context.BasePair.AverageDistances);
    const labelContentDefaultStyles = useContext(Context.Label.Content.DefaultStyles);
    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
    const { theme } = useTheme();
    
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
    ] = useState<StartingNucleotideIndicesPerRegion>(getNucleotideRegionData().startingNucleotideIndicesPerRegion);
    const [
      startingNucleotideOverridingIndicesForLabelsPerRegion,
      setStartingNucleotideOverridingIndicesForLabelsPerRegion
    ] = useState<StartingNucleotideIndicesPerRegion>(getNucleotideRegionData().startingNucleotideOverridingIndicesForLabelsPerRegion);
    const [
      copyStartingIndexToOverridingLabelIndexFlag,
      setCopyStartingIndexToOverridingLabelIndexFlag
    ] = useState(true);
    const [
      useStopIndex,
      setUseStopIndex
    ] = useState(false);
    const [
      stopIndex,
      setStopIndex
    ] = useState<number | undefined>(undefined);
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
    function performAnnotationAction(
      annotationAction : AnnotationAction,
      localNucleotideIndexIncrement = nucleotideIndexIncrement
    ) {
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
            
            // Determine the effective maximum index based on stop index setting
            const effectiveMaximumIndex = stopIndex !== undefined 
              ? Math.min(stopIndex, maximumNucleotideIndexInclusive)
              : maximumNucleotideIndexInclusive;
            
            for (let nucleotideIndex = startingNucleotideIndexPerRegion; nucleotideIndex <= effectiveMaximumIndex; nucleotideIndex += localNucleotideIndexIncrement) {
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
                      const labelContentDefaultStyle = labelContentDefaultStyles[rnaComplexIndex][rnaMoleculeName] ?? {
                        color : structuredClone(BLACK),
                        font : structuredClone(Font.DEFAULT)
                      };
                      singularNucleotideProps.labelContentProps = {
                        ...scaleUp(
                          orthogonalUnitVector,
                          averageDistancesPerRnaMolecule.labelContentDistance * (1 + scalePercentAdjustment)
                        ),
                        content : `${nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex + nucleotideIndexDelta}`,
                        font : structuredClone(labelContentDefaultStyle.font),
                        color : structuredClone(labelContentDefaultStyle.color),
                        strokeWidth : DEFAULT_STROKE_WIDTH
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
    function getNucleotideRegionData() {
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
      return {
        startingNucleotideIndicesPerRegion,
        startingNucleotideOverridingIndicesForLabelsPerRegion
      };
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
          const averageDistancesPerRnaComplexFromContext = averageDistancesFromContext[rnaComplexIndex];
          let averageDistanceFromContext = Context.BasePair.DEFAULT_DISTANCES.canonical;
          for (const basePairType of BasePair.types) {
            const candidateDistance = averageDistancesPerRnaComplexFromContext.distances[basePairType];
            if (candidateDistance !== Number.POSITIVE_INFINITY && !Number.isNaN(candidateDistance)) {
              // This occurs when there are > 0 base pairs of <basePairType> in the RNA complex.
              averageDistanceFromContext = candidateDistance;
              break;
            }
          }

          rightOrthogonalizationFlagRecord[rnaComplexIndex] = {};
          const rightOrthogonalizationFlagRecordPerRnaComplex = rightOrthogonalizationFlagRecord[rnaComplexIndex];

          const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
          const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
          for (const rnaMoleculeName in rnaMoleculeProps) {
            averageDistancesPerRnaComplex[rnaMoleculeName] = {
              labelPoint0Distance : averageDistanceFromContext * 0.25,
              labelPoint1Distance : averageDistanceFromContext * 0.75,
              labelContentDistance : averageDistanceFromContext
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
        const {
          startingNucleotideIndicesPerRegion,
          startingNucleotideOverridingIndicesForLabelsPerRegion
        } = getNucleotideRegionData();
        setStartingNucleotideIndicesPerRegion(startingNucleotideIndicesPerRegion);
        setStartingNucleotideOverridingIndicesForLabelsPerRegion(startingNucleotideOverridingIndicesForLabelsPerRegion);
      },
      [regions]
    );
    // Clean checkbox component
    const StyledCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 0',
        cursor: 'pointer',
        userSelect: 'none',
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{
            width: '16px',
            height: '16px',
            cursor: 'pointer',
            accentColor: theme.colors.primary,
          }}
        />
        <span style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text,
          lineHeight: '1.4',
        }}>
          {label}
        </span>
      </label>
    );

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '24px',
        padding: '16px',
      }}>
        {/* Labeling Controls Grid */}
        <div>
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Labeling Controls
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}>
            {/* Start Index */}
            <div>
              <label style={{
                fontSize: theme.typography.fontSize.xs,
                fontWeight: '600',
                color: theme.colors.textSecondary,
                marginBottom: '6px',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Start Index
              </label>
              <InputWithValidator.Integer
                value={1}
                setValue={() => {}}
                min={1}
              />
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textMuted,
                marginTop: '4px',
              }}>
                Where to start labeling
              </div>
            </div>

            {/* Override Start */}
            <div>
              <label style={{
                fontSize: theme.typography.fontSize.xs,
                fontWeight: '600',
                color: theme.colors.textSecondary,
                marginBottom: '6px',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Override Start (Optional)
              </label>
              <InputWithValidator.Integer
                value={1}
                setValue={() => {}}
                min={1}
              />
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textMuted,
                marginTop: '4px',
              }}>
                Custom label numbering
              </div>
            </div>

            {/* Increment */}
            <div>
              <label style={{
                fontSize: theme.typography.fontSize.xs,
                fontWeight: '600',
                color: theme.colors.textSecondary,
                marginBottom: '6px',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Increment
              </label>
              <InputWithValidator.Integer
                value={nucleotideIndexIncrement}
                setValue={setNucleotideIndexIncrement}
                min={1}
              />
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textMuted,
                marginTop: '4px',
              }}>
                Label every Nth nucleotide
              </div>
            </div>

            {/* End Index */}
            <div>
              <label style={{
                fontSize: theme.typography.fontSize.xs,
                fontWeight: '600',
                color: theme.colors.textSecondary,
                marginBottom: '6px',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                End Index (Optional)
              </label>
              <InputWithValidator.Integer
                value={stopIndex ?? 0}
                setValue={setStopIndex}
                min={0}
              />
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textMuted,
                marginTop: '4px',
              }}>
                Stop labeling at this index
              </div>
            </div>
          </div>

          {/* Advanced Settings - Collapsible */}
          <div style={{
            paddingTop: '16px',
            borderTop: `1px solid ${theme.colors.border}`,
          }}>
            <Collapsible.Component title="Advanced: Region Selection & Auto-sync">
              <div style={{ paddingTop: '16px' }}>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.textMuted,
                  marginBottom: '16px',
                  lineHeight: '1.5',
                }}>
                  Configure which regions to label and sync settings.
                </div>

                <StyledCheckbox
                  label="Auto-sync Start with Override"
                  checked={copyStartingIndexToOverridingLabelIndexFlag}
                  onChange={() => setCopyStartingIndexToOverridingLabelIndexFlag(!copyStartingIndexToOverridingLabelIndexFlag)}
                />

                <div style={{ marginTop: '16px' }}>
                  <StartingNucleotideIndicesEditor.Component
                    regions={regions}
                    rnaComplexProps={rnaComplexProps}
                    startingNucleotideIndicesPerRegion={startingNucleotideIndicesPerRegion}
                    updateStartingNucleotideIndexHelper={function(
                      rnaComplexIndex: RnaComplexKey,
                      rnaMoleculeName: RnaMoleculeKey,
                      regionIndex: number,
                      newStartingNucleotideIndex: NucleotideKey
                    ) {
                      startingNucleotideIndicesPerRegion[rnaComplexIndex][rnaMoleculeName][regionIndex] = newStartingNucleotideIndex;
                      setStartingNucleotideIndicesPerRegion(structuredClone(startingNucleotideIndicesPerRegion));
                    }}
                    startingNucleotideOverridingIndicesForLabelsPerRegion={startingNucleotideOverridingIndicesForLabelsPerRegion}
                    updateStartingNucleotideOverridingIndexForLabelPerRegionHelper={function(
                      rnaComplexIndex: RnaComplexKey,
                      rnaMoleculeName: RnaMoleculeKey,
                      regionIndex: number,
                      newStartingNucleotideOverridingIndexForLabel: NucleotideKey
                    ) {
                      startingNucleotideOverridingIndicesForLabelsPerRegion[rnaComplexIndex][rnaMoleculeName][regionIndex] = newStartingNucleotideOverridingIndexForLabel;
                      setStartingNucleotideOverridingIndicesForLabelsPerRegion(structuredClone(startingNucleotideOverridingIndicesForLabelsPerRegion));
                    }}
                    copyStartingIndexToOverridingLabelIndexFlag={copyStartingIndexToOverridingLabelIndexFlag}
                  />
                </div>
              </div>
            </Collapsible.Component>
          </div>
        </div>

        {/* Label Options */}
        <div style={{
          paddingTop: '24px',
          borderTop: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Label Options
          </div>
          
          <StyledCheckbox
            label="Include Label Lines"
            checked={affectLabelLineFlag}
            onChange={() => setAffectLabelLineFlag(!affectLabelLineFlag)}
          />
          
          <StyledCheckbox
            label="Include Label Text"
            checked={affectLabelContentFlag}
            onChange={() => setAffectLabelContentFlag(!affectLabelContentFlag)}
          />
          
          <StyledCheckbox
            label="Recreate Existing Labels"
            checked={recreateExistingAnnotationsFlag}
            onChange={() => setRecreateExistingAnnotationsFlag(!recreateExistingAnnotationsFlag)}
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          paddingTop: '24px',
          borderTop: `1px solid ${theme.colors.border}`,
        }}>
          <button
            onClick={function(e) {
              pushToUndoStack();
              performAnnotationAction(AnnotationAction.CREATE);
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: theme.colors.primary,
              color: 'white',
              border: 'none',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Create
          </button>
          
          <button
            onClick={function(e) {
              pushToUndoStack();
              performAnnotationAction(AnnotationAction.DELETE, 1);
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              color: theme.colors.textSecondary,
              border: `1px solid ${theme.colors.border}`,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
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
    ) => void,
    copyStartingIndexToOverridingLabelIndexFlag : boolean
  };

  export function Component(props : Props) {
    const {
      regions,
      rnaComplexProps,
      startingNucleotideIndicesPerRegion,
      updateStartingNucleotideIndexHelper,
      startingNucleotideOverridingIndicesForLabelsPerRegion,
      updateStartingNucleotideOverridingIndexForLabelPerRegionHelper,
      copyStartingIndexToOverridingLabelIndexFlag
    } = props;
    const { theme } = useTheme();
    // Begin state data.
    const [
      selectedRnaComplexIndex,
      _setSelectedRnaComplexIndex
    ] = useState<number>(-1);
    const [
      selectedRnaMoleculeName,
      _setSelectedRnaMoleculeName
    ] = useState<string | -1>(-1);
    const [
      selectedRegionIndex,
      _setSelectedRegionIndex
    ] = useState<number>(-1);
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
    function setSelectedRnaComplexIndex(
      newSelectedRnaComplexIndex : number,
      regionsPerRnaComplex : NucleotideRegionsAnnotateMenu.RegionsPerRnaComplex
    ) {
      _setSelectedRnaComplexIndex(newSelectedRnaComplexIndex);
      if (newSelectedRnaComplexIndex !== -1) {
        const newRegionsPerSelectedRnaComplexIndex = regions[newSelectedRnaComplexIndex];
        setRegionsPerSelectedRnaComplex(newRegionsPerSelectedRnaComplexIndex);
        const newStartingNucleotideIndicesPerRnaComplex = startingNucleotideIndicesPerRegion[newSelectedRnaComplexIndex];
        setStartingNucleotideIndicesPerRegionPerRnaComplex(newStartingNucleotideIndicesPerRnaComplex);
        const newStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex = startingNucleotideOverridingIndicesForLabelsPerRegion[newSelectedRnaComplexIndex];
        setStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex(newStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex);

        const flattenedRegionsPerRnaComplex = Object.entries(regionsPerRnaComplex);
        if (flattenedRegionsPerRnaComplex.length === 1) {
          const [
            rnaMoleculeName,
            regionsPerRnaMolecule
          ] = flattenedRegionsPerRnaComplex[0];
          setSelectedRnaMoleculeName(
            rnaMoleculeName,
            regionsPerRnaMolecule,
            regionsPerRnaComplex,
            newStartingNucleotideIndicesPerRnaComplex,
            newStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex
          );
        }
      } else {
        _setSelectedRnaMoleculeName(-1);
        _setSelectedRegionIndex(-1);
      }
    }
    function setSelectedRnaMoleculeName(
      newSelectedRnaMoleculeName : string | -1,
      regionsPerRnaMolecule : NucleotideRegionsAnnotateMenu.RegionsPerRnaMolecule,
      regionsPerSelectedRnaComplex : NucleotideRegionsAnnotateMenu.RegionsPerRnaComplex,
      startingNucleotideIndicesPerRegionPerRnaComplex : NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaComplex,
      startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex : NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaComplex
    ) {
      _setSelectedRnaMoleculeName(newSelectedRnaMoleculeName);
      if (newSelectedRnaMoleculeName !== -1) {
        const newRegionsPerSelectedRnaMolecule = regionsPerSelectedRnaComplex[newSelectedRnaMoleculeName];
        setRegionsPerSelectedRnaMolecule(newRegionsPerSelectedRnaMolecule);
        const newStartingNucleotideIndicesPerRegionPerRnaMolecule = startingNucleotideIndicesPerRegionPerRnaComplex[newSelectedRnaMoleculeName];
        setStartingNucleotideIndicesPerRegionPerRnaMolecule(newStartingNucleotideIndicesPerRegionPerRnaMolecule);
        const newStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule = startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex[newSelectedRnaMoleculeName];
        setStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule(newStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule);
        const flattenedRegionsPerRnaMolecule = Object.entries(regionsPerRnaMolecule);
        if (flattenedRegionsPerRnaMolecule.length === 1) {
          const [
            regionIndexAsString,
            region
          ] = flattenedRegionsPerRnaMolecule[0];
          setSelectedRegionIndex(
            Number.parseInt(regionIndexAsString),
            newRegionsPerSelectedRnaMolecule,
            newStartingNucleotideIndicesPerRegionPerRnaMolecule,
            newStartingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule
          );
        }
      } else {
        _setSelectedRegionIndex(-1);
      }
    }
    function setSelectedRegionIndex(
      newSelectedRegionIndex : number,
      regionsPerSelectedRnaMolecule : NucleotideRegionsAnnotateMenu.RegionsPerRnaMolecule,
      startingNucleotideIndicesPerRegionPerRnaMolecule : NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaMolecule,
      startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule : NucleotideRegionsAnnotateMenu.StartingNucleotideIndicesPerRegionPerRnaMolecule
    ) {
      _setSelectedRegionIndex(newSelectedRegionIndex);
      if (newSelectedRegionIndex !== -1) {
        setSelectedRegion(regionsPerSelectedRnaMolecule[newSelectedRegionIndex]);
        if (startingNucleotideIndicesPerRegionPerRnaMolecule !== undefined) {
          setStartingNucleotideIndexPerRegion(startingNucleotideIndicesPerRegionPerRnaMolecule[newSelectedRegionIndex]);
        }
        if (startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule !== undefined) {
          setStartingNucleotideOverridingIndexForLabel(startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule[newSelectedRegionIndex]);
        }
      }
    }
    // Begin memo data.
    const firstNucleotideIndexPerRnaMolecule = useMemo(
      function() {
        if (
          selectedRnaComplexIndex === -1 ||
          selectedRnaMoleculeName === -1 ||
          selectedRegionIndex === -1 || 
          startingNucleotideIndexPerRegion === undefined
        ) {
          return undefined;
        }
        const singularRnaComplexProps = rnaComplexProps[selectedRnaComplexIndex];
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[selectedRnaMoleculeName];
        return singularRnaMoleculeProps.firstNucleotideIndex;
      },
      [
        selectedRnaComplexIndex,
        selectedRnaMoleculeName,
        selectedRegionIndex,
        startingNucleotideIndexPerRegion
      ]
    );
    // Begin effects.
    useEffect(
      function() {
        const flattenedRegions = Object.entries(regions);
        if (flattenedRegions.length === 1) {
          const [
            rnaComplexIndexAsString,
            regionsPerRnaComplex
          ] = flattenedRegions[0];
          setSelectedRnaComplexIndex(
            Number.parseInt(rnaComplexIndexAsString),
            regionsPerRnaComplex
          );
        } else {
          _setSelectedRnaComplexIndex(-1);
          _setSelectedRnaMoleculeName(-1);
          _setSelectedRegionIndex(-1);
        }
      },
      [
        regions,
        startingNucleotideIndicesPerRegion,
        startingNucleotideOverridingIndicesForLabelsPerRegion
      ]
    );
    const selectStyle = {
      width: '100%',
      padding: '8px 10px',
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      cursor: 'pointer',
      outline: 'none',
    };

    const labelStyle = {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: '6px',
      display: 'block',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
    };

    const fieldContainerStyle = {
      marginBottom: '20px',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* RNA Complex Selector */}
        <div style={fieldContainerStyle}>
          <label style={labelStyle}>RNA Complex</label>
          <select
            value={selectedRnaComplexIndex}
            onChange={function(e) {
              const selectedRnaComplexIndexAsString = e.target.value;
              const newSelectedRnaComplexIndex = Number.parseInt(selectedRnaComplexIndexAsString);
              setSelectedRnaComplexIndex(
                newSelectedRnaComplexIndex,
                regions[newSelectedRnaComplexIndex]
              );
            }}
            style={selectStyle}
          >
            <option style={{ display: "none" }} value={-1}>
              Select an RNA complex
            </option>
            {Object.keys(regions).map(function(rnaComplexIndexAsString) {
              const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
              const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
              const rnaComplexName = singularRnaComplexProps.name;
              return (
                <option key={rnaComplexIndex} value={rnaComplexIndex}>
                  {rnaComplexName}
                </option>
              );
            })}
          </select>
        </div>

        {/* RNA Molecule Selector */}
        {selectedRnaComplexIndex !== -1 && regionsPerSelectedRnaComplex !== undefined && startingNucleotideIndicesPerRegionPerRnaComplex !== undefined && startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex !== undefined && (
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>RNA Molecule</label>
            <select
              value={selectedRnaMoleculeName}
              onChange={function(e) {
                const newSelectedRnaMoleculeName = e.target.value;
                setSelectedRnaMoleculeName(
                  newSelectedRnaMoleculeName,
                  regionsPerSelectedRnaComplex[newSelectedRnaMoleculeName],
                  regionsPerSelectedRnaComplex,
                  startingNucleotideIndicesPerRegionPerRnaComplex,
                  startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaComplex
                );
              }}
              style={selectStyle}
            >
              <option style={{ display: "none" }} value={-1}>
                Select an RNA molecule
              </option>
              {Object.keys(regions[selectedRnaComplexIndex]).map(function(rnaMoleculeName) {
                return (
                  <option key={rnaMoleculeName} value={rnaMoleculeName}>
                    {rnaMoleculeName}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Region Index Selector */}
        {selectedRnaMoleculeName !== -1 && regionsPerSelectedRnaMolecule !== undefined && startingNucleotideIndicesPerRegionPerRnaMolecule !== undefined && startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule !== undefined && (
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>
              Region ({regionsPerSelectedRnaMolecule.length} total)
            </label>
            <select
              value={selectedRegionIndex}
              onChange={function(e) {
                const newSelectedRegionIndex = Number.parseInt(e.target.value);
                setSelectedRegionIndex(
                  newSelectedRegionIndex,
                  regionsPerSelectedRnaMolecule,
                  startingNucleotideIndicesPerRegionPerRnaMolecule,
                  startingNucleotideOverridingIndicesForLabelsPerRegionPerRnaMolecule
                );
              }}
              style={selectStyle}
            >
              <option style={{ display: "none" }} value={-1}>
                Select a region
              </option>
              {regionsPerSelectedRnaMolecule.map(function(_, i) {
                return (
                  <option key={i} value={i}>
                    Region {i + 1}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Index Configuration */}
        {selectedRegionIndex !== -1 && selectedRegion !== undefined && startingNucleotideIndexPerRegion !== undefined && startingNucleotideOverridingIndexForLabel !== undefined && (
          <>
            <div style={{
              ...fieldContainerStyle,
              paddingTop: '20px',
              borderTop: `1px solid ${theme.colors.border}`,
            }}>
              <label style={labelStyle}>Starting Index</label>
              <InputWithValidator.Integer
                value={startingNucleotideIndexPerRegion + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
                setValue={function(newFirstNucleotideIndex) {
                  const normalizedNewFirstNucleotideIndex = newFirstNucleotideIndex - (firstNucleotideIndexPerRnaMolecule ?? Number.NaN);
                  updateStartingNucleotideIndexHelper(
                    selectedRnaComplexIndex as number,
                    selectedRnaMoleculeName as string,
                    selectedRegionIndex,
                    normalizedNewFirstNucleotideIndex
                  );
                  if (copyStartingIndexToOverridingLabelIndexFlag) {
                    updateStartingNucleotideOverridingIndexForLabelPerRegionHelper(
                      selectedRnaComplexIndex as number,
                      selectedRnaMoleculeName as string,
                      selectedRegionIndex,
                      normalizedNewFirstNucleotideIndex
                    );
                    setStartingNucleotideOverridingIndexForLabel(normalizedNewFirstNucleotideIndex);
                  }
                }}
                min={selectedRegion.minimumNucleotideIndexInclusive + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
                max={selectedRegion.maximumNucleotideIndexInclusive + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
              />
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                marginTop: '4px',
              }}>
                Range: {selectedRegion.minimumNucleotideIndexInclusive + (firstNucleotideIndexPerRnaMolecule ?? 0)} - {selectedRegion.maximumNucleotideIndexInclusive + (firstNucleotideIndexPerRnaMolecule ?? 0)}
              </div>
            </div>

            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Overriding Label Index</label>
              <InputWithValidator.Integer
                value={startingNucleotideOverridingIndexForLabel + (firstNucleotideIndexPerRnaMolecule ?? Number.NaN)}
                setValue={function(newNucleotideOverridingIndexForLabel) {
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
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                marginTop: '4px',
              }}>
                Custom label numbering offset
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}