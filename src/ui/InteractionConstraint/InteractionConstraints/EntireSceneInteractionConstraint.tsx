import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { EntireSceneInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/EntireSceneInteractionConstraintEditMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { AbstractInteractionConstraint } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";

export class EntireSceneInteractionConstraint extends AbstractInteractionConstraint {
  private readonly rightClickMenuProps : EntireSceneInteractionConstraintEditMenu.Props;

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
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
    const basePairKeysToRerender : BasePairKeysToRerender = {};
    this.rightClickMenuProps = {
      rnaComplexProps : this.rnaComplexProps,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender
    };
  }

  public override drag() {
    return undefined;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>
      <b>
        Edit entire scene: 
      </b>
      <br/>
      <EntireSceneInteractionConstraintEditMenu.Component
        {...this.rightClickMenuProps}
      />
    </>;
  }
}