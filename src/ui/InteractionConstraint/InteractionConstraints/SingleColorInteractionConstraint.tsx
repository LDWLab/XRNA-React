import { DragListener, RnaComplexProps, FullKeys } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import Color, { BLACK, DEFAULT_ALPHA, areEqual } from "../../../data_structures/Color";
import { Vector2D, add } from "../../../data_structures/Vector2D";
import { parseInteger } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { FilterHelicesMode, InteractionConstraint, iterateOverFreeNucleotidesAndHelicesPerScene } from "../InteractionConstraints";

export class SingleColorInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly editMenuProps : AppSpecificOrientationEditor.SimplifiedProps;
  private readonly color : Color;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;
  private readonly approveBasePair : (basePair : BasePairsEditor.BasePair) => boolean;
  private readonly fullKeysOfNucleotidesWithColor : Array<FullKeys>;

  public constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab
  ) {
    super(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    );
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const toBeDragged = new Array<Vector2D>();
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
    const basePairKeysToRerender : BasePairKeysToRerender = {};

    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const color = singularNucleotideProps.color ?? BLACK;
    this.color = color;

    this.fullKeysOfNucleotidesWithColor = [];
    const rnaComplexIndices = Object.keys(this.rnaComplexProps).map(parseInteger);
    for (let rnaComplexIndex of rnaComplexIndices) {
      const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
      nucleotideKeysToRerender[rnaComplexIndex] = {};
      const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
      basePairKeysToRerender[rnaComplexIndex] = [];
      const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
      const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
      const rnaMoleculeNames = Object.keys(singularRnaComplexProps.rnaMoleculeProps);
      for (let rnaMoleculeName of rnaMoleculeNames) {
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
        nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
        const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
        const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
        const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps).map(parseInteger);
        for (let nucleotideIndex of nucleotideIndices) {
          const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
          const nucleotideColor = singularNucleotideProps.color ?? BLACK;
          if (areEqual(
            color,
            nucleotideColor
          )) {
            this.fullKeysOfNucleotidesWithColor.push({
              rnaComplexIndex,
              rnaMoleculeName,
              nucleotideIndex
            });
            toBeDragged.push(singularNucleotideProps);

            nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
            if (nucleotideIndex in basePairsPerRnaMolecule) {
              const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
              basePairKeysToRerenderPerRnaComplex.push({
                rnaMoleculeName,
                nucleotideIndex
              });
              const singularBasePairedRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[mappedBasePairInformation.rnaMoleculeName];
              const singularBasePairedNucleotideProps = singularBasePairedRnaMoleculeProps.nucleotideProps[mappedBasePairInformation.nucleotideIndex];
              const mismatchedColorBasePairExistsFlag = !areEqual(
                color,
                singularBasePairedNucleotideProps.color ?? BLACK
              );
              if (mismatchedColorBasePairExistsFlag && tab !== Tab.ANNOTATE) {
                const error : InteractionConstraintError = {
                  errorMessage : "Cannot interact with pairs of differently colored base-paired nucleotides using this selection constraint."
                };
                throw error;
              }
            }
          }
        }
      }
    }
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps),
      toBeDragged,
      rerender
    );
    this.editMenuProps = {
      boundingVector0 : add(
        singularNucleotideProps,
        {
          x : -1,
          y : 0
        }
      ),
      boundingVector1 : add(
        singularNucleotideProps,
        {
          x : 1,
          y : 0
        }
      ),
      positions : toBeDragged,
      onUpdatePositions : rerender
    };
    const unfilteredInitialBasePairs : Array<BasePairsEditor.BasePair> = [];
    iterateOverFreeNucleotidesAndHelicesPerScene(
      rnaComplexProps,
      FilterHelicesMode.COMPARE_ALL_KEYS 
    ).forEach(function(helixDataPerRnaComplex) {
      const rnaComplexIndex = helixDataPerRnaComplex.rnaComplexIndex;
      const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
      helixDataPerRnaComplex.helixDataPerRnaMolecules.forEach(function(helixDataPerRnaMolecule) {
      const rnaMoleculeName0 = helixDataPerRnaMolecule.rnaMoleculeName0;
      const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
      unfilteredInitialBasePairs.push(...helixDataPerRnaMolecule.helixData.map(function(helixDatum) {
        const rnaMoleculeName1 = helixDatum.rnaMoleculeName1;
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
        return {
          rnaComplexIndex,
          rnaMoleculeName0,
          rnaMoleculeName1 : helixDatum.rnaMoleculeName1,
          nucleotideIndex0 : helixDatum.start[0] + singularRnaMoleculeProps0.firstNucleotideIndex,
          nucleotideIndex1 : Math.max(helixDatum.start[1], helixDatum.stop[1]) + singularRnaMoleculeProps1.firstNucleotideIndex,
          length : Math.abs(helixDatum.start[0] - helixDatum.stop[0]) + 1
        };
      }));
    })
    });
    function approveBasePair(basePair : BasePairsEditor.BasePair) {
      const singularRnaComplexProps = rnaComplexProps[basePair.rnaComplexIndex];
      const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName0];
      const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName1];

      const initialFormattedNucleotideIndex0 = basePair.nucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
      const initialFormattedNucleotideIndex1 = basePair.nucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
      for (let i = 0; i < basePair.length; i++) {
        const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[initialFormattedNucleotideIndex0 + i];
        const singularNucleotideProps1 = singularRnaMoleculeProps1.nucleotideProps[initialFormattedNucleotideIndex1 - i];
        if (!areEqual(
          color,
          singularNucleotideProps0.color ?? BLACK
        )) {
          return false;
        }
        if (!areEqual(
          color,
          singularNucleotideProps1.color ?? BLACK
        )) {
          return false;
        }
      }
      return true;
    }
    this.approveBasePair = approveBasePair;
    this.initialBasePairs = unfilteredInitialBasePairs.filter(approveBasePair);
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const color = this.color;
    const approveBasePair = this.approveBasePair;
    let menu : JSX.Element;
    switch (tab) {
      case Tab.EDIT : {
        menu = <AppSpecificOrientationEditor.Simplified
          {...this.editMenuProps}
        />;
        break;
      }
      case Tab.FORMAT : {
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          initialBasePairs = {this.initialBasePairs}
          approveBasePairs = {function(basePairs) {
            for (let i = 0; i < basePairs.length; i++) {
              const basePair = basePairs[i];
              const approvalFlag = approveBasePair(basePair);
              if (!approvalFlag) {
                throw `This interaction constraint expects base-pairs between nucleotides with the exact same color as the clicked-on nucleotide. The base pair(s) on line ${i + 1} include differently colored nucleotides.`;
              }
            }
          }}
        />;
        break;
      }
      case Tab.ANNOTATE : {
        const regions : NucleotideRegionsAnnotateMenu.Regions = {};
        for (const {
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        } of this.fullKeysOfNucleotidesWithColor) {
          if (!(rnaComplexIndex in regions)) {
            regions[rnaComplexIndex] = {};
          }
          const regionsPerRnaComplex = regions[rnaComplexIndex];
          if (!(rnaMoleculeName in regionsPerRnaComplex)) {
            regionsPerRnaComplex[rnaMoleculeName] = [];
          }
          const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
          if (regionsPerRnaMolecule.length > 0) {
            const previouslyAddedRegion = regionsPerRnaMolecule[regionsPerRnaMolecule.length - 1];
            if (nucleotideIndex === previouslyAddedRegion.maximumNucleotideIndexInclusive + 1) {
              previouslyAddedRegion.maximumNucleotideIndexInclusive = nucleotideIndex;
            } else if (nucleotideIndex === previouslyAddedRegion.minimumNucleotideIndexInclusive - 1) {
              previouslyAddedRegion.minimumNucleotideIndexInclusive = nucleotideIndex;
            } else {
              regionsPerRnaMolecule.push({
                minimumNucleotideIndexInclusive : nucleotideIndex,
                maximumNucleotideIndexInclusive : nucleotideIndex
              });
            }
          } else {
            regionsPerRnaMolecule.push({
              minimumNucleotideIndexInclusive : nucleotideIndex,
              maximumNucleotideIndexInclusive : nucleotideIndex
            });
          }
        }
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {regions}
          rnaComplexProps = {this.rnaComplexProps}
          setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
        />;
        break;
      }
      default : {
        throw "Unhandled switch case.";
      }
    }
    return <>
      <b>
        {tab} all nucleotides of the same color (red = {color.red}, green = {color.green}, blue = {color.blue}, alpha = {color.alpha ?? DEFAULT_ALPHA}):
      </b>
      <br/>
      {menu}
    </>;
  }
}