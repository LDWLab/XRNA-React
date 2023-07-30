import { useContext, useState } from "react";
import BasePair from "../../BasePair";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";

export namespace SingleBasePairInteractionConstraintEditMenu {
  export type Props = AppSpecificOrientationEditor.SimplifiedProps & {
    basePairType : BasePair.Type
  };

  export function Component(props : Props) {
    return <>
      Base-pair type: {props.basePairType.toLocaleLowerCase()}
      <br/>
      <AppSpecificOrientationEditor.Simplified
        {...props}
      />
    </>;
  }
}