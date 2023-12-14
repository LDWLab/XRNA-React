import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { RnaComplex, compareBasePairKeys, isRelevantBasePairKeySetInPair } from "../../../components/app_specific/RnaComplex";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule, NucleotideKeysToRerenderPerRnaComplex } from "../../../context/Context";
import { scaleUp, add, orthogonalizeLeft, subtract, asAngle } from "../../../data_structures/Vector2D";
import { subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint, HelixData, populateToBeDraggedWithHelix, iterateOverFreeNucleotidesAndHelicesPerNucleotideRange, FilterHelicesMode } from "../InteractionConstraints";
import { AllInOneEditor } from "./AllInOneEditor";

export class RnaSubdomainInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly partialMenuHeader : JSX.Element;
  private readonly editMenuProps : AppSpecificOrientationEditor.SimplifiedProps;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;
  private readonly minimumNucleotideIndex : number;
  private readonly maximumNucleotideIndex : number;

  constructor(
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
    const rnaMoleculeName0 = rnaMoleculeName;
    const nucleotideIndex0 = nucleotideIndex;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const singularNucleotideProps0 = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    if (!(rnaMoleculeName0 in basePairsPerRnaComplex) || !(nucleotideIndex in basePairsPerRnaComplex[rnaMoleculeName0])) {
      throw nonBasePairedNucleotideError;
    }
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName0];
    const originalMappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
    const rnaMoleculeName1 = originalMappedBasePairInformation.rnaMoleculeName;
    const twoDistinctRnaMoleculesError : InteractionConstraintError = {
      errorMessage : "Cannot interact with a base pair between two distinct rna molecules using this constraint."
    };
    if (rnaMoleculeName0 !== rnaMoleculeName1) {
      throw twoDistinctRnaMoleculesError;
    }
    const nucleotideIndex1 = originalMappedBasePairInformation.nucleotideIndex;
    const toBeDragged = new Array<Nucleotide.ExternalProps>();
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {
        [rnaMoleculeName0] : []
      }
    };
    const nucleotideKeysToRerenderPerRnaComplex : NucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
    const basePairKeysToRerenderPerRnaComplex : BasePairKeysToRerenderPerRnaComplex = [];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : basePairKeysToRerenderPerRnaComplex
    };
    const listOfNucleotideIndices : Array<number> = [];
    function pushToListOfNucleotideIndices(keys : RnaComplex.BasePairKeys) {
      listOfNucleotideIndices.push(keys.nucleotideIndex);
    }
    const extremaIncremented = populateToBeDraggedWithHelix(
      1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps,
      singularRnaMoleculeProps,
      nucleotideKeysToRerenderPerRnaMolecule,
      nucleotideKeysToRerenderPerRnaMolecule,
      basePairKeysToRerenderPerRnaComplex,
      true,
      pushToListOfNucleotideIndices
    ).extrema;
    const extremaDecremented = populateToBeDraggedWithHelix(
      -1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps,
      singularRnaMoleculeProps,
      nucleotideKeysToRerenderPerRnaMolecule,
      nucleotideKeysToRerenderPerRnaMolecule,
      basePairKeysToRerenderPerRnaComplex,
      false,
      pushToListOfNucleotideIndices
    ).extrema;
    listOfNucleotideIndices.sort(subtractNumbers);
    let startingNucleotideIndex = listOfNucleotideIndices[(listOfNucleotideIndices.length - 1) >> 1];
    let endingNucleotideIndex = listOfNucleotideIndices[listOfNucleotideIndices.length >> 1];
    this.minimumNucleotideIndex = Math.min(
      extremaDecremented[0],
      extremaDecremented[1],
      extremaIncremented[0],
      extremaIncremented[1]
    );
    this.maximumNucleotideIndex = Math.max(
      extremaDecremented[0],
      extremaDecremented[1],
      extremaIncremented[0],
      extremaIncremented[1]
    );
    for (let nucleotideIndex = startingNucleotideIndex + 1; nucleotideIndex < endingNucleotideIndex; nucleotideIndex++) {
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        if (basePairsPerRnaMolecule[nucleotideIndex].rnaMoleculeName !== rnaMoleculeName) {
          throw twoDistinctRnaMoleculesError;
        } else if (
          nucleotideIndex < this.minimumNucleotideIndex ||
          nucleotideIndex > this.maximumNucleotideIndex
        ) {
          throw {
            errorMessage : "Cannot interact with a complex series of base pairs using this constraint"
          };
        }
      }
      toBeDragged.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
      nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        let keys0 = {
          rnaMoleculeName,
          nucleotideIndex
        }
        if (isRelevantBasePairKeySetInPair(keys0, basePairsPerRnaMolecule[nucleotideIndex])) {
          basePairKeysToRerenderPerRnaComplex.push(keys0);
        }
      }
    }
    nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps0),
      toBeDragged,
      rerender
    );
    const boundingNucleotideIndex0 = listOfNucleotideIndices[0];
    const boundingNucleotideIndex1 = listOfNucleotideIndices[listOfNucleotideIndices.length - 1];
    const boundingNucleotideProps0 = singularRnaMoleculeProps.nucleotideProps[boundingNucleotideIndex0];
    const boundingNucleotideProps1 = singularRnaMoleculeProps.nucleotideProps[boundingNucleotideIndex1];
    this.partialMenuHeader = <>
      Nucleotides bound by
      <br/>
      #{boundingNucleotideIndex0 + singularRnaMoleculeProps.firstNucleotideIndex} ({boundingNucleotideProps0.symbol})
      <br/>
      and
      <br/>
      #{boundingNucleotideIndex1 + singularRnaMoleculeProps.firstNucleotideIndex} ({boundingNucleotideProps1.symbol})
      <br/>
      In RNA molecule "{rnaMoleculeName}"
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
    const normalVector = orthogonalizeLeft(subtract(
      boundingNucleotideProps1,
      boundingNucleotideProps0
    ));
    this.editMenuProps = {
      boundingVector0 : boundingNucleotideProps0,
      boundingVector1 : boundingNucleotideProps1,
      positions : toBeDragged,
      onUpdatePositions : rerender,
      initialAngle : asAngle(normalVector)
    };
    const helixData = iterateOverFreeNucleotidesAndHelicesPerNucleotideRange(
      singularRnaComplexProps,
      rnaMoleculeName,
      this.minimumNucleotideIndex,
      this.maximumNucleotideIndex,
      FilterHelicesMode.COMPARE_NUCLEOTIDE_INDICES 
    );
    const initialBasePairs : Array<BasePairsEditor.BasePair> = helixData.helixData.map(function(helixDatum) {
      return {
        rnaComplexIndex,
        rnaMoleculeName0 : rnaMoleculeName,
        rnaMoleculeName1 : rnaMoleculeName,
        nucleotideIndex0 : helixDatum.start[0] + singularRnaMoleculeProps.firstNucleotideIndex,
        nucleotideIndex1 : Math.max(helixDatum.start[1], helixDatum.stop[1]) + singularRnaMoleculeProps.firstNucleotideIndex,
        length : Math.abs(helixDatum.start[0] - helixDatum.stop[0]) + 1
      };
    });
    this.addFullIndicesPerNucleotideKeysToRerender(nucleotideKeysToRerender);
    this.initialBasePairs = initialBasePairs;
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const formattedMinimumNucleotideIndex = this.minimumNucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
    const formattedMaximumNucleotideIndex = this.maximumNucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
    let menu : JSX.Element;
    switch (tab) {
      case Tab.EDIT : {
        menu = <AllInOneEditor.Simplified
          {...this.editMenuProps}
        />;
        break;
      }
      case Tab.FORMAT : {
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          approveBasePairs = {function(basePairs) {
            for (let i = 0; i < basePairs.length; i++) {
              const errorMessage = `This constraint expects base-pairs to exist strictly within the clicked-on subdomain.`;
              const basePair = basePairs[i];
              if (basePair.rnaComplexIndex !== rnaComplexIndex) {
                throw errorMessage;
              }
              if (
                basePair.rnaMoleculeName0 !== rnaMoleculeName ||
                basePair.rnaMoleculeName1 !== rnaMoleculeName
              ) {
                throw errorMessage;
              }
              for (const nucleotideIndex of [
                basePair.nucleotideIndex0,
                basePair.nucleotideIndex0 + basePair.length - 1,
                basePair.nucleotideIndex1,
                basePair.nucleotideIndex1 - basePair.length + 1
              ]) {
                if (
                  nucleotideIndex < formattedMinimumNucleotideIndex ||
                  nucleotideIndex > formattedMaximumNucleotideIndex
                ) {
                  throw errorMessage;
                }
              }
            }
          }}
          initialBasePairs = {this.initialBasePairs}
          defaultRnaComplexIndex = {rnaComplexIndex}
          defaultRnaMoleculeName0 = {rnaMoleculeName}
          defaultRnaMoleculeName1 = {rnaMoleculeName}
        />;
        break;
      }
      case Tab.ANNOTATE : {
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {{
            [rnaComplexIndex] : {
              [rnaMoleculeName] : [
                {
                  minimumNucleotideIndexInclusive : this.minimumNucleotideIndex,
                  maximumNucleotideIndexInclusive : this.maximumNucleotideIndex
                }
              ]
            }
          }}
          rnaComplexProps = {this.rnaComplexProps}
          setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
          />;
        break;
      }
      default : {
        throw "Unhandled switch case";
      }
    }
    return <>
      <b>
        {tab} RNA subdomain:
      </b>
      <br/>
      {this.partialMenuHeader}
      {menu}
    </>;
  }
}