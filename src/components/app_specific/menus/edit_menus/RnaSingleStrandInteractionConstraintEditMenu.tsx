import { useState } from "react";
import InputWithValidator from "../../../generic/InputWithValidator";

export namespace RnaSingleStrandInteractionConstraintEditMenu {
  export type Props = {
    initialDisplacementAlongNormal : number,
    updateSingleStrand : (orientation : Orientation, displacementAlongNormal : number) => void
  };

  export enum Orientation {
    CLOCKWISE = "clockwise",
    COUNTERCLOCKWISE = "counterclockwise",
    STRAIGHT = "straight"
  }

  export function Component(props : Props) {
    const {
      initialDisplacementAlongNormal,
      updateSingleStrand
    } = props;
    // Begin state data.
    const [
      orientation,
      _setOrientation
    ] = useState<Orientation | undefined>(undefined);
    const [
      displacementAlongNormal,
      setDisplacementAlongNormal
    ] = useState(initialDisplacementAlongNormal);
    const radioButtonName = "orientation";
    function setOrientation(
      newOrientation : Orientation
    ) {
      _setOrientation(newOrientation);
      updateSingleStrand(
        newOrientation,
        displacementAlongNormal
      );
    }
    return <>
      <b>
        Orientation:
      </b>
      <br/>
      <label>
        Clockwise:&nbsp;
        <input
          type = "radio"
          value = "clockwise"
          name = {radioButtonName}
          onClick = {function() {
            setOrientation(Orientation.CLOCKWISE);
          }}
        />
      </label>
      <br/>
      <label>
        Straight:&nbsp;
        <input
          type = "radio"
          value = "straight"
          name = {radioButtonName}
          onClick = {function() {
            setOrientation(Orientation.STRAIGHT);
          }}
        />
      </label>
      <br/>
      <label>
        Counterclockwise:&nbsp;
        <input
          type = "radio"
          value = "counterclockwise"
          name = {radioButtonName}
          onClick = {function() {
            setOrientation(Orientation.COUNTERCLOCKWISE);
          }}
        />
      </label>
      <br/>
      <label
        style = {{
          display : orientation === Orientation.CLOCKWISE || orientation === Orientation.COUNTERCLOCKWISE ? "block" : "none"
        }}
      >
        Displacement along normal:&nbsp;
        <InputWithValidator.Number
          value = {displacementAlongNormal}
          setValue = {function(newDisplacementAlongNormal) {
            setDisplacementAlongNormal(newDisplacementAlongNormal);
            updateSingleStrand(
              orientation as Orientation,
              newDisplacementAlongNormal
            );
          }}
        />
      </label>
    </>;
  }
}