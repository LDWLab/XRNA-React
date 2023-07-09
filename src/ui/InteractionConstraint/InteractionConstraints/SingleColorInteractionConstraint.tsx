import { DragListener, RnaComplexProps, FullKeys } from "../../../App";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { BLACK, areEqual } from "../../../data_structures/Color";
import { Vector2D, add } from "../../../data_structures/Vector2D";
import { parseInteger } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint } from "../InteractionConstraints";

export class SingleColorInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly mismatchedColorBasePairExistsFlag : boolean;
  private readonly rightClickMenuProps : AppSpecificOrientationEditor.SimplifiedProps;

  public constructor(
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

    const rnaComplexIndices = Object.keys(this.rnaComplexProps).map(parseInteger);
    this.mismatchedColorBasePairExistsFlag = false;
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
              let mismatchedColorBasePairExistsFlag = !areEqual(
                color,
                singularBasePairedNucleotideProps.color ?? BLACK
              );
              if (mismatchedColorBasePairExistsFlag) {
                this.mismatchedColorBasePairExistsFlag = true;
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
    this.rightClickMenuProps = {
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
      onUpdatePositions : rerender,
      disabledFlag : this.mismatchedColorBasePairExistsFlag
    };
  }

  public override drag() {
    if (this.mismatchedColorBasePairExistsFlag) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot drag nucleotides base-paired with different colors using this selection constraint."
      };
      throw error;
    }
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>
      <b>
        Edit all nucleotides with the same color:
      </b>
      <br/>
      {this.mismatchedColorBasePairExistsFlag && <>
        Cannot edit positions of these nucleotides, because some are base-paired to other colors.
        <br/>
      </>}
      <AppSpecificOrientationEditor.Simplified
        {...this.rightClickMenuProps}
      />
    </>;
  }
}