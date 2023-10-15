import { useEffect, useState } from "react";
import InputWithValidator from "../../../generic/InputWithValidator";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import Color, { BLACK } from "../../../../data_structures/Color";

export namespace RnaSingleStrandInteractionConstraintEditMenu {
  export type Props = {
    initialDisplacementAlongNormal : number,
    updateSingleStrandPositions : (orientation : Orientation, displacementAlongNormal : number) => void,
    updateSingleStrandColors : (newColor : Color) => void,
    initialColor : Color
  };

  export enum Orientation {
    CLOCKWISE = "clockwise",
    COUNTERCLOCKWISE = "counterclockwise",
    STRAIGHT = "straight"
  }

  export function Component(props : Props) {
    const {
      initialDisplacementAlongNormal,
      updateSingleStrandPositions,
      updateSingleStrandColors,
      initialColor
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
    const [
      color,
      setColor
    ] = useState(initialColor);
    // Begin effects
    useEffect(
      function() {
        setDisplacementAlongNormal(initialDisplacementAlongNormal);
      },
      [initialDisplacementAlongNormal]
    );
    const radioButtonName = "orientation";
    function setOrientation(
      newOrientation : Orientation
    ) {
      _setOrientation(newOrientation);
      updateSingleStrandPositions(
        newOrientation,
        displacementAlongNormal
      );
    }
    useEffect(
      function() {
        setColor(initialColor);
      },
      [initialColor]
    );
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
            updateSingleStrandPositions(
              orientation as Orientation,
              newDisplacementAlongNormal
            );
          }}
        />
      </label>
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          updateSingleStrandColors(newColor);
          setColor(newColor);
        }}
      />
    </>;
  }
}