import { DragListener, FullKeys, RnaComplexProps } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint } from "../InteractionConstraints";

export class RnaMoleculeInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly dragError? : InteractionConstraintError;

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
    const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps).map(function(nucleotideIndexAsString : string) {
      return Number.parseInt(nucleotideIndexAsString);
    });
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
  }

  public override drag() {
    if (this.dragError !== undefined) {
      throw this.dragError;
    }
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>Not yet implemented.</>;
  }
}