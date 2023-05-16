import { RnaComplexProps, FullKeys } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { AbstractInteractionConstraint, basePairedNucleotideError } from "../AbstractInteractionConstraint";
import { SingleNucleotideInteractionConstraintEditMenu } from "../../../components/app_specific/edit_menus/SingleNucleotideInteractionConstraintEditMenu";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { InteractionConstraint } from "../InteractionConstraints";

export class SingleNucleotideInteractionConstraint extends AbstractInteractionConstraint {
  private readonly singularNucleotideProps : Nucleotide.ExternalProps;

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
    const {
      basePairs
    } = singularRnaComplexProps;
    if (rnaMoleculeName in basePairs && nucleotideIndex in basePairs[rnaMoleculeName]) {
      throw basePairedNucleotideError;
    }
    this.singularNucleotideProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
  }

  public override drag() {
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const singularNucleotideProps = this.singularNucleotideProps;
    const setNucleotideKeysToRerender = this.setNucleotideKeysToRerender;
    return {
      initiateDrag() {
        return {
          x : singularNucleotideProps.x,
          y : singularNucleotideProps.y
        };
      },
      continueDrag(totalDrag : Vector2D) {
        singularNucleotideProps.x = totalDrag.x;
        singularNucleotideProps.y = totalDrag.y;
        setNucleotideKeysToRerender({
          [rnaComplexIndex] : {
            [rnaMoleculeName] : [nucleotideIndex]
          }
        });
      }
    };
  }
  
  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const setNucleotideKeysToRerender = this.setNucleotideKeysToRerender;
    return <SingleNucleotideInteractionConstraintEditMenu.Component
      rnaComplexProps = {this.rnaComplexProps}
      fullKeys = {this.fullKeys}
      triggerRerender = {function() {
        setNucleotideKeysToRerender({
          [rnaComplexIndex] : {
            [rnaMoleculeName] : [nucleotideIndex]
          }
        });
      }}
    />;
  }
};