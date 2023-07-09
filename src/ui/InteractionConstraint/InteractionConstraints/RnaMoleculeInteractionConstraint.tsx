import { DragListener, FullKeys, RnaComplexProps } from "../../../App";
import { RnaMoleculeInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/RnaMoleculeInteractionConstraintEditMenu";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { parseInteger, subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint } from "../InteractionConstraints";

export class RnaMoleculeInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly dragError? : InteractionConstraintError;
  private readonly editMenuHeader : JSX.Element;
  private readonly editMenuProps : RnaMoleculeInteractionConstraintEditMenu.Props;

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
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const toBeDragged = new Array<Vector2D>();
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {
        [rnaMoleculeName] : []
      }
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps).map(parseInteger);
    nucleotideIndices.sort(subtractNumbers);
    for (let nucleotideIndex of nucleotideIndices) {
      toBeDragged.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
      nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
        basePairKeysToRerenderPerRnaComplex.push({
          rnaMoleculeName,
          nucleotideIndex
        });
        if (rnaMoleculeName !== mappedBasePairInformation.rnaMoleculeName) {
          this.dragError = {
            errorMessage : "A base pair with another RNA molecule was found. Cannot drag the clicked-on RNA molecule."
          };
          break;
        }
      }
    }
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps),
      toBeDragged,
      function() {
        setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
        setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
      }
    );
    this.editMenuHeader = <>
      <b>
        Edit RNA molecule:
      </b>
      <br/>
      Name:&nbsp;
    </>;
    this.editMenuProps = {
      initialName : rnaMoleculeName,
      rnaComplexProps : rnaComplexProps,
      rnaComplexIndex : fullKeys.rnaComplexIndex,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender
    };
  }

  public override drag() {
    if (this.dragError !== undefined) {
      throw this.dragError;
    }
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>
      {this.editMenuHeader}
      <RnaMoleculeInteractionConstraintEditMenu.Component
        {...this.editMenuProps}
      />
    </>;
  }
}