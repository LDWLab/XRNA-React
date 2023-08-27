import { useMemo, useState } from "react";
import InputWithValidator from "../../../components/generic/InputWithValidator";

export namespace RnaCycleInteractionConstraintEditMenu {
  export type Props = {
    initialRadius : number,
    minimumRadius : number,
    updatePositionsHelper : (newRadius : number) => void
  };

  export function Component(props : Props) {
    const {
      initialRadius,
      minimumRadius,
      updatePositionsHelper
    } = props;
    // Begin state data.
    const [
      radius,
      setRadius
    ] = useState(initialRadius);
    return <>
      <button
        onClick = {function() {
          updatePositionsHelper(radius);
        }}
      >
        Normalize
      </button>
      <br/>
      <label>
        Radius:&nbsp;
        <InputWithValidator.Number
          value = {radius}
          setValue = {function(newRadius : number) {
            setRadius(newRadius);
            updatePositionsHelper(newRadius);
          }}
          min = {minimumRadius}
        />
      </label>
    </>;
  }
};