import { RnaComplex, compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { NucleotideKeysToRerender, BasePairKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, InteractionConstraintError, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";
import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { SingleBasePairInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/SingleBasePairinteractionConstraintEditMenu";
import BasePair, { getBasePairType } from "../../../components/app_specific/BasePair";
import { Vector2D, orthogonalizeLeft } from "../../../data_structures/Vector2D";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";

export class SingleBasePairInteractionConstraint extends AbstractInteractionConstraint {
  private dragListener : DragListener;
  private editMenuProps : SingleBasePairInteractionConstraintEditMenu.Props;
  private partialHeader : JSX.Element;
  private initialBasePairs : BasePairsEditor.InitialBasePairs;

  constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void
  ) {
    super(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    );
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
    const basePairKeysToRerender : BasePairKeysToRerender = {};
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const {
      basePairs
    } = singularRnaComplexProps;
    if (!(rnaMoleculeName in basePairs && nucleotideIndex in basePairs[rnaMoleculeName])) {
      throw nonBasePairedNucleotideError;
    }
    const basePairKeys = {
      rnaMoleculeName,
      nucleotideIndex
    };
    const mappedBasePair = basePairs[rnaMoleculeName][nucleotideIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const basePairedSingularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[mappedBasePair.rnaMoleculeName];
    const basePairedSingularNucleotideProps = basePairedSingularRnaMoleculeProps.nucleotideProps[mappedBasePair.nucleotideIndex];
    let lesserKeys : RnaComplex.BasePairKeys;
    let greaterKeys : RnaComplex.BasePairKeys;
    if (compareBasePairKeys(basePairKeys, mappedBasePair) <= 0) {
      lesserKeys = basePairKeys;
      greaterKeys = mappedBasePair;
    } else {
      lesserKeys = mappedBasePair;
      greaterKeys = basePairKeys;
    }
    basePairKeysToRerender[rnaComplexIndex] = [
      lesserKeys
    ];
    const initialDrag = {
      x : singularNucleotideProps.x,
      y : singularNucleotideProps.y
    };
    const toBeDragged = [
      singularNucleotideProps,
      basePairedSingularNucleotideProps
    ];
    const nucleotideIndex0 = nucleotideIndex;
    const nucleotideIndex1 = mappedBasePair.nucleotideIndex;
    const rnaMoleculeName0 = rnaMoleculeName;
    const rnaMoleculeName1 = mappedBasePair.rnaMoleculeName;
    const basePairsPerRnaMolecule0 = basePairs[rnaMoleculeName0];
    // for (const nucleotideIndex0IncrementOrDecrement of [-1, 1]) {
    //   const incrementedOrDecrementedNucleotideIndex0 = nucleotideIndex0 + nucleotideIndex0IncrementOrDecrement;
    //   if (incrementedOrDecrementedNucleotideIndex0 in basePairsPerRnaMolecule0) {
    //     const mappedBasePairInformation = basePairsPerRnaMolecule0[incrementedOrDecrementedNucleotideIndex0];
    //     const {
    //       rnaMoleculeName,
    //       nucleotideIndex
    //     } = mappedBasePairInformation;
    //     if (rnaMoleculeName === rnaMoleculeName1 && Math.abs(nucleotideIndex - nucleotideIndex1) === 1) {
    //       const error : InteractionConstraintError = {
    //         errorMessage : "Cannot interact with a single base pair that is part of a larger helix."
    //       };
    //       throw error;
    //     }
    //   }
    // }
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      const nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule = [];
      nucleotideKeysToRerender[rnaComplexIndex] = {
        [rnaMoleculeName] : nucleotideKeysToRerenderPerRnaMolecule
      }
      nucleotideKeysToRerenderPerRnaMolecule.push(lesserKeys.nucleotideIndex);
      for (let nucleotideIndex = lesserKeys.nucleotideIndex + 1; nucleotideIndex < greaterKeys.nucleotideIndex; nucleotideIndex++) {
        if (nucleotideIndex in singularRnaMoleculeProps.nucleotideProps) {
          nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
          toBeDragged.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
        }
      }
      nucleotideKeysToRerenderPerRnaMolecule.push(greaterKeys.nucleotideIndex);
    }
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    };
    this.dragListener = linearDrag(
      initialDrag,
      toBeDragged,
      rerender
    );
    this.partialHeader = <>
      Nucleotide #{nucleotideIndex + basePairedSingularRnaMoleculeProps.firstNucleotideIndex} ({singularNucleotideProps.symbol})
      <br/>
      In RNA molecule "{rnaMoleculeName}"
      <br/>
      Base-paired to:
      <br/>
      Nucleotide #{mappedBasePair.nucleotideIndex + basePairedSingularRnaMoleculeProps.firstNucleotideIndex} ({basePairedSingularNucleotideProps.symbol})
      <br/>
      In RNA molecule "{mappedBasePair.rnaMoleculeName}"
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
    let boundingVector0 : Vector2D;
    let boundingVector1 : Vector2D;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      let lesserNucleotideIndex;
      let greaterNucleotideIndex;
      if (nucleotideIndex0 < nucleotideIndex1) {
        lesserNucleotideIndex = nucleotideIndex0;
        greaterNucleotideIndex = nucleotideIndex1;
      } else {
        lesserNucleotideIndex = nucleotideIndex1;
        greaterNucleotideIndex = nucleotideIndex0;
      }
      boundingVector0 = singularRnaMoleculeProps.nucleotideProps[lesserNucleotideIndex];
      boundingVector1 = singularRnaMoleculeProps.nucleotideProps[greaterNucleotideIndex];
    } else {
      boundingVector0 = singularNucleotideProps;
      boundingVector1 = basePairedSingularNucleotideProps;
    }
    const basePairType = mappedBasePair.basePairType ?? getBasePairType(
      singularNucleotideProps.symbol,
      basePairedSingularNucleotideProps.symbol
    );
    this.editMenuProps = {
      boundingVector0,
      boundingVector1,
      positions : toBeDragged,
      onUpdatePositions : rerender,
      orthogonalizeHelper : orthogonalizeLeft,
      basePairType
    };
    this.initialBasePairs = [{
      rnaComplexIndex,
      rnaMoleculeName0,
      rnaMoleculeName1,
      nucleotideIndex0 : nucleotideIndex0 + singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0].firstNucleotideIndex,
      nucleotideIndex1 : nucleotideIndex1 + singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1].firstNucleotideIndex,
      length : 1,
      type : basePairType
    }];
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys;
    let menu : JSX.Element = <></>;
    switch (tab) {
      case Tab.EDIT : {
        menu = <SingleBasePairInteractionConstraintEditMenu.Component
          {...this.editMenuProps}
        />;
        break;
      }
      case Tab.FORMAT : {
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          initialBasePairs = {this.initialBasePairs}
          approveBasePairs = {function(parsedBasePairs : Array<BasePairsEditor.BasePair>) {
            if (parsedBasePairs.length > 1) {
              throw "This interaction constraint expects at most one base pair.";
            }
            if (parsedBasePairs.length === 1) {
              const parsedBasePair = parsedBasePairs[0];
              if (parsedBasePair.length > 1) {
                throw "This interaction constraint expects at most one base pair.";
              }
            }
          }}
          defaultRnaComplexIndex = {rnaComplexIndex}
          defaultRnaMoleculeName0 = {rnaMoleculeName}
          defaultRnaMoleculeName1 = {rnaMoleculeName}
        />;
        break;
      }
    }
    return <>
      <b>
        {tab} single base pair:
      </b>
      <br/>
      {this.partialHeader}
      {menu}
    </>;
  }
}