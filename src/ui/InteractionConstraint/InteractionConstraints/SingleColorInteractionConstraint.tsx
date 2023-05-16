import { DragListener, RnaComplexProps, FullKeys } from "../../../App";
import { SingleColorInteractionConstraintEditMenu } from "../../../components/app_specific/edit_menus/SingleColorInteractionConstraintEditMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { BLACK, areEqual } from "../../../data_structures/Color";
import { Vector2D } from "../../../data_structures/Vector2D";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint } from "../InteractionConstraints";

export class SingleColorInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly anchor : Vector2D;
  private readonly toBeDragged : Array<Vector2D>;
  private readonly rerender : () => void;

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
    this.toBeDragged = toBeDragged;
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
    const basePairKeysToRerender : BasePairKeysToRerender = {};

    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    this.anchor = singularNucleotideProps;
    const color = singularNucleotideProps.color ?? BLACK;

    const rnaComplexIndices = Object.keys(this.rnaComplexProps).map(Number.parseInt);
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
        const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps).map(function(nucleotideIndexAsString) {
          return Number.parseInt(nucleotideIndexAsString);
        });
        for (let nucleotideIndex of nucleotideIndices) {
          const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
          if (areEqual(
            color,
            singularNucleotideProps.color ?? BLACK
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
              if (!areEqual(
                color,
                singularBasePairedNucleotideProps.color ?? BLACK
              )) {
                const error : InteractionConstraintError = {
                  errorMessage : "Cannot drag nucleotides base-paired with different colors using this selection constraint."
                };
                throw error;
              }
            }
          }
        }
      }
    }
    const rerender = () => {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.rerender = rerender;
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps),
      toBeDragged,
      rerender
    );
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>
      <b>
        Position of clicked-on nucleotide:
      </b>
      <br/>
      <SingleColorInteractionConstraintEditMenu.Component
        {...this.anchor}
        toBeDragged = {this.toBeDragged}
        rerender = {this.rerender}
      />
    </>;
  }
}