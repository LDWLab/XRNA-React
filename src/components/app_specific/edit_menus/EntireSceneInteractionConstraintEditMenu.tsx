import { useContext, useState } from "react";
import { Context } from "../../../context/Context";

export namespace EntireSceneInteractionConstraintEditMenu {
  export type Props = {};

  export function Component(props : Props) {
    // Begin context data.
    const _complexDocumentName = useContext(Context.App.ComplexDocumentName);
    const _setComplexDocumentName = useContext(Context.App.SetComplexDocumentName);
    // Begin state data.
    const [
      complexDocumentName,
      setComplexDocumentName
    ] = useState(_complexDocumentName);
    return <>
      <label>
        Complex document name:&nbsp;
        <input
          type = "text"
          value = {complexDocumentName}
          onChange = {function(e) {
            const newComplexDocumentName = e.target.value;
            setComplexDocumentName(newComplexDocumentName);
            _setComplexDocumentName(newComplexDocumentName);
          }}
        />
      </label>
    </>;
  }
}