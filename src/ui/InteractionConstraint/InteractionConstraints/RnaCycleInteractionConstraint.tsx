import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";

export class RnaCycleInteractionConstraint extends AbstractInteractionConstraint {
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
  }

  public override drag() : DragListener {
    const error : InteractionConstraintError = {
      errorMessage : "This interaction constraint does not support dragging."
    };
    throw error;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>Not yet implemented.</>;
  }
}