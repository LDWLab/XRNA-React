import { DragListener, FullKeys, RnaComplexProps } from "../../../App";
import { RnaComplexInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/RnaComplexInteractionConstraintEditMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { parseInteger } from "../../../utils/Utils";
import { AbstractInteractionConstraint } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint } from "../InteractionConstraints";

export class RnaComplexInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly rightClickMenuProps : RnaComplexInteractionConstraintEditMenu.Props;

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
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {}
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    const toBeDragged = new Array<Vector2D>();
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    for (let rnaMoleculeName of Object.keys(singularRnaComplexProps.rnaMoleculeProps)) {
      nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
      const nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
      const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
      const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps).map(parseInteger);
      for (let nucleotideIndex of nucleotideIndices) {
        const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
        toBeDragged.push(singularNucleotideProps);
        nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
        if (nucleotideIndex in basePairsPerRnaMolecule) {
          basePairKeysToRerenderPerRnaComplex.push({
            rnaMoleculeName,
            nucleotideIndex
          });
        }
      }
    }
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
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
      rerender,
      singularRnaComplexProps
    };
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>
      <b>
        Edit RNA complex:
      </b>
      <br/>
      <RnaComplexInteractionConstraintEditMenu.Component
        {...this.rightClickMenuProps}
      />
    </>;
  }
}