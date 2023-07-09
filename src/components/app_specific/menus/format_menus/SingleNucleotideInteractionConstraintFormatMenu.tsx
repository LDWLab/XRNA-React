import { BasePairsEditor } from "../../editors/BasePairsEditor";

export namespace SingleNucleotideInteractionConstraintFormatMenu {
  export type Props = BasePairsEditor.Props;

  export function Component(props : Props) {
    return <BasePairsEditor.Component
      {...props}
    />;
  }
}