import { RnaComplex, compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { NucleotideKeysToRerender, BasePairKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";
import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { SingleBasePairInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/SingleBasePairinteractionConstraintEditMenu";
import BasePair, { getBasePairType } from "../../../components/app_specific/BasePair";
import { Vector2D, orthogonalizeLeft } from "../../../data_structures/Vector2D";

export class SingleBasePairInteractionConstraint extends AbstractInteractionConstraint {
  private dragListener : DragListener;
  private editMenuProps : SingleBasePairInteractionConstraintEditMenu.Props;
  private editMenuHeader : JSX.Element;

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
    this.editMenuHeader = <>
      <b>
        Edit single base pair:
      </b>
      <br/>
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
    this.editMenuProps = {
      boundingVector0,
      boundingVector1,
      positions : toBeDragged,
      onUpdatePositions : rerender,
      orthogonalizeHelper : orthogonalizeLeft,
      basePairType : mappedBasePair.basePairType ?? getBasePairType(
        singularNucleotideProps.symbol,
        basePairedSingularNucleotideProps.symbol
      )
    };
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>
      {this.editMenuHeader}
      <SingleBasePairInteractionConstraintEditMenu.Component
        {...this.editMenuProps}
      />
    </>;
  }
}