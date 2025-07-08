import { RnaComplexProps, FullKeys, DragListener, FullKeysRecord } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import BasePair from "../../../components/app_specific/BasePair";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { RnaComplex, compareBasePairKeys, isRelevantBasePairKeySetInPair, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule, NucleotideKeysToRerenderPerRnaComplex } from "../../../context/Context";
import { scaleUp, add, orthogonalizeLeft, subtract, asAngle } from "../../../data_structures/Vector2D";
import { range, subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError, multipleBasePairsNucleotideError, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint, HelixData, populateToBeDraggedWithHelix, iterateOverFreeNucleotidesAndHelicesPerNucleotideRange } from "../InteractionConstraints";
import { AllInOneEditor } from "./AllInOneEditor";

const complexSeriesOfBasePairsError = {
  errorMessage : "Cannot interact with a complex series of base pairs using this constraint"
};

export class RnaSubdomainInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly partialMenuHeader : JSX.Element;
  private readonly editMenuProps : AppSpecificOrientationEditor.SimplifiedProps;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;
  private readonly minimumNucleotideIndex : number;
  private readonly maximumNucleotideIndex : number;

  constructor(
    rnaComplexProps : RnaComplexProps,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab,
    indicesOfFrozenNucleotides : FullKeysRecord,
    { treatNoncanonicalBasePairsAsUnpairedFlag } : InteractionConstraint.Options,
    fullKeys0 : FullKeys,
    fullKeys1? : FullKeys,
  ) {
    super(
      rnaComplexProps,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      indicesOfFrozenNucleotides,
      fullKeys0,
      fullKeys1
    );
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = fullKeys0;
    const rnaMoleculeName0 = rnaMoleculeName;
    const nucleotideIndex0 = nucleotideIndex;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const singularNucleotideProps0 = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    if (!BasePair.isNucleotideBasePaired(
      singularNucleotideProps0.symbol,
      singularRnaComplexProps,
      basePairsPerRnaComplex,
      rnaMoleculeName0,
      nucleotideIndex0,
      treatNoncanonicalBasePairsAsUnpairedFlag
    )) {
      throw nonBasePairedNucleotideError;      
    }
    // if (!(rnaMoleculeName0 in basePairsPerRnaComplex) || !(nucleotideIndex in basePairsPerRnaComplex[rnaMoleculeName0])) {
    //   throw nonBasePairedNucleotideError;
    // }
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName0];
    const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
    let basePairPerNucleotide : RnaComplex.MappedBasePair;
    if (basePairsPerNucleotide.length === 1) {
      basePairPerNucleotide = basePairsPerNucleotide[0];
    } else {
      if (
        fullKeys1 === undefined
      ) {
        throw multipleBasePairsNucleotideError;
      }
      basePairPerNucleotide = basePairsPerNucleotide.find(({ rnaMoleculeName, nucleotideIndex }) => (
        fullKeys1.rnaMoleculeName === rnaMoleculeName &&
        fullKeys1.nucleotideIndex === nucleotideIndex
      ))!;
    }

    const rnaMoleculeName1 = basePairPerNucleotide.rnaMoleculeName;
    const twoDistinctRnaMoleculesError : InteractionConstraintError = {
      errorMessage : "Cannot interact with a base pair between two distinct rna molecules using this constraint."
    };
    if (rnaMoleculeName0 !== rnaMoleculeName1) {
      throw twoDistinctRnaMoleculesError;
    }
    const nucleotideIndex1 = basePairPerNucleotide.nucleotideIndex;
    let allNucleotides = new Array<Nucleotide.ExternalProps>();
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
    
    const helix = populateToBeDraggedWithHelix(
      singularRnaComplexProps,
      rnaMoleculeName0,
      nucleotideIndex0,
      rnaMoleculeName1,
      nucleotideIndex1,
      allNucleotides,
      treatNoncanonicalBasePairsAsUnpairedFlag,
      basePairKeysToRerenderPerRnaComplex,
      pushToListOfNucleotideIndices
    );
    const extremaIncremented = helix.stop;
    const extremaDecremented = helix.start;
    // const extremaIncremented = populateToBeDraggedWithHelix(
    //   1,
    //   nucleotideIndex0,
    //   nucleotideIndex1,
    //   basePairsPerRnaMolecule,
    //   rnaMoleculeName0,
    //   rnaMoleculeName1,
    //   allNucleotides,
    //   singularRnaMoleculeProps,
    //   singularRnaMoleculeProps,
    //   nucleotideKeysToRerenderPerRnaMolecule,
    //   nucleotideKeysToRerenderPerRnaMolecule,
    //   basePairKeysToRerenderPerRnaComplex,
    //   true,
    //   pushToListOfNucleotideIndices
    // ).extrema;
    // const extremaDecremented = populateToBeDraggedWithHelix(
    //   -1,
    //   nucleotideIndex0,
    //   nucleotideIndex1,
    //   basePairsPerRnaMolecule,
    //   rnaMoleculeName0,
    //   rnaMoleculeName1,
    //   allNucleotides,
    //   singularRnaMoleculeProps,
    //   singularRnaMoleculeProps,
    //   nucleotideKeysToRerenderPerRnaMolecule,
    //   nucleotideKeysToRerenderPerRnaMolecule,
    //   basePairKeysToRerenderPerRnaComplex,
    //   false,
    //   pushToListOfNucleotideIndices
    // ).extrema;
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
      // if (nucleotideIndex in basePairsPerRnaMolecule) {
      //   const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
      //   if (basePairsPerNucleotide.length > 1) {
      //     throw complexSeriesOfBasePairsError;
      //   }
      //     const basePairPerNucleotide = basePairsPerNucleotide[0];
      //   if (basePairPerNucleotide.rnaMoleculeName !== rnaMoleculeName) {
      //     throw twoDistinctRnaMoleculesError;
      //   } else if (
      //     nucleotideIndex < this.minimumNucleotideIndex ||
      //     nucleotideIndex > this.maximumNucleotideIndex
      //   ) {
      //     throw complexSeriesOfBasePairsError;
      //   }
      // }
      allNucleotides.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
      nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        let keys0 = {
          rnaMoleculeName,
          nucleotideIndex
        }
        const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
        for (const basePairPerNucleotide of basePairsPerNucleotide) {
          basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
            keys0,
            basePairPerNucleotide
          ));
        }
      }
    }
    nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    const frozenNucleotides = new Array<Nucleotide.ExternalProps>();
    if (rnaComplexIndex in indicesOfFrozenNucleotides) {
      const indicesOfFrozenNucleotidesPerRnaComplex = indicesOfFrozenNucleotides[rnaComplexIndex];
      if (rnaMoleculeName0 in indicesOfFrozenNucleotidesPerRnaComplex) {
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName];
        for (const nucleotideIndex of Array.from(indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule)) {
          frozenNucleotides.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
        }
      }
    }
    allNucleotides = allNucleotides.filter(function(nucleotide) { return !frozenNucleotides.includes(nucleotide); });
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps0),
      allNucleotides,
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
      positions : allNucleotides,
      onUpdatePositions : rerender,
      initialAngle : asAngle(normalVector)
    };
    const helixData = iterateOverFreeNucleotidesAndHelicesPerNucleotideRange(
      singularRnaComplexProps,
      rnaMoleculeName,
      this.minimumNucleotideIndex,
      this.maximumNucleotideIndex,
      treatNoncanonicalBasePairsAsUnpairedFlag
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
    } = this.fullKeys0;
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
        const indicesOfFrozenNucleotidesPerRnaComplex = rnaComplexIndex in this.indicesOfFrozenNucleotides ? this.indicesOfFrozenNucleotides[rnaComplexIndex] : {};
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName] : new Set<number>();
        const regionsPerRnaMolecule : NucleotideRegionsAnnotateMenu.RegionsPerRnaMolecule = [];
        NucleotideRegionsAnnotateMenu.populateRegions(
          indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule,
          range(
            this.maximumNucleotideIndex + 1,
            this.minimumNucleotideIndex
          ),
          regionsPerRnaMolecule
        );
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {{
            [rnaComplexIndex] : {
              [rnaMoleculeName] : regionsPerRnaMolecule
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